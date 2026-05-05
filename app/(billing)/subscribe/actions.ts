"use server";

import { z } from "zod";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe/client";
import {
  getPriceId,
  type Tier,
  type BillingInterval,
} from "@/lib/stripe/prices";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customers";
import { getClaims } from "@/lib/auth/get-claims";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { ActionResult } from "@/types";

const InputSchema = z
  .object({
    tier: z.enum(["consumer", "fleet"]),
    interval: z.enum(["month", "year"]),
  })
  .refine((v) => !(v.tier === "fleet" && v.interval === "year"), {
    message: "Fleet tier has no annual plan",
  });

export async function createCheckoutSession(
  input: { tier: Tier; interval: BillingInterval },
): Promise<ActionResult<{ url: string }>> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { tier, interval } = parsed.data;

  const claims = await getClaims();
  if (!claims) return { success: false, error: "Unauthorized" };

  const serviceClient = createServiceRoleClient();
  const { data: existing } = await serviceClient
    .from("subscriptions")
    .select("id")
    .eq("user_id", claims.userId)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You already have an active subscription" };
  }

  const customerId = await getOrCreateStripeCustomer(claims.userId, claims.email);
  const priceId = getPriceId(tier, interval);
  const dateBucket = new Date().toISOString().slice(0, 10);

  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}/subscribe?canceled=1`,
      client_reference_id: claims.userId,
      subscription_data: { metadata: { user_id: claims.userId } },
      allow_promotion_codes: true,
    },
    {
      idempotencyKey: `checkout:${claims.userId}:${tier}:${interval}:${dateBucket}`,
    },
  );

  if (!session.url) {
    return { success: false, error: "Stripe did not return a checkout URL" };
  }

  return { success: true, data: { url: session.url } };
}

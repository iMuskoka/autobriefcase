import "server-only";
import type Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getTierFromPriceId } from "./prices";
import { getUserIdFromCustomerId } from "./customers";

export async function upsertSubscriptionFromStripe(
  sub: Stripe.Subscription,
  sourceEventId: string | null,
): Promise<void> {
  const serviceClient = createServiceRoleClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await getUserIdFromCustomerId(customerId);

  const item = sub.items.data[0];
  if (!item) throw new Error(`Subscription ${sub.id} has no items`);
  const { tier, interval } = getTierFromPriceId(item.price.id);

  const { data: prev } = await serviceClient
    .from("subscriptions")
    .select("id, status")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  const upsertData = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    tier,
    billing_interval: interval,
    current_period_end: new Date(item.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
  };

  const { data: upserted, error } = await serviceClient
    .from("subscriptions")
    .upsert(upsertData, { onConflict: "stripe_subscription_id" })
    .select("id, status")
    .single();

  if (error || !upserted) {
    throw new Error(
      `Failed to upsert subscription ${sub.id}: ${error?.message ?? "no row returned"}`,
    );
  }

  if ((prev?.status ?? null) !== upserted.status) {
    await serviceClient.from("subscription_history").insert({
      subscription_id: upserted.id,
      from_status: prev?.status ?? null,
      to_status: upserted.status,
      stripe_event_id: sourceEventId,
    });
  }
}

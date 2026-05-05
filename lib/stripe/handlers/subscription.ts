import "server-only";
import type Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { upsertSubscriptionFromStripe } from "../upsert-subscription";

export type HandlerContext = { event: Stripe.Event };

export async function handleSubscriptionUpsert(ctx: HandlerContext) {
  const sub = ctx.event.data.object as Stripe.Subscription;
  await upsertSubscriptionFromStripe(sub, ctx.event.id);
}

export async function handleSubscriptionDeleted(ctx: HandlerContext) {
  const sub = ctx.event.data.object as Stripe.Subscription;
  const serviceClient = createServiceRoleClient();

  const { data: prev } = await serviceClient
    .from("subscriptions")
    .select("id, status")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  if (!prev) return;

  const { error } = await serviceClient
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("id", prev.id);

  if (error) {
    throw new Error(`Failed to cancel subscription ${sub.id}: ${error.message}`);
  }

  if (prev.status !== "canceled") {
    await serviceClient.from("subscription_history").insert({
      subscription_id: prev.id,
      from_status: prev.status,
      to_status: "canceled",
      stripe_event_id: ctx.event.id,
    });
  }
}

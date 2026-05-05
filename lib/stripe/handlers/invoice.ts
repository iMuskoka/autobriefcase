import "server-only";
import type Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { HandlerContext } from "./subscription";

export async function handleInvoicePaid(_ctx: HandlerContext) {
  // customer.subscription.updated also fires and is the canonical write path.
  // This handler is a hook for Story 7.3 (billing history). No-op for now.
}

export async function handleInvoicePaymentFailed(ctx: HandlerContext) {
  const invoice = ctx.event.data.object as Stripe.Invoice;
  const subRef = invoice.parent?.subscription_details?.subscription;
  const subId = typeof subRef === "string" ? subRef : subRef?.id;
  if (!subId) return;

  const serviceClient = createServiceRoleClient();

  const { data: prev } = await serviceClient
    .from("subscriptions")
    .select("id, status")
    .eq("stripe_subscription_id", subId)
    .maybeSingle();

  if (!prev || prev.status === "past_due") return;

  const { error } = await serviceClient
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("id", prev.id);

  if (error) {
    throw new Error(`Failed to mark subscription ${subId} past_due: ${error.message}`);
  }

  await serviceClient.from("subscription_history").insert({
    subscription_id: prev.id,
    from_status: prev.status,
    to_status: "past_due",
    stripe_event_id: ctx.event.id,
  });
}

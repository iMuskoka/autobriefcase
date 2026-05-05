import "server-only";
import type { HandlerContext } from "./subscription";

export async function handleCheckoutSessionCompleted(_ctx: HandlerContext) {
  // No-op for now: the success page Server Component reconciles synchronously
  // via Stripe-first fetch, and `customer.subscription.created` writes the row.
  // This handler exists so we acknowledge the event (Stripe stops retrying)
  // and have a hook for future logic (e.g. analytics, welcome email).
}

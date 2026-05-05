import "server-only";
import type Stripe from "stripe";
import {
  handleSubscriptionUpsert,
  handleSubscriptionDeleted,
  type HandlerContext,
} from "./subscription";
import { handleCheckoutSessionCompleted } from "./checkout-session";
import { handleInvoicePaid, handleInvoicePaymentFailed } from "./invoice";

type Handler = (ctx: HandlerContext) => Promise<void>;

const HANDLERS: Record<string, Handler> = {
  "checkout.session.completed": handleCheckoutSessionCompleted,
  "customer.subscription.created": handleSubscriptionUpsert,
  "customer.subscription.updated": handleSubscriptionUpsert,
  "customer.subscription.deleted": handleSubscriptionDeleted,
  "invoice.paid": handleInvoicePaid,
  "invoice.payment_failed": handleInvoicePaymentFailed,
};

export function getHandler(event: Stripe.Event): Handler | null {
  return HANDLERS[event.type] ?? null;
}

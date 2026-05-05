import "server-only";
import { env } from "@/lib/env";

export type Tier = "consumer" | "fleet";
export type BillingInterval = "month" | "year";

type PriceKey = `${Tier}_${BillingInterval}`;

const PRICE_BY_KEY: Partial<Record<PriceKey, string>> = {
  consumer_month: env.STRIPE_PRICE_CONSUMER_MONTHLY,
  consumer_year: env.STRIPE_PRICE_CONSUMER_YEARLY,
  fleet_month: env.STRIPE_PRICE_FLEET_MONTHLY,
  // fleet_year is intentionally absent — Fleet tier has no annual variant.
};

const KEY_BY_PRICE: Record<string, { tier: Tier; interval: BillingInterval }> = {
  [env.STRIPE_PRICE_CONSUMER_MONTHLY]: { tier: "consumer", interval: "month" },
  [env.STRIPE_PRICE_CONSUMER_YEARLY]: { tier: "consumer", interval: "year" },
  [env.STRIPE_PRICE_FLEET_MONTHLY]: { tier: "fleet", interval: "month" },
};

export function getPriceId(tier: Tier, interval: BillingInterval): string {
  const priceId = PRICE_BY_KEY[`${tier}_${interval}`];
  if (!priceId) {
    throw new Error(`No price configured for tier="${tier}" interval="${interval}"`);
  }
  return priceId;
}

export function getTierFromPriceId(
  priceId: string,
): { tier: Tier; interval: BillingInterval } {
  const match = KEY_BY_PRICE[priceId];
  if (!match) {
    throw new Error(`Unknown Stripe price_id: ${priceId}`);
  }
  return match;
}

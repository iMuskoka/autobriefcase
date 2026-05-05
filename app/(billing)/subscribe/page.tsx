import Link from "next/link";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import { getClaims } from "@/lib/auth/get-claims";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tier, BillingInterval } from "@/lib/stripe/prices";
import { SubscribeButton } from "./subscribe-button";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ canceled?: string }>;

type PlanDef = {
  key: string;
  tier: Tier;
  interval: BillingInterval;
  priceId: string;
  name: string;
  tagline: string;
  features: string[];
};

const PLANS: PlanDef[] = [
  {
    key: "consumer-month",
    tier: "consumer",
    interval: "month",
    priceId: env.STRIPE_PRICE_CONSUMER_MONTHLY,
    name: "Consumer",
    tagline: "Billed monthly",
    features: [
      "Unlimited vehicles in one personal fleet",
      "AI document extraction",
      "Renewal reminders by email",
    ],
  },
  {
    key: "consumer-year",
    tier: "consumer",
    interval: "year",
    priceId: env.STRIPE_PRICE_CONSUMER_YEARLY,
    name: "Consumer",
    tagline: "Billed annually",
    features: [
      "Everything in Consumer monthly",
      "Save vs. monthly billing",
    ],
  },
  {
    key: "fleet-month",
    tier: "fleet",
    interval: "month",
    priceId: env.STRIPE_PRICE_FLEET_MONTHLY,
    name: "Fleet",
    tagline: "Billed monthly",
    features: [
      "Everything in Consumer",
      "Multiple fleets",
      "Priority support",
    ],
  },
];

function formatPrice(amount: number | null, currency: string | undefined) {
  if (amount === null || !currency) return "—";
  const value = amount / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

async function loadPriceDisplay(priceId: string) {
  try {
    const price = await stripe.prices.retrieve(priceId);
    return {
      formatted: formatPrice(price.unit_amount, price.currency),
      intervalLabel: price.recurring?.interval ?? null,
    };
  } catch {
    return { formatted: "—", intervalLabel: null };
  }
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { canceled } = await searchParams;
  const claims = await getClaims();

  const priced = await Promise.all(
    PLANS.map(async (p) => ({ plan: p, ...(await loadPriceDisplay(p.priceId)) })),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Choose your plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with a 14-day reminder period. Cancel anytime from your billing portal.
          </p>
        </div>
        {claims && (
          <Button asChild variant="outline" size="sm">
            <Link href="/fleet">Back to fleet</Link>
          </Button>
        )}
      </div>

      {canceled && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          Checkout was canceled. Pick a plan below when you&apos;re ready.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {priced.map(({ plan, formatted, intervalLabel }) => (
          <Card key={plan.key} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.tagline}</CardDescription>
              <div className="mt-3 text-3xl font-semibold">
                {formatted}
                {intervalLabel && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    /{intervalLabel}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6">
              <ul className="flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="text-muted-foreground">
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {claims ? (
                <SubscribeButton
                  tier={plan.tier}
                  interval={plan.interval}
                  label={`Subscribe to ${plan.name}`}
                />
              ) : (
                <Button asChild className="w-full min-h-[44px]">
                  <Link href="/sign-in">Sign in to subscribe</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

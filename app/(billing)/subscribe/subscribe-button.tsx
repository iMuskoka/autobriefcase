"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "./actions";
import type { Tier, BillingInterval } from "@/lib/stripe/prices";

export function SubscribeButton({
  tier,
  interval,
  label,
}: {
  tier: Tier;
  interval: BillingInterval;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);

  const onClick = () => {
    startTransition(async () => {
      const result = await createCheckoutSession({ tier, interval });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRedirecting(true);
      window.location.assign(result.data.url);
    });
  };

  const busy = isPending || redirecting;
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-full min-h-[44px]"
    >
      {redirecting ? "Redirecting…" : isPending ? "Starting checkout…" : label}
    </Button>
  );
}

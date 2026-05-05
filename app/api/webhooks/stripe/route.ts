import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe/client";
import { getHandler } from "@/lib/stripe/handlers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return new NextResponse(`Webhook signature verification failed: ${message}`, {
      status: 400,
    });
  }

  const serviceClient = createServiceRoleClient();

  const { data: claimed, error: claimError } = await serviceClient
    .from("stripe_events")
    .insert({ event_id: event.id, type: event.type })
    .select("event_id")
    .maybeSingle();

  if (claimError) {
    if (claimError.code === "23505") {
      return NextResponse.json({ received: true, deduped: true });
    }
    return new NextResponse(`Failed to record event: ${claimError.message}`, {
      status: 500,
    });
  }
  if (!claimed) {
    return NextResponse.json({ received: true, deduped: true });
  }

  const handler = getHandler(event);
  if (!handler) {
    await serviceClient
      .from("stripe_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", event.id);
    return NextResponse.json({ received: true, handled: false });
  }

  try {
    await handler({ event });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    console.error(`[stripe webhook] ${event.type} ${event.id} failed:`, message);
    return new NextResponse(`Handler error: ${message}`, { status: 500 });
  }

  await serviceClient
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("event_id", event.id);

  return NextResponse.json({ received: true, handled: true });
}

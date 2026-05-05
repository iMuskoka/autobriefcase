import { stripe } from "@/lib/stripe/client";
import { upsertSubscriptionFromStripe } from "@/lib/stripe/upsert-subscription";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ session_id?: string }>;

export default async function SubscribeSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-xl font-semibold">Missing session</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No checkout session was provided.
        </p>
      </main>
    );
  }

  let activated = false;
  let errorMessage: string | null = null;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription", "subscription.items.data.price"],
    });

    const subscription = session.subscription;
    if (subscription && typeof subscription !== "string") {
      await upsertSubscriptionFromStripe(subscription, null);
      activated = true;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to confirm subscription";
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold">
        {activated ? "Subscription active" : "Almost there"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {activated
          ? "Thanks — your subscription is set up."
          : errorMessage
            ? `We could not confirm your subscription yet: ${errorMessage}`
            : "We are activating your subscription. Refresh in a moment."}
      </p>
    </main>
  );
}

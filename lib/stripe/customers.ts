import "server-only";
import { stripe } from "./client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function getUserIdFromCustomerId(customerId: string): Promise<string> {
  const serviceClient = createServiceRoleClient();
  const { data: profile } = await serviceClient
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (profile?.id) return profile.id;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    throw new Error(`Stripe customer ${customerId} is deleted`);
  }
  const userId = customer.metadata?.user_id;
  if (!userId) {
    throw new Error(
      `Cannot map Stripe customer ${customerId} to a user (no metadata.user_id and no user_profiles match)`,
    );
  }
  return userId;
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | null,
): Promise<string> {
  const serviceClient = createServiceRoleClient();
  const { data: profile, error: lookupError } = await serviceClient
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (lookupError) {
    throw new Error(
      `Failed to look up user_profiles for ${userId}: ${lookupError.message}`,
    );
  }

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { user_id: userId },
  });

  const { error: updateError } = await serviceClient
    .from("user_profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  if (updateError) {
    throw new Error(
      `Stripe customer ${customer.id} created but failed to persist for user ${userId}: ${updateError.message}`,
    );
  }

  return customer.id;
}

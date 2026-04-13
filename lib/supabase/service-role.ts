import { createClient } from "@supabase/supabase-js";

// NEVER import or call this from client components or user-facing Server Actions.
// This client uses the service role key which bypasses RLS — for server-only cron use only.
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service role configuration");
  }
  return createClient(url, serviceKey);
}

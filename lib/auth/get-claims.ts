import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AuthClaims = {
  userId: string;
  email: string | null;
};

export async function getClaims(): Promise<AuthClaims | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return {
    userId: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
}

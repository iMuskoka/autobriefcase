"use server";

import { createClient } from "@/lib/supabase/server";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";

export async function signUpAction(
  email: string,
  password: string,
): Promise<ActionResult<void>> {
  const parsed = signUpSchema
    .pick({ email: true, password: true })
    .safeParse({ email, password });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin =
    headersList.get("origin") ??
    (() => {
      const proto =
        headersList.get("x-forwarded-proto") ?? "https";
      const host = headersList.get("host") ?? "";
      return `${proto}://${host}`;
    })();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/fleet`,
    },
  });

  if (error) return { success: false, error: error.message };

  // Email confirmation disabled — session exists, user is signed in immediately
  if (data.session) {
    redirect("/fleet");
  }

  // Email confirmation required — signal form to show "check email" state
  return { success: true, data: undefined };
}

export async function signInAction(
  email: string,
  password: string,
): Promise<ActionResult<void>> {
  const parsed = signInSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Normalize — do not surface Supabase's raw message; prevents revealing which credential is wrong
    return { success: false, error: "Invalid email or password" };
  }

  redirect("/fleet");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function forgotPasswordAction(
  email: string,
): Promise<ActionResult<void>> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const headersList = await headers();
  const origin =
    headersList.get("origin") ??
    (() => {
      const proto = headersList.get("x-forwarded-proto") ?? "https";
      const host = headersList.get("host") ?? "";
      return `${proto}://${host}`;
    })();

  const supabase = await createClient();

  // Fire-and-ignore — intentionally do not inspect error:
  // Supabase silently no-ops for unregistered emails; revealing
  // the error would allow user enumeration.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  return { success: true, data: undefined };
}

export async function updatePasswordAction(
  password: string,
): Promise<ActionResult<void>> {
  const parsed = updatePasswordSchema
    .innerType()
    .pick({ password: true })
    .safeParse({ password });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { success: false, error: error.message };

  redirect("/fleet");
}

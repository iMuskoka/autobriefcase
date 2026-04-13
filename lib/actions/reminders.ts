"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

const leadTimeSchema = z.union([
  z.literal(14),
  z.literal(30),
  z.literal(60),
  z.literal(90),
]);

export async function updateReminderSettings(
  reminderId: string,
  leadTimeDays: number,
  vehicleId: string,
  documentId: string,
): Promise<ActionResult<void>> {
  const parsed = leadTimeSchema.safeParse(leadTimeDays);
  if (!parsed.success) {
    return { success: false, error: "Invalid lead time" };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = claims.claims.sub as string;

  const { data, error } = await supabase
    .from("reminders")
    .update({ lead_time_days: parsed.data })
    .eq("id", reminderId)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Reminder update error:", error);
    return { success: false, error: "Failed to update reminder." };
  }

  revalidatePath(`/fleet/${vehicleId}/documents/${documentId}`);
  return { success: true, data: undefined };
}

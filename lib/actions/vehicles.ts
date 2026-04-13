"use server";

import { createClient } from "@/lib/supabase/server";
import { vehicleSchema, type VehicleFormValues } from "@/lib/validations/vehicle";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";

export async function createVehicle(
  values: VehicleFormValues,
): Promise<ActionResult<void>> {
  const parsed = vehicleSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("vehicles").insert({
    user_id: data.claims.sub,
    category: parsed.data.category,
    make: parsed.data.make,
    model: parsed.data.model,
    year: parsed.data.year,
    nickname: parsed.data.nickname || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    console.error("Vehicle creation error:", error);
    return { success: false, error: "Failed to create vehicle. Try again." };
  }

  redirect("/fleet");
}

export async function updateVehicle(
  vehicleId: string,
  values: VehicleFormValues,
): Promise<ActionResult<void>> {
  const parsed = vehicleSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: updated, error } = await supabase
    .from("vehicles")
    .update({
      category: parsed.data.category,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      nickname: parsed.data.nickname || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", vehicleId)
    .select("id");

  if (error) {
    console.error("Vehicle update error:", error);
    return { success: false, error: "Failed to update vehicle. Try again." };
  }

  // RLS filters out rows belonging to other users — 0 rows = not found or unauthorized
  if (!updated || updated.length === 0) {
    return { success: false, error: "Not found" };
  }

  redirect(`/fleet/${vehicleId}`);
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";
import type { DocumentType } from "@/lib/validations/document";

export async function saveDocument(
  vehicleId: string,
  storagePath: string,
  documentType: DocumentType,
  fileName: string,
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify vehicle belongs to user (RLS on vehicles filters by user_id)
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .single();

  if (!vehicle) {
    return { success: false, error: "Not found" };
  }

  const { error } = await supabase.from("documents").insert({
    user_id:       claims.claims.sub,
    vehicle_id:    vehicleId,
    storage_path:  storagePath,
    document_type: documentType,
    file_name:     fileName,
  });

  if (error) {
    console.error("Document save error:", error);
    return { success: false, error: "Failed to save document. Try again." };
  }

  redirect(`/fleet/${vehicleId}`);
}

export async function deleteDocument(
  documentId: string,
  vehicleId: string,
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { success: false, error: "Unauthorized" };
  }

  // Fetch first to get storage_path — RLS enforces ownership
  const { data: document } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", documentId)
    .eq("vehicle_id", vehicleId)
    .single();

  if (!document) {
    return { success: false, error: "Not found" };
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    console.error("Document delete error:", deleteError);
    return { success: false, error: "Failed to delete document. Try again." };
  }

  // Delete from Storage — failure is logged but does not block redirect
  const { error: storageError } = await supabase.storage
    .from("vehicle-documents")
    .remove([document.storage_path]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
  }

  redirect(`/fleet/${vehicleId}`);
}

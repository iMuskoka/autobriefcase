"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ActionResult, ExtractionResult } from "@/types";
import type { DocumentType } from "@/lib/validations/document";
import { extractDocument } from "@/lib/ai/extract-document";
import { createDownloadUrl } from "@/lib/storage/signed-urls";

export async function saveDocument(
  vehicleId: string,
  storagePath: string,
  documentType: DocumentType,
  fileName: string,
  confirmedFields?: {
    expiryDate?: string | null;
    holderName?: string | null;
    policyNumber?: string | null;
    issuerName?: string | null;
  },
): Promise<ActionResult<{ reminderDate: string | null }>> {
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

  const { data: insertedDoc, error } = await supabase
    .from("documents")
    .insert({
      user_id:       claims.claims.sub,
      vehicle_id:    vehicleId,
      storage_path:  storagePath,
      document_type: documentType,
      file_name:     fileName,
      expiry_date:   confirmedFields?.expiryDate   ?? null,
      holder_name:   confirmedFields?.holderName   ?? null,
      policy_number: confirmedFields?.policyNumber ?? null,
      issuer_name:   confirmedFields?.issuerName   ?? null,
    })
    .select("id")
    .single();

  if (error || !insertedDoc) {
    console.error("Document save error:", error);
    return { success: false, error: "Failed to save document. Try again." };
  }

  let reminderDate: string | null = null;
  if (confirmedFields?.expiryDate) {
    const { error: reminderError } = await supabase.from("reminders").insert({
      user_id:        claims.claims.sub,
      vehicle_id:     vehicleId,
      document_id:    insertedDoc.id,
      expiry_date:    confirmedFields.expiryDate,
      lead_time_days: 30,
      status:         "pending",
    });
    if (!reminderError) {
      reminderDate = confirmedFields.expiryDate;
    } else {
      console.error("Reminder creation error:", reminderError);
      // Non-fatal: document saved; reminder silently skipped; toast shows "Saved."
    }
  }

  return { success: true, data: { reminderDate } };
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

export async function updateDocument(
  documentId: string,
  vehicleId: string,
  fields: {
    documentType: DocumentType;
    holderName?: string | null;
    expiryDate?: string | null;
    policyNumber?: string | null;
    issuerName?: string | null;
  },
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify document belongs to user (via vehicle ownership — RLS enforces user_id)
  const { data: document } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("vehicle_id", vehicleId)
    .single();

  if (!document) {
    return { success: false, error: "Not found" };
  }

  const { error } = await supabase
    .from("documents")
    .update({
      document_type: fields.documentType,
      holder_name:   fields.holderName   ?? null,
      expiry_date:   fields.expiryDate   ?? null,
      policy_number: fields.policyNumber ?? null,
      issuer_name:   fields.issuerName   ?? null,
    })
    .eq("id", documentId)
    .eq("vehicle_id", vehicleId);

  if (error) {
    console.error("Document update error:", error);
    return { success: false, error: "Failed to save. Try again." };
  }

  return { success: true, data: undefined };
}

export async function markRenewed(
  oldReminderId: string,
  vehicleId: string,
  storagePath: string,
  documentType: DocumentType,
  fileName: string,
  confirmedFields: {
    expiryDate?:   string | null;
    holderName?:   string | null;
    policyNumber?: string | null;
    issuerName?:   string | null;
  },
  leadTimeDays: number,
): Promise<ActionResult<{ nextReminderDate: string | null }>> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = claims.claims.sub as string;

  // Verify vehicle belongs to user (RLS enforces ownership)
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .single();

  if (!vehicle) {
    return { success: false, error: "Not found" };
  }

  if (!Number.isInteger(leadTimeDays) || leadTimeDays < 1 || leadTimeDays > 365) {
    return { success: false, error: "Invalid lead time." };
  }

  // Insert new document row
  const { data: insertedDoc, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id:       userId,
      vehicle_id:    vehicleId,
      storage_path:  storagePath,
      document_type: documentType,
      file_name:     fileName,
      expiry_date:   confirmedFields?.expiryDate   ?? null,
      holder_name:   confirmedFields?.holderName   ?? null,
      policy_number: confirmedFields?.policyNumber ?? null,
      issuer_name:   confirmedFields?.issuerName   ?? null,
    })
    .select("id")
    .single();

  if (docError || !insertedDoc) {
    console.error("markRenewed document save error:", docError);
    return { success: false, error: "Failed to save document. Try again." };
  }

  // Insert new reminder with preserved lead_time_days — non-fatal
  let nextReminderDate: string | null = null;
  if (confirmedFields?.expiryDate) {
    const { error: reminderError } = await supabase.from("reminders").insert({
      user_id:        userId,
      vehicle_id:     vehicleId,
      document_id:    insertedDoc.id,
      expiry_date:    confirmedFields.expiryDate,
      lead_time_days: leadTimeDays,
      status:         "pending",
    });
    if (!reminderError) {
      // Compute fire date (expiry - leadTimeDays) — timezone-safe
      const [y, m, d] = confirmedFields.expiryDate.split("-").map(Number);
      const expiry = new Date(y, m - 1, d);
      const fireDate = new Date(expiry);
      fireDate.setDate(expiry.getDate() - leadTimeDays);
      nextReminderDate = [
        fireDate.getFullYear(),
        String(fireDate.getMonth() + 1).padStart(2, "0"),
        String(fireDate.getDate()).padStart(2, "0"),
      ].join("-");
    } else {
      console.error("markRenewed new reminder creation error:", reminderError);
    }
  }

  // Dismiss old reminder — non-fatal
  const { error: dismissError } = await supabase
    .from("reminders")
    .update({ status: "dismissed" })
    .eq("id", oldReminderId);

  if (dismissError) {
    console.error("markRenewed dismiss old reminder error:", dismissError);
  }

  return { success: true, data: { nextReminderDate } };
}

export async function confirmExtraction(
  vehicleId: string,
  storagePath: string,
): Promise<ActionResult<ExtractionResult>> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .single();

  if (!vehicle) {
    return { success: false, error: "Not found" };
  }

  try {
    const signedUrl = await createDownloadUrl(supabase, storagePath, 60);
    const fileName = storagePath.split("/").pop() ?? "document";
    const extractionResult = await extractDocument(signedUrl, fileName);
    return { success: true, data: extractionResult };
  } catch (error) {
    console.error("confirmExtraction error:", error);
    return { success: false, error: "Extraction failed" };
  }
}

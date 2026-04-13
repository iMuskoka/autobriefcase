import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generate a signed upload URL for Supabase Storage.
 * Client uploads directly to the returned URL via PUT (no Vercel involvement — ARCH-13).
 * Storage path format: {userId}/{vehicleId}/{timestamp}-{fileName}
 */
export async function createUploadUrl(
  supabase: SupabaseClient,
  userId: string,
  vehicleId: string,
  fileName: string,
): Promise<{ signedUrl: string; path: string }> {
  const path = `${userId}/${vehicleId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from("vehicle-documents")
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error("Failed to create signed upload URL");
  }

  return { signedUrl: data.signedUrl, path };
}

/**
 * Generate a short-lived signed download URL for Supabase Storage.
 * Generated server-side only (ARCH-14). Expires after expiresIn seconds.
 * Regenerated on every Server Component render — no client-side refresh needed.
 */
export async function createDownloadUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn = 900, // 15 minutes
  download?: string | boolean, // filename sets Content-Disposition: attachment for browser download
): Promise<string> {
  const storageRef = supabase.storage.from("vehicle-documents");
  const { data, error } =
    download !== undefined
      ? await storageRef.createSignedUrl(storagePath, expiresIn, { download })
      : await storageRef.createSignedUrl(storagePath, expiresIn);

  if (error || !data) {
    throw new Error("Failed to create signed download URL");
  }

  return data.signedUrl;
}

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

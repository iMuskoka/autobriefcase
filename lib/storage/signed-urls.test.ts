import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDownloadUrl } from "./signed-urls";

const makeSupabase = (override?: object) => {
  const createSignedUrl = vi.fn().mockResolvedValue({
    data: { signedUrl: "https://example.com/signed" },
    error: null,
    ...override,
  });
  return {
    storage: {
      from: vi.fn().mockReturnValue({ createSignedUrl }),
    },
    _createSignedUrl: createSignedUrl,
  };
};

describe("createDownloadUrl", () => {
  it("returns the signed URL string on success", async () => {
    const mock = makeSupabase();
    const url = await createDownloadUrl(
      mock as unknown as SupabaseClient,
      "user-1/vehicle-1/file.pdf",
    );
    expect(url).toBe("https://example.com/signed");
  });

  it("uses 900 second expiry by default", async () => {
    const mock = makeSupabase();
    await createDownloadUrl(mock as unknown as SupabaseClient, "user-1/vehicle-1/file.pdf");
    expect(mock._createSignedUrl).toHaveBeenCalledWith("user-1/vehicle-1/file.pdf", 900);
  });

  it("forwards custom expiresIn to createSignedUrl", async () => {
    const mock = makeSupabase();
    await createDownloadUrl(mock as unknown as SupabaseClient, "user-1/vehicle-1/file.pdf", 300);
    expect(mock._createSignedUrl).toHaveBeenCalledWith("user-1/vehicle-1/file.pdf", 300);
  });

  it("passes download option to createSignedUrl when provided", async () => {
    const mock = makeSupabase();
    await createDownloadUrl(mock as unknown as SupabaseClient, "user-1/vehicle-1/file.pdf", 900, "file.pdf");
    expect(mock._createSignedUrl).toHaveBeenCalledWith("user-1/vehicle-1/file.pdf", 900, { download: "file.pdf" });
  });

  it("throws when Supabase returns an error", async () => {
    const mock = makeSupabase({ data: null, error: { message: "not found" } });
    await expect(
      createDownloadUrl(mock as unknown as SupabaseClient, "user-1/vehicle-1/file.pdf"),
    ).rejects.toThrow("Failed to create signed download URL");
  });
});

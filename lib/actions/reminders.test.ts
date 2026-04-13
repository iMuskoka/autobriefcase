import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { updateReminderSettings } from "./reminders";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const REMINDER_ID = "reminder-uuid-123";
const VEHICLE_ID  = "vehicle-uuid-456";
const DOCUMENT_ID = "document-uuid-789";
const USER_ID     = "user-uuid-abc";

// Builds a mock matching: supabase.from().update().eq(id).eq(user_id).select().single()
// auth.getClaims() is set per-call via the returned getClaims mock
function makeSupabaseMock(
  result: { data: unknown; error: unknown },
  userId: string | null = USER_ID,
) {
  const single     = vi.fn().mockResolvedValue(result);
  const select     = vi.fn().mockReturnValue({ single });
  const eqUserId   = vi.fn().mockReturnValue({ select });
  const eqId       = vi.fn().mockReturnValue({ eq: eqUserId });
  const update     = vi.fn().mockReturnValue({ eq: eqId });
  const from       = vi.fn().mockReturnValue({ update });
  const getClaims  = vi.fn().mockResolvedValue({
    data: userId ? { claims: { sub: userId } } : null,
  });
  return {
    client: { from, auth: { getClaims } },
    from, update, eqId, eqUserId, select, single, getClaims,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateReminderSettings", () => {
  it("updates lead_time_days for a valid lead time and returns success", async () => {
    const mock = makeSupabaseMock({ data: { id: REMINDER_ID }, error: null });
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await updateReminderSettings(REMINDER_ID, 30, VEHICLE_ID, DOCUMENT_ID);

    expect(result).toEqual({ success: true, data: undefined });
    expect(mock.update).toHaveBeenCalledWith({ lead_time_days: 30 });
    expect(mock.eqId).toHaveBeenCalledWith("id", REMINDER_ID);
    expect(mock.eqUserId).toHaveBeenCalledWith("user_id", USER_ID);
    expect(revalidatePath).toHaveBeenCalledWith(`/fleet/${VEHICLE_ID}/documents/${DOCUMENT_ID}`);
  });

  it("returns Unauthorized when getClaims returns no session", async () => {
    const mock = makeSupabaseMock({ data: null, error: null }, null);
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await updateReminderSettings(REMINDER_ID, 30, VEHICLE_ID, DOCUMENT_ID);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mock.update).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns invalid lead time error without hitting the DB for lead time 15", async () => {
    const mock = makeSupabaseMock({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await updateReminderSettings(REMINDER_ID, 15, VEHICLE_ID, DOCUMENT_ID);

    expect(result).toEqual({ success: false, error: "Invalid lead time" });
    expect(mock.update).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns error when supabase update returns an error", async () => {
    const mock = makeSupabaseMock({ data: null, error: { message: "DB error" } });
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await updateReminderSettings(REMINDER_ID, 60, VEHICLE_ID, DOCUMENT_ID);

    expect(result).toEqual({ success: false, error: "Failed to update reminder." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns error when supabase update returns null data (row not found / not owned)", async () => {
    const mock = makeSupabaseMock({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await updateReminderSettings(REMINDER_ID, 90, VEHICLE_ID, DOCUMENT_ID);

    expect(result).toEqual({ success: false, error: "Failed to update reminder." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

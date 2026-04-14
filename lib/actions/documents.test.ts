import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/ai/extract-document", () => ({
  extractDocument: vi.fn(),
}));

vi.mock("@/lib/storage/signed-urls", () => ({
  createDownloadUrl: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { markRenewed } from "./documents";
import { createClient } from "@/lib/supabase/server";

const OLD_REMINDER_ID = "reminder-uuid-old";
const NEW_DOCUMENT_ID = "doc-uuid-new";
const VEHICLE_ID      = "vehicle-uuid-abc";
const USER_ID         = "user-uuid-xyz";

const baseConfirmedFields = {
  expiryDate:   "2027-04-01",
  holderName:   "Ben Imrie",
  policyNumber: "POL-123",
  issuerName:   "ICBC",
};

// Builds a flexible mock Supabase client for markRenewed.
// markRenewed calls: getClaims, from("vehicles"), from("documents"), from("reminders") twice.
function makeMarkRenewedMock({
  userId = USER_ID,
  vehicleResult = { data: { id: VEHICLE_ID } as { id: string } | null, error: null as unknown },
  docInsertResult = { data: { id: NEW_DOCUMENT_ID } as { id: string } | null, error: null as unknown },
  reminderInsertResult = { data: null as unknown, error: null as unknown },
  reminderUpdateResult = { data: null as unknown, error: null as unknown },
} = {}) {
  const getClaims = vi.fn().mockResolvedValue({
    data: userId ? { claims: { sub: userId } } : null,
  });

  // vehicles: .from("vehicles").select("id").eq("id", vehicleId).single()
  const vehicleSingle = vi.fn().mockResolvedValue(vehicleResult);
  const vehicleEq     = vi.fn().mockReturnValue({ single: vehicleSingle });
  const vehicleSelect = vi.fn().mockReturnValue({ eq: vehicleEq });

  // documents: .from("documents").insert({}).select("id").single()
  const docSingle  = vi.fn().mockResolvedValue(docInsertResult);
  const docSelect  = vi.fn().mockReturnValue({ single: docSingle });
  const docInsert  = vi.fn().mockReturnValue({ select: docSelect });

  // reminders insert: .from("reminders").insert({})
  const reminderInsert = vi.fn().mockResolvedValue(reminderInsertResult);

  // reminders update: .from("reminders").update({}).eq("id", ...)
  const reminderUpdateEq     = vi.fn().mockResolvedValue(reminderUpdateResult);
  const reminderUpdate       = vi.fn().mockReturnValue({ eq: reminderUpdateEq });

  // reminders table supports both insert and update on the same returned object
  const remindersTable = { insert: reminderInsert, update: reminderUpdate };

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "vehicles") return { select: vehicleSelect };
    if (table === "documents") return { insert: docInsert };
    if (table === "reminders") return remindersTable;
    throw new Error(`Unexpected table: ${table}`);
  });

  const client = { from, auth: { getClaims } };
  return {
    client,
    getClaims,
    vehicleSingle, vehicleEq, vehicleSelect,
    docSingle, docSelect, docInsert,
    reminderInsert, remindersTable,
    reminderUpdateEq, reminderUpdate,
    from,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("markRenewed", () => {
  it("saves new document, creates new reminder with preserved leadTimeDays, dismisses old reminder, returns nextReminderDate", async () => {
    const mock = makeMarkRenewedMock();
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await markRenewed(
      OLD_REMINDER_ID,
      VEHICLE_ID,
      "users/abc/vehicles/v1/file.pdf",
      "insurance",
      "insurance.pdf",
      baseConfirmedFields,
      14,  // preserved leadTimeDays
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    // nextReminderDate = 2027-04-01 minus 14 days = 2027-03-18
    expect(result.data.nextReminderDate).toBe("2027-03-18");

    // New document inserted
    expect(mock.docInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id:       USER_ID,
        vehicle_id:    VEHICLE_ID,
        storage_path:  "users/abc/vehicles/v1/file.pdf",
        document_type: "insurance",
        file_name:     "insurance.pdf",
        expiry_date:   "2027-04-01",
        holder_name:   "Ben Imrie",
        policy_number: "POL-123",
        issuer_name:   "ICBC",
      }),
    );

    // New reminder inserted with preserved leadTimeDays=14
    expect(mock.reminderInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id:        USER_ID,
        vehicle_id:     VEHICLE_ID,
        document_id:    NEW_DOCUMENT_ID,
        expiry_date:    "2027-04-01",
        lead_time_days: 14,
        status:         "pending",
      }),
    );

    // Old reminder dismissed
    expect(mock.reminderUpdate).toHaveBeenCalledWith({ status: "dismissed" });
    expect(mock.reminderUpdateEq).toHaveBeenCalledWith("id", OLD_REMINDER_ID);
  });

  it("computes nextReminderDate correctly for leadTimeDays=30 — avoids UTC shift", async () => {
    const mock = makeMarkRenewedMock();
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await markRenewed(
      OLD_REMINDER_ID, VEHICLE_ID, "path", "insurance", "file.pdf",
      { expiryDate: "2027-07-01" },
      30,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    // 2027-07-01 minus 30 days = 2027-06-01
    expect(result.data.nextReminderDate).toBe("2027-06-01");
  });

  it("returns nextReminderDate: null when expiryDate is not provided", async () => {
    // When no expiryDate, no reminder is created and nextReminderDate is null
    const mock = makeMarkRenewedMock();
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await markRenewed(
      OLD_REMINDER_ID, VEHICLE_ID, "path", "insurance", "file.pdf",
      { holderName: "Ben" },  // no expiryDate
      30,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.nextReminderDate).toBeNull();
    expect(mock.reminderInsert).not.toHaveBeenCalled();
  });

  it("returns error for invalid leadTimeDays (0, negative, >365)", async () => {
    const mock = makeMarkRenewedMock();
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    for (const bad of [0, -1, 366, 999]) {
      const result = await markRenewed(
        OLD_REMINDER_ID, VEHICLE_ID, "path", "insurance", "file.pdf",
        baseConfirmedFields, bad,
      );
      expect(result).toEqual({ success: false, error: "Invalid lead time." });
    }
    expect(mock.docInsert).not.toHaveBeenCalled();
  });

  it("returns Unauthorized when getClaims returns no session", async () => {
    const mock = makeMarkRenewedMock({ userId: "" });
    mock.getClaims.mockResolvedValue({ data: null });
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await markRenewed(
      OLD_REMINDER_ID, VEHICLE_ID, "path", "insurance", "file.pdf",
      baseConfirmedFields, 30,
    );

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("returns Not found when vehicle does not belong to user", async () => {
    const mock = makeMarkRenewedMock({ vehicleResult: { data: null, error: null } });
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await markRenewed(
      OLD_REMINDER_ID, VEHICLE_ID, "path", "insurance", "file.pdf",
      baseConfirmedFields, 30,
    );

    expect(result).toEqual({ success: false, error: "Not found" });
    expect(mock.docInsert).not.toHaveBeenCalled();
  });

  it("returns error when document insert fails", async () => {
    const mock = makeMarkRenewedMock({
      docInsertResult: { data: null, error: { message: "DB error" } },
    });
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await markRenewed(
      OLD_REMINDER_ID, VEHICLE_ID, "path", "insurance", "file.pdf",
      baseConfirmedFields, 30,
    );

    expect(result).toEqual({ success: false, error: "Failed to save document. Try again." });
    expect(mock.reminderInsert).not.toHaveBeenCalled();
    expect(mock.reminderUpdate).not.toHaveBeenCalled();
  });

  it("still returns success when new reminder insert fails (non-fatal)", async () => {
    const mock = makeMarkRenewedMock({
      reminderInsertResult: { data: null, error: { message: "insert error" } },
    });
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await markRenewed(
      OLD_REMINDER_ID, VEHICLE_ID, "path", "insurance", "file.pdf",
      baseConfirmedFields, 30,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    // When reminder insert fails, nextReminderDate is null
    expect(result.data.nextReminderDate).toBeNull();
  });

  it("still returns success when old reminder dismiss fails (non-fatal)", async () => {
    const mock = makeMarkRenewedMock({
      reminderUpdateResult: { data: null, error: { message: "update error" } },
    });
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const result = await markRenewed(
      OLD_REMINDER_ID, VEHICLE_ID, "path", "insurance", "file.pdf",
      baseConfirmedFields, 30,
    );

    expect(result.success).toBe(true);
  });
});

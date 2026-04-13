import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures these are initialized before vi.mock factories run
const mockSend = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.emails = { send: mockSend };
  }),
}));

// Mock ReminderEmail template to avoid React Email render in unit tests
vi.mock("./templates/ReminderEmail", () => ({
  ReminderEmail: vi.fn().mockReturnValue(null),
}));

import { sendReminder } from "./send-reminder";

const baseParams = {
  to:              "user@example.com",
  vehicleName:     "2019 Toyota Camry",
  documentType:    "Insurance",
  expiryDate:      "July 1, 2026",
  daysUntilExpiry: 30,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_FROM_EMAIL = "AutoBriefcase <noreply@autobriefcase.app>";
});

describe("sendReminder", () => {
  it("sends email with correct payload", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "msg_123" }, error: null });

    await sendReminder(baseParams);

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("user@example.com");
    expect(call.from).toBe("AutoBriefcase <noreply@autobriefcase.app>");
    expect(call.subject).toBe("Your 2019 Toyota Camry Insurance renews in 30 days");
    expect(call.react).toBeDefined();
  });

  it("returns messageId on success", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "msg_123" }, error: null });

    const result = await sendReminder(baseParams);

    expect(result).toEqual({ messageId: "msg_123" });
  });

  it("throws when Resend returns an error", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: "API error" } });

    await expect(sendReminder(baseParams)).rejects.toThrow("Resend error: API error");
  });

  it("throws when Resend returns no data id", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: null }, error: null });

    await expect(sendReminder(baseParams)).rejects.toThrow("Resend error: unknown");
  });
});

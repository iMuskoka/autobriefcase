import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// vi.hoisted ensures these are initialized before vi.mock factories run
const mockFrom = vi.hoisted(() => vi.fn());
const mockSendReminder = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/email/send-reminder", () => ({
  sendReminder: mockSendReminder,
}));

import { GET } from "./route";

// Helper to build a test Request
const makeRequest = (authHeader?: string) =>
  new Request("http://localhost/api/cron/reminders", {
    method: "GET",
    headers: authHeader ? { Authorization: authHeader } : {},
  });

// Shared reminder fixture — fire date is today (expiry = today + 30 days, lead_time = 30)
function makeDueReminder(overrides: Record<string, unknown> = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(today);
  expiry.setDate(today.getDate() + 30); // 30 days from now
  const expiryStr = expiry.toISOString().split("T")[0];

  return {
    id: "reminder-1",
    user_id: "user-1",
    expiry_date: expiryStr,
    lead_time_days: 30, // fire date = today
    vehicles: { make: "Toyota", model: "Camry", year: 2019, nickname: null },
    documents: { document_type: "insurance" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test_secret";
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("GET /api/cron/reminders", () => {
  it("returns 401 with missing Authorization header", async () => {
    const req = makeRequest();
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 with wrong CRON_SECRET", async () => {
    const req = makeRequest("Bearer wrong_secret");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("dispatches due reminders and returns counts", async () => {
    const reminder1 = makeDueReminder({ id: "r1" });
    const reminder2 = makeDueReminder({ id: "r2", user_id: "user-2" });

    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "reminders") {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ data: [reminder1, reminder2], error: null }),
              }),
            }),
          };
        }
        // Update calls
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { id: "user-1", email: "user1@example.com" },
                { id: "user-2", email: "user2@example.com" },
              ],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    mockSendReminder.mockResolvedValue({ messageId: "msg_ok" });

    const req = makeRequest("Bearer test_secret");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ dispatched: 2, failed: 0 });
    expect(mockSendReminder).toHaveBeenCalledTimes(2);
  });

  it("skips reminders not yet due", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // expiry 60 days away with lead_time 30 → fire date 30 days from now
    const expiry = new Date(today);
    expiry.setDate(today.getDate() + 60);
    const expiryStr = expiry.toISOString().split("T")[0];

    const notDueReminder = {
      id: "r-not-due",
      user_id: "user-1",
      expiry_date: expiryStr,
      lead_time_days: 30,
      vehicles: { make: "Toyota", model: "Camry", year: 2019, nickname: null },
      documents: { document_type: "insurance" },
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "reminders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({ data: [notDueReminder], error: null }),
            }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {};
    });

    const req = makeRequest("Bearer test_secret");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ dispatched: 0, failed: 0 });
    expect(mockSendReminder).not.toHaveBeenCalled();
  });

  it("counts failed dispatches when sendReminder throws", async () => {
    const reminder = makeDueReminder();

    mockFrom.mockImplementation((table: string) => {
      if (table === "reminders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({ data: [reminder], error: null }),
            }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: "user-1", email: "user1@example.com" }],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    mockSendReminder.mockRejectedValue(new Error("Resend error: API error"));

    const req = makeRequest("Bearer test_secret");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ dispatched: 0, failed: 1 });
  });
});

import { describe, it, expect } from "vitest";
import { buildSaveToast, buildRenewedToast } from "./toast-helpers";

describe("buildSaveToast", () => {
  it("returns 'Saved.' when reminderDate is null", () => {
    expect(buildSaveToast(null)).toBe("Saved.");
  });

  it("formats date correctly for a given reminderDate", () => {
    expect(buildSaveToast("2026-07-01")).toBe(
      "Saved. Reminder set 30 days before July 1, 2026.",
    );
  });

  it("avoids UTC timezone shift — formats 2026-07-01 as July 1 not June 30", () => {
    // new Date("2026-07-01") is UTC midnight, which in UTC-N zones renders as June 30.
    // buildSaveToast must use new Date(y, m-1, d) (local time) to avoid the shift.
    const result = buildSaveToast("2026-07-01");
    expect(result).toContain("July 1, 2026");
    expect(result).not.toContain("June 30");
  });
});

describe("buildRenewedToast", () => {
  it("returns 'Renewed.' when nextReminderDate is null", () => {
    expect(buildRenewedToast(null)).toBe("Renewed.");
  });

  it("formats nextReminderDate as the reminder fire date", () => {
    // nextReminderDate is the fire date (expiry - leadTimeDays), not the expiry date
    expect(buildRenewedToast("2026-06-01")).toBe(
      "Renewed. Next reminder set for June 1, 2026.",
    );
  });

  it("avoids UTC timezone shift — formats 2027-07-01 as July 1 not June 30", () => {
    const result = buildRenewedToast("2027-07-01");
    expect(result).toContain("July 1, 2027");
    expect(result).not.toContain("June 30");
  });

  it("produces expected string for a real fire date example", () => {
    // expiryDate=2026-07-16, leadTimeDays=30 → fire date=2026-06-16
    expect(buildRenewedToast("2026-06-16")).toBe(
      "Renewed. Next reminder set for June 16, 2026.",
    );
  });
});

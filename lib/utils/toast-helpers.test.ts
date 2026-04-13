import { describe, it, expect } from "vitest";
import { buildSaveToast } from "./toast-helpers";

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

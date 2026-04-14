import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDaysToExpiry,
  getVehicleHealthState,
  buildFleetHeroProps,
  type ObligationItem,
} from "./obligations";

// Fix "today" to 2026-04-13 (local) for deterministic tests
const FIXED_TODAY = new Date(2026, 3, 13); // month is 0-indexed → April

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// getDaysToExpiry
// ---------------------------------------------------------------------------

describe("getDaysToExpiry", () => {
  it("returns 0 for today's date", () => {
    expect(getDaysToExpiry("2026-04-13")).toBe(0);
  });

  it("returns positive number for a future date", () => {
    expect(getDaysToExpiry("2026-04-23")).toBe(10);
  });

  it("returns negative number for a past date", () => {
    expect(getDaysToExpiry("2026-04-03")).toBe(-10);
  });

  it("returns exactly 14 for a date 14 days away", () => {
    expect(getDaysToExpiry("2026-04-27")).toBe(14);
  });

  it("returns exactly 30 for a date 30 days away", () => {
    expect(getDaysToExpiry("2026-05-13")).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// getVehicleHealthState
// ---------------------------------------------------------------------------

function makeObligation(daysToExpiry: number): ObligationItem {
  return {
    reminderId:   "r1",
    vehicleId:    "v1",
    vehicleName:  "Test Vehicle",
    documentType: "Insurance",
    expiryDate:   "2026-05-01",
    daysToExpiry,
  };
}

describe("getVehicleHealthState", () => {
  it("returns 'no-docs' when obligations is empty", () => {
    expect(getVehicleHealthState([])).toBe("no-docs");
  });

  it("returns 'critical' when min days <= 14", () => {
    expect(getVehicleHealthState([makeObligation(14)])).toBe("critical");
  });

  it("returns 'critical' when min days is 0", () => {
    expect(getVehicleHealthState([makeObligation(0)])).toBe("critical");
  });

  it("returns 'critical' when min days is negative (overdue)", () => {
    expect(getVehicleHealthState([makeObligation(-5)])).toBe("critical");
  });

  it("returns 'attention' when min days is exactly 15", () => {
    expect(getVehicleHealthState([makeObligation(15)])).toBe("attention");
  });

  it("returns 'attention' when min days is exactly 30", () => {
    expect(getVehicleHealthState([makeObligation(30)])).toBe("attention");
  });

  it("returns 'healthy' when min days > 30", () => {
    expect(getVehicleHealthState([makeObligation(31)])).toBe("healthy");
  });

  it("uses the minimum days across multiple obligations", () => {
    expect(
      getVehicleHealthState([makeObligation(60), makeObligation(10)]),
    ).toBe("critical");
  });
});

// ---------------------------------------------------------------------------
// buildFleetHeroProps
// ---------------------------------------------------------------------------

describe("buildFleetHeroProps", () => {
  it("returns empty state when vehicleCount is 0", () => {
    expect(buildFleetHeroProps([], 0)).toEqual({ state: "empty" });
  });

  it("returns covered state when all obligations are > 30 days away", () => {
    const obligations = [makeObligation(60), makeObligation(45)];
    expect(buildFleetHeroProps(obligations, 2)).toEqual({
      state: "covered",
      vehicleCount: 2,
    });
  });

  it("returns covered state when there are no obligations but fleet exists", () => {
    expect(buildFleetHeroProps([], 3)).toEqual({
      state: "covered",
      vehicleCount: 3,
    });
  });

  it("returns attention state when there are 14–30 day obligations", () => {
    const obligations = [makeObligation(60), makeObligation(20)];
    const result = buildFleetHeroProps(obligations, 2);
    expect(result).toEqual({
      state: "attention",
      vehicleCount: 1,
      nextRenewalDays: 20,
    });
  });

  it("returns critical state when there are <= 14 day obligations", () => {
    const obligations = [makeObligation(60), makeObligation(20), makeObligation(5)];
    const result = buildFleetHeroProps(obligations, 3);
    expect(result).toEqual({
      state: "critical",
      vehicleCount: 1,
      nextRenewalDays: 5,
    });
  });

  it("critical takes priority over attention when both exist", () => {
    const obligations = [makeObligation(20), makeObligation(7)];
    const result = buildFleetHeroProps(obligations, 2);
    expect(result.state).toBe("critical");
  });

  it("vehicleCount in critical = count of critical obligations, not total vehicles", () => {
    const obligations = [makeObligation(5), makeObligation(10), makeObligation(60)];
    const result = buildFleetHeroProps(obligations, 5);
    expect(result).toMatchObject({ state: "critical", vehicleCount: 2 });
  });

  it("nextRenewalDays is the minimum days across critical obligations", () => {
    const obligations = [makeObligation(12), makeObligation(3)];
    const result = buildFleetHeroProps(obligations, 2);
    expect(result).toMatchObject({ state: "critical", nextRenewalDays: 3 });
  });
});

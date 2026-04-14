import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ObligationRow } from "./ObligationRow";
import type { ObligationItem } from "@/lib/obligations";

// Fix today to 2026-04-13 for deterministic date calculations
const FIXED_TODAY = new Date(2026, 3, 13);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

const baseObligation: ObligationItem = {
  reminderId:   "r1",
  vehicleId:    "v1",
  vehicleName:  "2022 Toyota Camry",
  documentType: "Insurance",
  expiryDate:   "2026-05-13",  // 30 days from fixed today
  daysToExpiry: 30,
};

// ---------------------------------------------------------------------------
// full variant
// ---------------------------------------------------------------------------

describe("ObligationRow full variant", () => {
  it("renders document type label", () => {
    render(<ul><ObligationRow obligation={baseObligation} variant="full" /></ul>);
    expect(screen.getByText("Insurance")).toBeInTheDocument();
  });

  it("renders vehicle name", () => {
    render(<ul><ObligationRow obligation={baseObligation} variant="full" /></ul>);
    expect(screen.getByText("2022 Toyota Camry")).toBeInTheDocument();
  });

  it("renders formatted expiry date", () => {
    render(<ul><ObligationRow obligation={baseObligation} variant="full" /></ul>);
    expect(screen.getByText("May 13, 2026")).toBeInTheDocument();
  });

  it("renders days badge with correct count", () => {
    render(<ul><ObligationRow obligation={baseObligation} variant="full" /></ul>);
    expect(screen.getByText("30 days")).toBeInTheDocument();
  });

  it("renders 'Overdue' for negative daysToExpiry", () => {
    const overdue = { ...baseObligation, daysToExpiry: -5 };
    render(<ul><ObligationRow obligation={overdue} variant="full" /></ul>);
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("renders 'Today' for 0 daysToExpiry", () => {
    const today = { ...baseObligation, daysToExpiry: 0 };
    render(<ul><ObligationRow obligation={today} variant="full" /></ul>);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("applies destructive color for critical obligation (<=14 days)", () => {
    const critical = { ...baseObligation, daysToExpiry: 7 };
    const { container } = render(<ul><ObligationRow obligation={critical} variant="full" /></ul>);
    // The days badge span should have the destructive color class
    const badge = container.querySelector(".text-destructive");
    expect(badge).toBeInTheDocument();
  });

  it("applies warning color for attention obligation (15–30 days)", () => {
    const attention = { ...baseObligation, daysToExpiry: 20 };
    const { container } = render(<ul><ObligationRow obligation={attention} variant="full" /></ul>);
    const badge = container.querySelector(".text-warning");
    expect(badge).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// card variant
// ---------------------------------------------------------------------------

describe("ObligationRow card variant", () => {
  it("renders document type label", () => {
    render(<ObligationRow obligation={baseObligation} variant="card" />);
    expect(screen.getByText("Insurance")).toBeInTheDocument();
  });

  it("does NOT render vehicle name", () => {
    render(<ObligationRow obligation={baseObligation} variant="card" />);
    expect(screen.queryByText("2022 Toyota Camry")).not.toBeInTheDocument();
  });

  it("shows days badge", () => {
    render(<ObligationRow obligation={baseObligation} variant="card" />);
    expect(screen.getByText("30 days")).toBeInTheDocument();
  });

  it("has a colored left border (border-l-2 class)", () => {
    const { container } = render(<ObligationRow obligation={baseObligation} variant="card" />);
    expect(container.firstChild).toHaveClass("border-l-2");
  });

  it("applies destructive border for critical (<=14 days)", () => {
    const critical = { ...baseObligation, daysToExpiry: 5 };
    const { container } = render(<ObligationRow obligation={critical} variant="card" />);
    expect(container.firstChild).toHaveClass("border-destructive");
  });
});

// ---------------------------------------------------------------------------
// strip variant
// ---------------------------------------------------------------------------

describe("ObligationRow strip variant", () => {
  it("renders vehicle name", () => {
    render(<ul><ObligationRow obligation={baseObligation} variant="strip" /></ul>);
    expect(screen.getByText("2022 Toyota Camry")).toBeInTheDocument();
  });

  it("renders document type label", () => {
    render(<ul><ObligationRow obligation={baseObligation} variant="strip" /></ul>);
    expect(screen.getByText(/Insurance/)).toBeInTheDocument();
  });

  it("renders days badge", () => {
    render(<ul><ObligationRow obligation={baseObligation} variant="strip" /></ul>);
    expect(screen.getByText("30 days")).toBeInTheDocument();
  });
});

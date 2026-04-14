import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Fix today to 2026-04-13 for deterministic calculations
const FIXED_TODAY = new Date(2026, 3, 13);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// nuqs mock
const mockSetFilter = vi.fn();
let mockFilter = "all";

vi.mock("nuqs", () => ({
  useQueryState: vi.fn((_key: string, _options: unknown) => [mockFilter, mockSetFilter]),
  parseAsStringLiteral: vi.fn(() => ({ withDefault: vi.fn(() => ({})) })),
}));

import { ObligationTimeline } from "./ObligationTimeline";
import type { ObligationItem } from "@/lib/obligations";

function makeObligation(overrides: Partial<ObligationItem>): ObligationItem {
  return {
    reminderId:   "r1",
    vehicleId:    "v1",
    vehicleName:  "2022 Toyota Camry",
    documentType: "Insurance",
    expiryDate:   "2026-05-13",
    daysToExpiry: 30,
    ...overrides,
  };
}

const insuranceObligation = makeObligation({
  reminderId:   "r1",
  documentType: "Insurance",
  expiryDate:   "2026-05-10",
  daysToExpiry: 27,
  vehicleName:  "2022 Toyota Camry",
});

const registrationObligation = makeObligation({
  reminderId:   "r2",
  documentType: "Registration",
  expiryDate:   "2026-06-15",
  daysToExpiry: 63,
  vehicleName:  "2019 Honda Civic",
  vehicleId:    "v2",
});

const permitObligation = makeObligation({
  reminderId:   "r3",
  documentType: "Seasonal Permit",
  expiryDate:   "2026-07-01",
  daysToExpiry: 79,
  vehicleName:  "2020 Ford F-150",
  vehicleId:    "v3",
});

/**
 * Get only the obligation content sections (not the chip bar).
 * The month sections use aria-label matching "MMMM YYYY".
 */
function getObligationSections() {
  return screen.queryAllByRole("region");
}

describe("ObligationTimeline", () => {
  it("renders all obligations when filter is 'all'", () => {
    mockFilter = "all";
    render(
      <ObligationTimeline
        obligations={[insuranceObligation, registrationObligation, permitObligation]}
      />,
    );
    // Check obligation vehicle names (unique to obligation rows, not chips)
    expect(screen.getByText("2022 Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText("2019 Honda Civic")).toBeInTheDocument();
    expect(screen.getByText("2020 Ford F-150")).toBeInTheDocument();
  });

  it("filters to insurance only when filter is 'insurance'", () => {
    mockFilter = "insurance";
    render(
      <ObligationTimeline
        obligations={[insuranceObligation, registrationObligation, permitObligation]}
      />,
    );
    expect(screen.getByText("2022 Toyota Camry")).toBeInTheDocument();
    expect(screen.queryByText("2019 Honda Civic")).not.toBeInTheDocument();
    expect(screen.queryByText("2020 Ford F-150")).not.toBeInTheDocument();
  });

  it("filters to registration only when filter is 'registration'", () => {
    mockFilter = "registration";
    render(
      <ObligationTimeline
        obligations={[insuranceObligation, registrationObligation, permitObligation]}
      />,
    );
    expect(screen.queryByText("2022 Toyota Camry")).not.toBeInTheDocument();
    expect(screen.getByText("2019 Honda Civic")).toBeInTheDocument();
    expect(screen.queryByText("2020 Ford F-150")).not.toBeInTheDocument();
  });

  it("filters to permits (License/Seasonal Permit) when filter is 'permits'", () => {
    mockFilter = "permits";
    render(
      <ObligationTimeline
        obligations={[insuranceObligation, registrationObligation, permitObligation]}
      />,
    );
    expect(screen.queryByText("2022 Toyota Camry")).not.toBeInTheDocument();
    expect(screen.queryByText("2019 Honda Civic")).not.toBeInTheDocument();
    expect(screen.getByText("2020 Ford F-150")).toBeInTheDocument();
  });

  it("groups obligations by month with correct headings", () => {
    mockFilter = "all";
    render(
      <ObligationTimeline
        obligations={[insuranceObligation, registrationObligation]}
      />,
    );
    // insuranceObligation → May 2026; registrationObligation → June 2026
    expect(screen.getByRole("region", { name: "May 2026" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "June 2026" })).toBeInTheDocument();
  });

  it("puts obligations in the correct month group", () => {
    mockFilter = "all";
    render(
      <ObligationTimeline
        obligations={[insuranceObligation, registrationObligation]}
      />,
    );
    const maySection = screen.getByRole("region", { name: "May 2026" });
    expect(within(maySection).getByText("2022 Toyota Camry")).toBeInTheDocument();
    const juneSection = screen.getByRole("region", { name: "June 2026" });
    expect(within(juneSection).getByText("2019 Honda Civic")).toBeInTheDocument();
  });

  it("shows a per-category neutral message when a non-all filter returns empty", () => {
    mockFilter = "insurance";
    render(
      // Only registration obligation — insurance filter → empty
      <ObligationTimeline obligations={[registrationObligation]} />,
    );
    // Should NOT show the all-good state (that's only for filter=all)
    expect(screen.queryByText("All obligations are current.")).not.toBeInTheDocument();
    // Should show a neutral per-category message
    expect(screen.getByText("No insurance obligations found.")).toBeInTheDocument();
  });

  it("shows empty state when no obligations at all", () => {
    mockFilter = "all";
    render(<ObligationTimeline obligations={[]} />);
    expect(screen.getByText("All obligations are current.")).toBeInTheDocument();
  });

  it("renders filter chip buttons", () => {
    mockFilter = "all";
    render(<ObligationTimeline obligations={[insuranceObligation]} />);
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insurance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registration" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Permits" })).toBeInTheDocument();
  });

  it("active filter chip has aria-pressed='true'", () => {
    mockFilter = "insurance";
    render(<ObligationTimeline obligations={[insuranceObligation]} />);
    expect(
      screen.getByRole("button", { name: "Insurance" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "All" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking a filter chip calls setFilter with the correct value", async () => {
    vi.useRealTimers(); // avoid fake timer / userEvent conflict
    mockFilter = "all";
    const user = userEvent.setup();
    render(<ObligationTimeline obligations={[insuranceObligation]} />);
    await user.click(screen.getByRole("button", { name: "Registration" }));
    expect(mockSetFilter).toHaveBeenCalledWith("registration");
  });
});

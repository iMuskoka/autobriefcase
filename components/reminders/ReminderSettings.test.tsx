import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockUpdateReminderSettings = vi.fn();

vi.mock("@/lib/actions/reminders", () => ({
  updateReminderSettings: (...args: unknown[]) => mockUpdateReminderSettings(...args),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
  Toaster: () => null,
}));

import { ReminderSettings } from "./ReminderSettings";
import type { Reminder } from "@/types";

const sampleReminder: Reminder = {
  id:             "reminder-uuid-1",
  user_id:        "user-uuid-1",
  vehicle_id:     "vehicle-uuid-1",
  document_id:    "document-uuid-1",
  expiry_date:    "2026-07-01",
  lead_time_days: 30,
  status:         "pending",
  sent_at:        null,
  created_at:     "2026-04-01T00:00:00Z",
};

const VEHICLE_ID = "vehicle-uuid-1";
const DOCUMENT_ID = "document-uuid-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReminderSettings", () => {
  it("renders 4 lead time selector buttons with correct labels", () => {
    render(
      <ReminderSettings
        reminder={sampleReminder}
        vehicleId={VEHICLE_ID}
        documentId={DOCUMENT_ID}
      />,
    );

    expect(screen.getByRole("button", { name: "14 days before" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 days before" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "60 days before" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90 days before" })).toBeInTheDocument();
  });

  it("active button (30) is visually distinct from inactive buttons", () => {
    render(
      <ReminderSettings
        reminder={sampleReminder}
        vehicleId={VEHICLE_ID}
        documentId={DOCUMENT_ID}
      />,
    );

    const active = screen.getByRole("button", { name: "30 days before" });
    const inactive = screen.getByRole("button", { name: "14 days before" });

    // Active has data-active attribute or different aria-pressed, or different class
    // We check aria-pressed as the accessible indicator
    expect(active).toHaveAttribute("aria-pressed", "true");
    expect(inactive).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking a non-active button calls updateReminderSettings with correct args", async () => {
    const user = userEvent.setup();
    mockUpdateReminderSettings.mockResolvedValueOnce({ success: true, data: undefined });

    render(
      <ReminderSettings
        reminder={sampleReminder}
        vehicleId={VEHICLE_ID}
        documentId={DOCUMENT_ID}
      />,
    );

    await user.click(screen.getByRole("button", { name: "60 days before" }));

    await waitFor(() => {
      expect(mockUpdateReminderSettings).toHaveBeenCalledWith(
        "reminder-uuid-1",
        60,
        VEHICLE_ID,
        DOCUMENT_ID,
      );
    });
  });

  it("shows 'Reminder updated.' toast on success", async () => {
    const user = userEvent.setup();
    mockUpdateReminderSettings.mockResolvedValueOnce({ success: true, data: undefined });

    render(
      <ReminderSettings
        reminder={sampleReminder}
        vehicleId={VEHICLE_ID}
        documentId={DOCUMENT_ID}
      />,
    );

    await user.click(screen.getByRole("button", { name: "90 days before" }));

    await waitFor(async () => {
      const { toast } = await import("sonner");
      expect(toast).toHaveBeenCalledWith("Reminder updated.");
    });
  });

  it("does not call updateReminderSettings when the already-active button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ReminderSettings
        reminder={sampleReminder}
        vehicleId={VEHICLE_ID}
        documentId={DOCUMENT_ID}
      />,
    );

    // sampleReminder.lead_time_days is 30 — clicking the active button should be a no-op
    await user.click(screen.getByRole("button", { name: "30 days before" }));

    expect(mockUpdateReminderSettings).not.toHaveBeenCalled();
  });

  it("shows error toast when updateReminderSettings returns failure", async () => {
    const user = userEvent.setup();
    mockUpdateReminderSettings.mockResolvedValueOnce({
      success: false,
      error: "Failed to update reminder.",
    });

    render(
      <ReminderSettings
        reminder={sampleReminder}
        vehicleId={VEHICLE_ID}
        documentId={DOCUMENT_ID}
      />,
    );

    await user.click(screen.getByRole("button", { name: "14 days before" }));

    await waitFor(async () => {
      const { toast } = await import("sonner");
      expect(toast.error).toHaveBeenCalledWith("Failed to update reminder.");
    });
  });
});

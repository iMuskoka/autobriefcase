import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DeleteVehicleButton } from "./DeleteVehicleButton";

const mockDeleteVehicle = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/lib/actions/vehicles", () => ({
  deleteVehicle: (...args: unknown[]) => mockDeleteVehicle(...args),
}));

beforeEach(() => {
  mockDeleteVehicle.mockClear();
});

describe("DeleteVehicleButton", () => {
  it("renders a 'Delete vehicle' trigger button", () => {
    render(<DeleteVehicleButton vehicleId="v1" vehicleName="Toyota Camry" />);
    expect(
      screen.getByRole("button", { name: "Delete vehicle" }),
    ).toBeInTheDocument();
  });

  it("clicking trigger opens the confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<DeleteVehicleButton vehicleId="v1" vehicleName="Toyota Camry" />);
    await user.click(screen.getByRole("button", { name: "Delete vehicle" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("dialog title contains the vehicle name", async () => {
    const user = userEvent.setup();
    render(<DeleteVehicleButton vehicleId="v1" vehicleName="Toyota Camry" />);
    await user.click(screen.getByRole("button", { name: "Delete vehicle" }));
    expect(screen.getByText("Delete Toyota Camry?")).toBeInTheDocument();
  });

  it("dialog description mentions documents and reminders", async () => {
    const user = userEvent.setup();
    render(<DeleteVehicleButton vehicleId="v1" vehicleName="Toyota Camry" />);
    await user.click(screen.getByRole("button", { name: "Delete vehicle" }));
    expect(
      screen.getByText(/documents and reminders/i),
    ).toBeInTheDocument();
  });

  it("Cancel closes dialog without calling deleteVehicle", async () => {
    const user = userEvent.setup();
    render(<DeleteVehicleButton vehicleId="v1" vehicleName="Toyota Camry" />);
    await user.click(screen.getByRole("button", { name: "Delete vehicle" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockDeleteVehicle).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Delete confirm button calls deleteVehicle with vehicleId", async () => {
    const user = userEvent.setup();
    render(<DeleteVehicleButton vehicleId="v1" vehicleName="Toyota Camry" />);
    await user.click(screen.getByRole("button", { name: "Delete vehicle" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(mockDeleteVehicle).toHaveBeenCalledWith("v1");
  });
});

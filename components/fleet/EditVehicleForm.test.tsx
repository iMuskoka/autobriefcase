import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { EditVehicleForm } from "./EditVehicleForm";
import type { Vehicle } from "@/types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/actions/vehicles", () => ({
  updateVehicle: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("./VehicleCategoryPicker", () => ({
  VehicleCategoryPicker: ({ value }: { value: string }) => (
    <div data-testid="category-picker" data-value={value} />
  ),
}));

const baseVehicle: Vehicle = {
  id: "v1",
  user_id: "u1",
  category: "car",
  make: "Toyota",
  model: "Camry",
  year: 2022,
  nickname: "Daily Driver",
  notes: "Needs oil change",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("EditVehicleForm", () => {
  it("pre-populates the category picker with the vehicle category", () => {
    render(<EditVehicleForm vehicle={baseVehicle} vehicleId="v1" />);
    expect(screen.getByTestId("category-picker")).toHaveAttribute(
      "data-value",
      "car",
    );
  });

  it("pre-populates the make input with the vehicle make", () => {
    render(<EditVehicleForm vehicle={baseVehicle} vehicleId="v1" />);
    expect(screen.getByLabelText("Make")).toHaveValue("Toyota");
  });

  it("pre-populates the model input with the vehicle model", () => {
    render(<EditVehicleForm vehicle={baseVehicle} vehicleId="v1" />);
    expect(screen.getByLabelText("Model")).toHaveValue("Camry");
  });

  it("pre-populates the year input with the vehicle year", () => {
    render(<EditVehicleForm vehicle={baseVehicle} vehicleId="v1" />);
    expect(screen.getByLabelText("Year")).toHaveValue(2022);
  });

  it("pre-populates the nickname input when nickname is set", () => {
    render(<EditVehicleForm vehicle={baseVehicle} vehicleId="v1" />);
    expect(screen.getByLabelText("Nickname (optional)")).toHaveValue(
      "Daily Driver",
    );
  });

  it("pre-populates notes textarea when notes is set", () => {
    render(<EditVehicleForm vehicle={baseVehicle} vehicleId="v1" />);
    expect(screen.getByLabelText("Notes (optional)")).toHaveValue(
      "Needs oil change",
    );
  });

  it("renders a submit button with text 'Save Changes'", () => {
    render(<EditVehicleForm vehicle={baseVehicle} vehicleId="v1" />);
    expect(
      screen.getByRole("button", { name: "Save Changes" }),
    ).toBeInTheDocument();
  });

  it("renders a cancel link back to the vehicle detail page", () => {
    render(<EditVehicleForm vehicle={baseVehicle} vehicleId="v1" />);
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/fleet/v1",
    );
  });
});

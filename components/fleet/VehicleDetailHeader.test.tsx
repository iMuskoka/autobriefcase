import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { VehicleDetailHeader } from "./VehicleDetailHeader";
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

const baseVehicle: Vehicle = {
  id: "v1",
  user_id: "u1",
  category: "car",
  make: "Toyota",
  model: "Camry",
  year: 2022,
  nickname: null,
  notes: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("VehicleDetailHeader", () => {
  it("renders make + model as h1 when nickname is null", () => {
    render(<VehicleDetailHeader vehicle={baseVehicle} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Toyota Camry" }),
    ).toBeInTheDocument();
  });

  it("renders nickname as h1 when nickname is set", () => {
    const vehicle: Vehicle = { ...baseVehicle, nickname: "Daily Driver" };
    render(<VehicleDetailHeader vehicle={vehicle} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Daily Driver" }),
    ).toBeInTheDocument();
  });

  it("renders caption as year make model", () => {
    render(<VehicleDetailHeader vehicle={baseVehicle} />);
    expect(screen.getByText("2022 Toyota Camry")).toBeInTheDocument();
  });

  it("renders a link to /fleet (back navigation)", () => {
    render(<VehicleDetailHeader vehicle={baseVehicle} />);
    const link = screen.getByRole("link", { name: "Fleet" });
    expect(link).toHaveAttribute("href", "/fleet");
  });

  it("renders an aria-hidden svg icon", () => {
    const { container } = render(<VehicleDetailHeader vehicle={baseVehicle} />);
    const svg = container.querySelector("svg[aria-hidden='true']");
    expect(svg).toBeInTheDocument();
  });
});

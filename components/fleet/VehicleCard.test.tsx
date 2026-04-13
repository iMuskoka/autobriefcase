import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { VehicleCard } from "./VehicleCard";
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

describe("VehicleCard", () => {
  it("renders role='article'", () => {
    render(<VehicleCard vehicle={baseVehicle} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("aria-label contains vehicle name and 'no documents'", () => {
    render(<VehicleCard vehicle={baseVehicle} />);
    const article = screen.getByRole("article");
    expect(article).toHaveAttribute(
      "aria-label",
      "Toyota Camry — no documents",
    );
  });

  describe("display name (h3)", () => {
    it("renders make + model as h3 when nickname is null", () => {
      render(<VehicleCard vehicle={baseVehicle} />);
      expect(
        screen.getByRole("heading", { level: 3, name: "Toyota Camry" }),
      ).toBeInTheDocument();
    });

    it("renders nickname as h3 when nickname is set", () => {
      const vehicle: Vehicle = { ...baseVehicle, nickname: "Daily Driver" };
      render(<VehicleCard vehicle={vehicle} />);
      expect(
        screen.getByRole("heading", { level: 3, name: "Daily Driver" }),
      ).toBeInTheDocument();
    });

    it("aria-label uses nickname when nickname is set", () => {
      const vehicle: Vehicle = { ...baseVehicle, nickname: "Daily Driver" };
      render(<VehicleCard vehicle={vehicle} />);
      expect(screen.getByRole("article")).toHaveAttribute(
        "aria-label",
        "Daily Driver — no documents",
      );
    });
  });

  describe("caption", () => {
    it("shows year make model as caption", () => {
      render(<VehicleCard vehicle={baseVehicle} />);
      expect(screen.getByText("2022 Toyota Camry")).toBeInTheDocument();
    });

    it("caption still shows year make model when nickname is set", () => {
      const vehicle: Vehicle = { ...baseVehicle, nickname: "Daily Driver" };
      render(<VehicleCard vehicle={vehicle} />);
      expect(screen.getByText("2022 Toyota Camry")).toBeInTheDocument();
    });
  });

  describe("no-docs badge", () => {
    it("renders the no-docs badge with '—'", () => {
      render(<VehicleCard vehicle={baseVehicle} />);
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("category icon", () => {
    it("renders an aria-hidden svg icon for the vehicle category", () => {
      const { container } = render(<VehicleCard vehicle={baseVehicle} />);
      // lucide-react renders aria-hidden SVGs; query via container since
      // aria-hidden removes them from the accessible role tree
      const svg = container.querySelector("svg[aria-hidden='true']");
      expect(svg).toBeInTheDocument();
    });

    it("renders the correct icon class for 'car' category", () => {
      const { container } = render(<VehicleCard vehicle={baseVehicle} />);
      expect(container.querySelector(".lucide-car")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("h3 contains a link to /fleet/${vehicle.id}", () => {
      render(<VehicleCard vehicle={baseVehicle} />);
      const heading = screen.getByRole("heading", { level: 3 });
      const link = heading.querySelector("a");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/fleet/v1");
    });

    it("link text is the display name", () => {
      render(<VehicleCard vehicle={baseVehicle} />);
      expect(screen.getByRole("link", { name: "Toyota Camry" })).toBeInTheDocument();
    });

    it("link text is the nickname when nickname is set", () => {
      const vehicle: Vehicle = { ...baseVehicle, nickname: "Daily Driver" };
      render(<VehicleCard vehicle={vehicle} />);
      expect(screen.getByRole("link", { name: "Daily Driver" })).toBeInTheDocument();
    });
  });

  describe("context menu trigger", () => {
    it("renders the vehicle options button with vehicle-specific label", () => {
      render(<VehicleCard vehicle={baseVehicle} />);
      expect(
        screen.getByRole("button", { name: "Options for Toyota Camry" }),
      ).toBeInTheDocument();
    });

    it("uses nickname in options button label when nickname is set", () => {
      const vehicle: Vehicle = { ...baseVehicle, nickname: "Daily Driver" };
      render(<VehicleCard vehicle={vehicle} />);
      expect(
        screen.getByRole("button", { name: "Options for Daily Driver" }),
      ).toBeInTheDocument();
    });
  });
});

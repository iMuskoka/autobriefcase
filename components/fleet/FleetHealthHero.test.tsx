import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { FleetHealthHero } from "./FleetHealthHero";

// next/link renders an <a> tag in App Router; mock it for jsdom compatibility
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

describe("FleetHealthHero", () => {
  describe("empty state", () => {
    it("renders with role='status'", () => {
      render(<FleetHealthHero state="empty" />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders with aria-live='polite'", () => {
      render(<FleetHealthHero state="empty" />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    });

    it("shows 'Your vault is empty' heading", () => {
      render(<FleetHealthHero state="empty" />);
      expect(
        screen.getByText("Your vault is empty"),
      ).toBeInTheDocument();
    });

    it("shows 'Add your first vehicle to get started' subtext", () => {
      render(<FleetHealthHero state="empty" />);
      expect(
        screen.getByText("Add your first vehicle to get started"),
      ).toBeInTheDocument();
    });

    it("renders CTA link to /fleet/new", () => {
      render(<FleetHealthHero state="empty" />);
      const link = screen.getByRole("link", { name: /add your first vehicle/i });
      expect(link).toHaveAttribute("href", "/fleet/new");
    });
  });

  describe("covered state", () => {
    it("renders with role='status' and aria-live='polite'", () => {
      render(<FleetHealthHero state="covered" vehicleCount={3} />);
      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute("aria-live", "polite");
    });

    it("shows 'Fleet is covered' heading", () => {
      render(<FleetHealthHero state="covered" vehicleCount={3} />);
      expect(screen.getByText("Fleet is covered")).toBeInTheDocument();
    });

    it("shows vehicle count", () => {
      render(<FleetHealthHero state="covered" vehicleCount={3} />);
      expect(screen.getByText(/3 vehicles/)).toBeInTheDocument();
    });
  });

  describe("attention state", () => {
    it("shows renewal count heading", () => {
      render(
        <FleetHealthHero state="attention" vehicleCount={2} nextRenewalDays={25} />,
      );
      expect(screen.getByText(/2 renewals coming up/)).toBeInTheDocument();
    });

    it("shows days until next renewal", () => {
      render(
        <FleetHealthHero state="attention" vehicleCount={1} nextRenewalDays={25} />,
      );
      expect(screen.getByText(/25 days/)).toBeInTheDocument();
    });
  });

  describe("critical state", () => {
    it("shows 'need action' heading", () => {
      render(
        <FleetHealthHero state="critical" vehicleCount={1} nextRenewalDays={7} />,
      );
      expect(screen.getByText(/1 renewal need action/)).toBeInTheDocument();
    });
  });
});

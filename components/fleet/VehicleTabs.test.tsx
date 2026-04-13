import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { VehicleTabs } from "./VehicleTabs";

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

describe("VehicleTabs", () => {
  it("renders all three tab triggers", () => {
    render(<VehicleTabs vehicleId="v1" notes={null} />);
    expect(screen.getByRole("tab", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Obligations" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Notes" })).toBeInTheDocument();
  });

  it("Documents tab is active by default", () => {
    render(<VehicleTabs vehicleId="v1" notes={null} />);
    expect(screen.getByRole("tab", { name: "Documents" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("Documents tab content includes upload link to /fleet/v1/documents/new", () => {
    render(<VehicleTabs vehicleId="v1" notes={null} />);
    expect(
      screen.getByRole("link", { name: "Upload document" }),
    ).toHaveAttribute("href", "/fleet/v1/documents/new");
  });

  it("Notes tab shows notes text when provided", async () => {
    const user = userEvent.setup();
    render(<VehicleTabs vehicleId="v1" notes="Service due soon." />);
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText("Service due soon.")).toBeInTheDocument();
  });

  it("Notes tab shows 'No notes added.' when notes is null", async () => {
    const user = userEvent.setup();
    render(<VehicleTabs vehicleId="v1" notes={null} />);
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText("No notes added.")).toBeInTheDocument();
  });
});

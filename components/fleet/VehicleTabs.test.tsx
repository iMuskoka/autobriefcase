import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { VehicleTabs } from "./VehicleTabs";
import type { Document } from "@/types";

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

const makeDocument = (overrides: Partial<Document> = {}): Document => ({
  id: "doc-1",
  user_id: "user-1",
  vehicle_id: "v1",
  storage_path: "user-1/v1/1234567890-file.pdf",
  document_type: "insurance",
  file_name: "file.pdf",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-15T10:00:00Z",
  ...overrides,
});

describe("VehicleTabs", () => {
  it("renders all three tab triggers", () => {
    render(<VehicleTabs vehicleId="v1" notes={null} documents={[]} />);
    expect(screen.getByRole("tab", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Obligations" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Notes" })).toBeInTheDocument();
  });

  it("Documents tab is active by default", () => {
    render(<VehicleTabs vehicleId="v1" notes={null} documents={[]} />);
    expect(screen.getByRole("tab", { name: "Documents" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("Documents tab shows empty state with upload link when no documents", () => {
    render(<VehicleTabs vehicleId="v1" notes={null} documents={[]} />);
    expect(
      screen.getByRole("link", { name: "Upload document" }),
    ).toHaveAttribute("href", "/fleet/v1/documents/new");
    expect(screen.getByText("No documents yet")).toBeInTheDocument();
  });

  it("Documents tab lists documents with type label and link", () => {
    const doc = makeDocument({ id: "doc-42", document_type: "registration" });
    render(<VehicleTabs vehicleId="v1" notes={null} documents={[doc]} />);
    expect(screen.getByText("Registration")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Registration/ }),
    ).toHaveAttribute("href", "/fleet/v1/documents/doc-42");
  });

  it("Documents tab does not show empty state when documents exist", () => {
    const doc = makeDocument();
    render(<VehicleTabs vehicleId="v1" notes={null} documents={[doc]} />);
    expect(screen.queryByText("No documents yet")).not.toBeInTheDocument();
  });

  it("Notes tab shows notes text when provided", async () => {
    const user = userEvent.setup();
    render(<VehicleTabs vehicleId="v1" notes="Service due soon." documents={[]} />);
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText("Service due soon.")).toBeInTheDocument();
  });

  it("Notes tab shows 'No notes added.' when notes is null", async () => {
    const user = userEvent.setup();
    render(<VehicleTabs vehicleId="v1" notes={null} documents={[]} />);
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText("No notes added.")).toBeInTheDocument();
  });
});

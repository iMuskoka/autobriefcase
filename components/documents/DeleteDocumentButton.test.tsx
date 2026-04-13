import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DeleteDocumentButton } from "./DeleteDocumentButton";

const mockDeleteDocument = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/lib/actions/documents", () => ({
  deleteDocument: (...args: unknown[]) => mockDeleteDocument(...args),
}));

beforeEach(() => {
  mockDeleteDocument.mockClear();
});

describe("DeleteDocumentButton", () => {
  it("renders a 'Delete document' trigger button", () => {
    render(<DeleteDocumentButton documentId="doc-1" vehicleId="v-1" />);
    expect(
      screen.getByRole("button", { name: "Delete document" }),
    ).toBeInTheDocument();
  });

  it("clicking trigger opens the confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<DeleteDocumentButton documentId="doc-1" vehicleId="v-1" />);
    await user.click(screen.getByRole("button", { name: "Delete document" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("dialog title is 'Delete this document?'", async () => {
    const user = userEvent.setup();
    render(<DeleteDocumentButton documentId="doc-1" vehicleId="v-1" />);
    await user.click(screen.getByRole("button", { name: "Delete document" }));
    expect(screen.getByText("Delete this document?")).toBeInTheDocument();
  });

  it("dialog description says 'This action cannot be undone.'", async () => {
    const user = userEvent.setup();
    render(<DeleteDocumentButton documentId="doc-1" vehicleId="v-1" />);
    await user.click(screen.getByRole("button", { name: "Delete document" }));
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("Cancel closes dialog without calling deleteDocument", async () => {
    const user = userEvent.setup();
    render(<DeleteDocumentButton documentId="doc-1" vehicleId="v-1" />);
    await user.click(screen.getByRole("button", { name: "Delete document" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockDeleteDocument).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Delete confirm button calls deleteDocument with documentId and vehicleId", async () => {
    const user = userEvent.setup();
    render(<DeleteDocumentButton documentId="doc-1" vehicleId="v-1" />);
    await user.click(screen.getByRole("button", { name: "Delete document" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(mockDeleteDocument).toHaveBeenCalledWith("doc-1", "v-1");
  });
});

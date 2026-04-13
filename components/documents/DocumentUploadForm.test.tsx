import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DocumentUploadForm } from "./DocumentUploadForm";

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock saveDocument server action
vi.mock("@/lib/actions/documents", () => ({
  saveDocument: vi.fn(),
}));

import { saveDocument } from "@/lib/actions/documents";
const mockSaveDocument = vi.mocked(saveDocument);

beforeEach(() => {
  vi.clearAllMocks();
  mockRouterPush.mockClear();
});

describe("DocumentUploadForm", () => {
  it("renders the drop zone in idle state", () => {
    render(<DocumentUploadForm vehicleId="v1" vehicleName="Toyota Camry" />);
    expect(screen.getByRole("heading", { name: "Upload document" })).toBeInTheDocument();
    expect(screen.getByText("Drop a file here")).toBeInTheDocument();
    expect(screen.getByText("JPEG, PNG, or PDF")).toBeInTheDocument();
  });

  it("shows an error for unsupported file types", async () => {
    // applyAccept: false bypasses the browser accept attribute filter so jsdom triggers the change event
    const user = userEvent.setup({ applyAccept: false });
    render(<DocumentUploadForm vehicleId="v1" vehicleName="Toyota Camry" />);

    const input = screen.getByLabelText("Select a file to upload");
    const file = new File(["content"], "document.txt", { type: "text/plain" });
    await user.upload(input, file);

    expect(
      screen.getByText("That file type isn't supported. Try JPEG, PNG, or PDF."),
    ).toBeInTheDocument();
  });

  it("shows type selection after successful upload", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ signedUrl: "https://storage.example.com/upload", path: "user/v1/file.pdf" }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    render(<DocumentUploadForm vehicleId="v1" vehicleName="Toyota Camry" />);

    const input = screen.getByLabelText("Select a file to upload");
    const file = new File(["content"], "insurance.pdf", { type: "application/pdf" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("Document type")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Insurance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registration" })).toBeInTheDocument();
  });

  it("Save button is disabled until a document type is selected", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ signedUrl: "https://storage.example.com/upload", path: "user/v1/file.pdf" }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    render(<DocumentUploadForm vehicleId="v1" vehicleName="Toyota Camry" />);

    const input = screen.getByLabelText("Select a file to upload");
    const file = new File(["content"], "insurance.pdf", { type: "application/pdf" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Insurance" }));
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("calls saveDocument with correct args when Save is clicked", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ signedUrl: "https://storage.example.com/upload", path: "user/v1/file.pdf" }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    mockSaveDocument.mockResolvedValueOnce({ success: true } as never);

    render(<DocumentUploadForm vehicleId="v1" vehicleName="Toyota Camry" />);

    const input = screen.getByLabelText("Select a file to upload");
    const file = new File(["content"], "insurance.pdf", { type: "application/pdf" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Insurance" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Insurance" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockSaveDocument).toHaveBeenCalledWith(
        "v1",
        "user/v1/file.pdf",
        "insurance",
        "insurance.pdf",
      );
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/fleet/v1");
    });
  });
});

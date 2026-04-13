import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DocumentUploadReveal } from "./DocumentUploadReveal";

vi.mock("./ManualEntryForm", () => ({
  ManualEntryForm: () => <div data-testid="manual-entry-form" />,
}));

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
  Toaster: () => null,
}));

vi.mock("@/lib/actions/documents", () => ({
  confirmExtraction: vi.fn(),
  saveDocument: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { confirmExtraction, saveDocument } from "@/lib/actions/documents";
const mockConfirmExtraction = vi.mocked(confirmExtraction);
const mockSaveDocument = vi.mocked(saveDocument);

beforeEach(() => {
  vi.clearAllMocks();
  mockRouterPush.mockClear();
});

describe("DocumentUploadReveal", () => {
  it("renders drop zone in idle state", () => {
    render(<DocumentUploadReveal vehicleId="v1" vehicleName="Toyota Camry" />);
    expect(screen.getByRole("heading", { name: "Upload document" })).toBeInTheDocument();
    expect(screen.getByText("Drop a file here")).toBeInTheDocument();
    expect(screen.getByText("JPEG, PNG, or PDF")).toBeInTheDocument();
  });

  it("shows an error for unsupported file types", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<DocumentUploadReveal vehicleId="v1" vehicleName="Toyota Camry" />);

    const input = screen.getByLabelText("Select a file to upload");
    const file = new File(["content"], "document.txt", { type: "text/plain" });
    await user.upload(input, file);

    expect(
      screen.getByText("That file type isn't supported. Try JPEG, PNG, or PDF."),
    ).toBeInTheDocument();
  });

  async function uploadAndExtract(
    extractionResult: Awaited<ReturnType<typeof confirmExtraction>>,
  ) {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ signedUrl: "https://storage.example.com/upload", path: "user/v1/file.jpg" }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    mockConfirmExtraction.mockResolvedValueOnce(extractionResult as never);

    render(<DocumentUploadReveal vehicleId="v1" vehicleName="Toyota Camry" />);

    const input = screen.getByLabelText("Select a file to upload");
    const file = new File(["content"], "insurance.jpg", { type: "image/jpeg" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    return user;
  }

  it("ConfirmBar Save is disabled when verify fields have not been addressed", async () => {
    await uploadAndExtract({
      success: true,
      data: {
        fields: [
          { key: "holderName", value: "Jane Smith", confidence: "confirmed" },
          { key: "expiryDate", value: "2026-07-01", confidence: "verify" },
        ],
        overallConfidence: "verify",
      },
    });

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("ConfirmBar shows correct count string for unaddressed verify fields", async () => {
    await uploadAndExtract({
      success: true,
      data: {
        fields: [
          { key: "holderName", value: "Jane Smith", confidence: "verify" },
          { key: "expiryDate", value: "2026-07-01", confidence: "verify" },
        ],
        overallConfidence: "verify",
      },
    });

    expect(screen.getByText("2 fields need review")).toBeInTheDocument();
  });

  it("ConfirmBar Save is enabled after all verify fields are addressed and a type is selected", async () => {
    const user = await uploadAndExtract({
      success: true,
      data: {
        fields: [
          { key: "expiryDate", value: "2026-07-01", confidence: "verify" },
        ],
        overallConfidence: "verify",
      },
    });

    // Save disabled before addressing verify field
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    // Address the verify field by tapping it and clicking Done
    await user.click(screen.getByRole("button", { name: /Expiry date/i }));
    await user.click(screen.getByRole("button", { name: "Done" }));

    // Still disabled until document type is selected
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    // Select document type
    await user.click(screen.getByRole("button", { name: "Insurance" }));

    // Now Save should be enabled
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("singular 'field' copy when exactly 1 verify field unaddressed", async () => {
    await uploadAndExtract({
      success: true,
      data: {
        fields: [
          { key: "expiryDate", value: "2026-07-01", confidence: "verify" },
        ],
        overallConfidence: "verify",
      },
    });

    expect(screen.getByText("1 field need review")).toBeInTheDocument();
  });

  it("calls saveDocument and shows Sonner toast on successful save", async () => {
    const { toast } = await import("sonner");
    const user = await uploadAndExtract({
      success: true,
      data: {
        fields: [
          { key: "holderName", value: "Jane Smith", confidence: "confirmed" },
        ],
        overallConfidence: "confirmed",
      },
    });

    mockSaveDocument.mockResolvedValueOnce({
      success: true,
      data: { reminderDate: null },
    } as never);

    await user.click(screen.getByRole("button", { name: "Insurance" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockSaveDocument).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith("Saved.");
      expect(mockRouterPush).toHaveBeenCalledWith("/fleet/v1");
    });
  });

  it("shows reminder toast when saveDocument returns a reminderDate", async () => {
    const { toast } = await import("sonner");
    const user = await uploadAndExtract({
      success: true,
      data: {
        fields: [
          { key: "holderName", value: "Jane Smith", confidence: "confirmed" },
          { key: "expiryDate", value: "2026-07-01", confidence: "confirmed" },
        ],
        overallConfidence: "confirmed",
      },
    });

    mockSaveDocument.mockResolvedValueOnce({
      success: true,
      data: { reminderDate: "2026-07-01" },
    } as never);

    await user.click(screen.getByRole("button", { name: "Insurance" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        "Saved. Reminder set 30 days before July 1, 2026.",
      );
      expect(mockRouterPush).toHaveBeenCalledWith("/fleet/v1");
    });
  });

  it("renders ManualEntryForm when extraction returns failed confidence", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ signedUrl: "https://storage.example.com/upload", path: "user/v1/file.jpg" }),
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    // Extraction returns failed confidence → component enters "failed" state
    mockConfirmExtraction.mockResolvedValueOnce({
      success: true,
      data: { fields: [], overallConfidence: "failed" },
    } as never);

    render(<DocumentUploadReveal vehicleId="v1" vehicleName="Toyota Camry" />);

    const input = screen.getByLabelText("Select a file to upload");
    const file = new File(["content"], "bad-scan.jpg", { type: "image/jpeg" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByTestId("manual-entry-form")).toBeInTheDocument();
    });
  });
});

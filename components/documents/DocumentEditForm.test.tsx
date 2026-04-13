import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DocumentEditForm } from "./DocumentEditForm";
import type { Document } from "@/types";

const mockRouterRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
  Toaster: () => null,
}));

vi.mock("@/lib/actions/documents", () => ({
  updateDocument: vi.fn(),
}));

import { updateDocument } from "@/lib/actions/documents";
const mockUpdateDocument = vi.mocked(updateDocument);

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleDocument: Document = {
  id: "doc-1",
  user_id: "user-1",
  vehicle_id: "v1",
  storage_path: "user-1/v1/file.jpg",
  document_type: "insurance",
  file_name: "insurance.jpg",
  expiry_date: "2026-07-01",
  holder_name: "Jane Smith",
  policy_number: "POL-12345",
  issuer_name: "Intact Insurance",
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

describe("DocumentEditForm", () => {
  it("renders with pre-filled values from document prop", () => {
    render(<DocumentEditForm document={sampleDocument} vehicleId="v1" />);

    expect(screen.getByRole("heading", { name: "Edit details" })).toBeInTheDocument();
    expect(screen.getByLabelText("Holder name")).toHaveValue("Jane Smith");
    expect(screen.getByLabelText("Expiry date")).toHaveValue("2026-07-01");
    expect(screen.getByLabelText("Policy / plate / permit number")).toHaveValue("POL-12345");
    expect(screen.getByLabelText("Issuer / insurer name")).toHaveValue("Intact Insurance");

    // Insurance chip should be pre-selected (primary styling applied via aria)
    expect(screen.getByRole("button", { name: "Insurance" })).toBeInTheDocument();
  });

  it("calls updateDocument and toasts on successful submit", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();

    mockUpdateDocument.mockResolvedValueOnce({ success: true, data: undefined } as never);

    render(<DocumentEditForm document={sampleDocument} vehicleId="v1" />);

    // Change the holder name
    const holderInput = screen.getByLabelText("Holder name");
    await user.clear(holderInput);
    await user.type(holderInput, "John Doe");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        "doc-1",
        "v1",
        expect.objectContaining({
          documentType: "insurance",
          holderName: "John Doe",
        }),
      );
      expect(toast).toHaveBeenCalledWith("Saved.");
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it("shows error message when updateDocument returns failure", async () => {
    const user = userEvent.setup();

    mockUpdateDocument.mockResolvedValueOnce({
      success: false,
      error: "Failed to save. Try again.",
    } as never);

    render(<DocumentEditForm document={sampleDocument} vehicleId="v1" />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Failed to save. Try again.");
    });
  });

  it("allows changing document type before saving", async () => {
    const user = userEvent.setup();

    mockUpdateDocument.mockResolvedValueOnce({ success: true, data: undefined } as never);

    render(<DocumentEditForm document={sampleDocument} vehicleId="v1" />);

    await user.click(screen.getByRole("button", { name: "Registration" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        "doc-1",
        "v1",
        expect.objectContaining({ documentType: "registration" }),
      );
    });
  });

  it("renders with null optional fields as empty inputs", () => {
    const docWithNulls: Document = {
      ...sampleDocument,
      holder_name:   null,
      expiry_date:   null,
      policy_number: null,
      issuer_name:   null,
    };

    render(<DocumentEditForm document={docWithNulls} vehicleId="v1" />);

    expect(screen.getByLabelText("Holder name")).toHaveValue("");
    expect(screen.getByLabelText("Expiry date")).toHaveValue("");
    expect(screen.getByLabelText("Policy / plate / permit number")).toHaveValue("");
    expect(screen.getByLabelText("Issuer / insurer name")).toHaveValue("");
  });
});

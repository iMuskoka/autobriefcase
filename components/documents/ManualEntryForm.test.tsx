import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ManualEntryForm } from "./ManualEntryForm";

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
  Toaster: () => null,
}));

vi.mock("@/lib/actions/documents", () => ({
  saveDocument: vi.fn(),
}));

import { saveDocument } from "@/lib/actions/documents";
const mockSaveDocument = vi.mocked(saveDocument);

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultProps = {
  vehicleId: "v1",
  storagePath: "user/v1/file.jpg",
  fileName: "insurance.jpg",
};

describe("ManualEntryForm", () => {
  it("renders intro copy, all field inputs, and chip type selector", () => {
    render(<ManualEntryForm {...defaultProps} />);

    expect(
      screen.getByText("We couldn't read this one — fill in what you know."),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Holder name")).toBeInTheDocument();
    expect(screen.getByLabelText("Expiry date")).toBeInTheDocument();
    expect(screen.getByLabelText("Policy / plate / permit number")).toBeInTheDocument();
    expect(screen.getByLabelText("Issuer / insurer name")).toBeInTheDocument();

    // Document type chips
    expect(screen.getByRole("button", { name: "Insurance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registration" })).toBeInTheDocument();
  });

  it("Save is disabled when no document type is selected", () => {
    render(<ManualEntryForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("Save is enabled after a type is selected", async () => {
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Insurance" }));

    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("pre-populates fields from initialValues", () => {
    render(
      <ManualEntryForm
        {...defaultProps}
        initialValues={{
          holderName:   "Jane Smith",
          expiryDate:   "2026-07-01",
          policyNumber: "POL-12345",
          issuerName:   "Intact Insurance",
        }}
      />,
    );

    expect(screen.getByLabelText("Holder name")).toHaveValue("Jane Smith");
    expect(screen.getByLabelText("Expiry date")).toHaveValue("2026-07-01");
    expect(screen.getByLabelText("Policy / plate / permit number")).toHaveValue("POL-12345");
    expect(screen.getByLabelText("Issuer / insurer name")).toHaveValue("Intact Insurance");
  });

  it("calls saveDocument with correct args and toasts on success", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();

    mockSaveDocument.mockResolvedValueOnce({ success: true, data: undefined } as never);

    render(<ManualEntryForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Registration" }));
    await user.type(screen.getByLabelText("Holder name"), "John Doe");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockSaveDocument).toHaveBeenCalledWith(
        "v1",
        "user/v1/file.jpg",
        "registration",
        "insurance.jpg",
        expect.objectContaining({ holderName: "John Doe" }),
      );
      expect(toast).toHaveBeenCalledWith("Saved.");
      expect(mockRouterPush).toHaveBeenCalledWith("/fleet/v1");
    });
  });

  it("shows error message when saveDocument returns failure", async () => {
    const user = userEvent.setup();

    mockSaveDocument.mockResolvedValueOnce({
      success: false,
      error: "Failed to save. Try again.",
    } as never);

    render(<ManualEntryForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Insurance" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Failed to save. Try again.");
    });
  });

  it("coerces empty optional fields to null before saving", async () => {
    const user = userEvent.setup();

    mockSaveDocument.mockResolvedValueOnce({ success: true, data: undefined } as never);

    render(<ManualEntryForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Other" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockSaveDocument).toHaveBeenCalledWith(
        "v1",
        "user/v1/file.jpg",
        "other",
        "insurance.jpg",
        {
          holderName:   null,
          expiryDate:   null,
          policyNumber: null,
          issuerName:   null,
        },
      );
    });
  });
});

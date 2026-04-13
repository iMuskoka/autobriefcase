import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ExtractionField } from "./ExtractionField";
import type { ExtractionField as ExtractionFieldType } from "@/types";

const confirmedField: ExtractionFieldType = {
  key: "holderName",
  value: "Jane Smith",
  confidence: "confirmed",
};

const verifyField: ExtractionFieldType = {
  key: "expiryDate",
  value: "2026-07-01",
  confidence: "verify",
};

const failedField: ExtractionFieldType = {
  key: "policyNumber",
  value: null,
  confidence: "failed",
};

describe("ExtractionField", () => {
  it("renders confirmed field with green left border styling and no Verify label", () => {
    render(<ExtractionField field={confirmedField} onUpdate={vi.fn()} />);
    expect(screen.getByText("Holder name")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.queryByText("Verify")).not.toBeInTheDocument();
  });

  it("renders verify field with Verify label and value visible", () => {
    render(<ExtractionField field={verifyField} onUpdate={vi.fn()} />);
    expect(screen.getByText("Expiry date")).toBeInTheDocument();
    expect(screen.getByText("2026-07-01")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
  });

  it("tapping a verify field switches to inline edit input pre-filled with extracted value", async () => {
    const user = userEvent.setup();
    render(<ExtractionField field={verifyField} onUpdate={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Expiry date/i }));

    expect(screen.getByRole("textbox", { name: "Edit Expiry date" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Edit Expiry date" })).toHaveValue("2026-07-01");
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("submitting edited value calls onUpdate and transitions to edited state", async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    render(<ExtractionField field={verifyField} onUpdate={mockOnUpdate} />);

    await user.click(screen.getByRole("button", { name: /Expiry date/i }));

    const input = screen.getByRole("textbox", { name: "Edit Expiry date" });
    await user.clear(input);
    await user.type(input, "2027-01-15");
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(mockOnUpdate).toHaveBeenCalledWith("expiryDate", "2027-01-15");
    expect(screen.getByText("Edited")).toBeInTheDocument();
    expect(screen.getByText("2027-01-15")).toBeInTheDocument();
  });

  it("cancelling from manual state returns to verify state", async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    render(<ExtractionField field={verifyField} onUpdate={mockOnUpdate} />);

    await user.click(screen.getByRole("button", { name: /Expiry date/i }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Verify")).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it("returns null for a failed-confidence field (renders nothing)", () => {
    const { container } = render(<ExtractionField field={failedField} onUpdate={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

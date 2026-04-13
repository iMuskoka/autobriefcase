"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ExtractionField as ExtractionFieldType } from "@/types";

const KEY_LABELS: Record<string, string> = {
  holderName:   "Holder name",
  expiryDate:   "Expiry date",
  policyNumber: "Policy number",
  issuerName:   "Issuer",
};

type FieldState = "confirmed" | "verify" | "manual" | "edited";

interface ExtractionFieldProps {
  field: ExtractionFieldType;
  onUpdate: (key: string, value: string | null) => void;
}

export function ExtractionField({ field, onUpdate }: ExtractionFieldProps) {
  const [fieldState, setFieldState] = useState<FieldState>(() => {
    if (field.confidence === "confirmed") return "confirmed";
    if (field.confidence === "verify") return "verify";
    return "verify"; // safety fallback; failed fields are filtered upstream
  });
  const [editValue, setEditValue] = useState(field.value ?? "");
  const [displayValue, setDisplayValue] = useState(field.value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fields with failed confidence should not be rendered
  if (field.confidence === "failed") return null;

  const label = KEY_LABELS[field.key] ?? field.key;

  const handleVerifyClick = () => {
    setEditValue(displayValue);
    setFieldState("manual");
    // Focus the input after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDone = () => {
    const newValue = editValue.trim() || null;
    setDisplayValue(editValue.trim());
    setFieldState("edited");
    onUpdate(field.key, newValue);
  };

  const handleCancel = () => {
    setFieldState("verify");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleDone();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div
      aria-live="polite"
      className={cn(
        "rounded-md border p-3 border-l-4 transition-colors",
        (fieldState === "confirmed" || fieldState === "edited") && "border-l-primary bg-accent/30",
        (fieldState === "verify" || fieldState === "manual") && "border-l-warning bg-warning/5",
      )}
    >
      {/* Confirmed state */}
      {fieldState === "confirmed" && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-sm font-medium mt-0.5">{displayValue || <span className="text-muted-foreground">—</span>}</p>
        </div>
      )}

      {/* Verify state — tappable */}
      {fieldState === "verify" && (
        <button
          type="button"
          onClick={handleVerifyClick}
          className="w-full text-left"
          aria-label={`${label}: ${displayValue || "empty"} — tap to verify`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <span className="text-xs font-semibold text-warning">Verify</span>
          </div>
          <p className="text-sm font-medium mt-0.5">{displayValue || <span className="text-muted-foreground">—</span>}</p>
        </button>
      )}

      {/* Manual / edit state */}
      {fieldState === "manual" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Edit ${label}`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDone}
              className="px-3 py-1 text-xs font-semibold rounded bg-primary text-primary-foreground min-h-[36px]"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 text-xs font-medium rounded border border-input bg-background min-h-[36px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edited state */}
      {fieldState === "edited" && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <span className="text-xs font-medium text-primary">Edited</span>
          </div>
          <p className="text-sm font-medium mt-0.5">{displayValue || <span className="text-muted-foreground">—</span>}</p>
        </div>
      )}
    </div>
  );
}

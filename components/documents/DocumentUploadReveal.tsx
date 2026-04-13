"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { confirmExtraction, saveDocument } from "@/lib/actions/documents";
import {
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/lib/validations/document";
import { ExtractionField } from "./ExtractionField";
import { ManualEntryForm } from "./ManualEntryForm";
import { cn } from "@/lib/utils";
import type { ExtractionResult, ExtractionField as ExtractionFieldType } from "@/types";
import { buildSaveToast } from "@/lib/utils/toast-helpers";

type UploadState = "idle" | "uploading" | "processing" | "reveal" | "failed" | "saving";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

interface DocumentUploadRevealProps {
  vehicleId: string;
  vehicleName: string;
}

export function DocumentUploadReveal({
  vehicleId,
  vehicleName,
}: DocumentUploadRevealProps) {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [storagePath, setStoragePath] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string | null>>({});
  const [addressedVerifyKeys, setAddressedVerifyKeys] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (state !== "idle") return;
    setError(null);

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setError("That file type isn't supported. Try JPEG, PNG, or PDF.");
      return;
    }

    setState("uploading");

    try {
      // 1. Get signed upload URL
      const params = new URLSearchParams({
        vehicleId,
        fileName: file.name,
        contentType: file.type,
      });
      const urlRes = await fetch(`/api/documents/upload-url?${params}`);
      if (!urlRes.ok) {
        setError("Upload failed — try again.");
        setState("idle");
        return;
      }
      const { signedUrl, path } = await urlRes.json();

      // 2. Upload directly to Supabase Storage (ARCH-13: no Vercel involvement)
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        setError("Upload failed — try again.");
        setState("idle");
        return;
      }

      setStoragePath(path);
      setUploadedFileName(file.name);
      setState("processing");

      // 3. Trigger AI extraction
      const result = await confirmExtraction(vehicleId, path);

      if (!result.success || result.data.overallConfidence === "failed") {
        // Capture any non-null partial values for ManualEntryForm pre-population
        const partial: Record<string, string | null> = {};
        if (result.success && result.data.fields) {
          for (const f of result.data.fields) {
            if (f.value != null) partial[f.key] = f.value;
          }
        }
        setFieldValues(partial);
        setState("failed");
      } else {
        setExtractionResult(result.data);
        const initial: Record<string, string | null> = {};
        for (const f of result.data.fields) {
          initial[f.key] = f.value;
        }
        setFieldValues(initial);
        setAddressedVerifyKeys(new Set());
        setState("reveal");
      }
    } catch {
      setError("Upload failed — try again.");
      setState("idle");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFieldUpdate = (key: string, value: string | null) => {
    setFieldValues(prev => ({ ...prev, [key]: value }));
    setAddressedVerifyKeys(prev => new Set([...prev, key]));
  };

  const handleSave = async () => {
    if (!selectedType) return;
    setState("saving");
    try {
      const confirmedFields = {
        holderName:   fieldValues["holderName"]   ?? null,
        expiryDate:   fieldValues["expiryDate"]   ?? null,
        policyNumber: fieldValues["policyNumber"] ?? null,
        issuerName:   fieldValues["issuerName"]   ?? null,
      };
      const result = await saveDocument(
        vehicleId,
        storagePath,
        selectedType,
        uploadedFileName,
        confirmedFields,
      );
      if (result.success) {
        toast(buildSaveToast(result.data.reminderDate));
        router.push(`/fleet/${vehicleId}`);
      } else {
        setError(result.error);
        setState("reveal");
      }
    } catch {
      setError("Failed to save document. Try again.");
      setState("reveal");
    }
  };

  // ConfirmBar derived state
  const verifyFields: ExtractionFieldType[] = extractionResult?.fields.filter(
    f => f.confidence === "verify",
  ) ?? [];
  const unaddressedVerifyCount = verifyFields.filter(
    f => !addressedVerifyKeys.has(f.key),
  ).length;
  const canSave = unaddressedVerifyCount === 0 && selectedType !== null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Upload document</h1>
        <p className="text-sm text-muted-foreground mt-1">{vehicleName}</p>
      </div>

      {/* Step 1: DropZone */}
      {state === "idle" && (
        <div className="flex flex-col gap-3">
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop zone — click or drag a file here"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent/50",
            )}
          >
            <p className="text-sm font-medium">Drop a file here</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, or PDF</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] pointer-events-none"
              aria-hidden="true"
            >
              Upload document
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="sr-only"
            onChange={handleInputChange}
            aria-label="Select a file to upload"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}
        </div>
      )}

      {/* Step 2: Uploading */}
      {state === "uploading" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Uploading…</p>
          <div
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
          >
            <div className="h-full w-1/2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      )}

      {/* Step 3: Processing — AI extraction in flight */}
      {state === "processing" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-medium">Reading document…</p>
          </div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Reveal — show extracted fields */}
      {(state === "reveal" || state === "saving") && extractionResult && (
        <div className="flex flex-col gap-4">
          {/* Sequential field reveal */}
          <div className="flex flex-col gap-2">
            {extractionResult.fields
              .filter(f => f.confidence !== "failed")
              .map((field, index) => (
                <div
                  key={field.key}
                  className="animate-field-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ExtractionField field={field} onUpdate={handleFieldUpdate} />
                </div>
              ))}
          </div>

          {/* Document type selector */}
          <div>
            <p className="text-sm font-medium mb-3">Document type</p>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPE_VALUES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  disabled={state === "saving"}
                  className={cn(
                    "px-4 py-2 rounded-md border text-sm font-medium min-h-[44px] transition-colors",
                    selectedType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input bg-background hover:bg-accent",
                    state === "saving" && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {DOCUMENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}

          {/* ConfirmBar */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={!canSave || state === "saving"}
              className="min-h-[44px]"
            >
              {state === "saving" ? "Saving…" : "Save"}
            </Button>
            {unaddressedVerifyCount > 0 && (
              <p className="text-sm text-warning">
                {unaddressedVerifyCount} field{unaddressedVerifyCount !== 1 ? "s" : ""} need review
              </p>
            )}
          </div>
        </div>
      )}

      {/* Failed state — ManualEntryForm */}
      {state === "failed" && (
        <ManualEntryForm
          vehicleId={vehicleId}
          storagePath={storagePath}
          fileName={uploadedFileName}
          initialValues={fieldValues}
        />
      )}
    </div>
  );
}

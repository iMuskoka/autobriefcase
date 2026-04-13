"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveDocument } from "@/lib/actions/documents";
import {
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/lib/validations/document";
import { cn } from "@/lib/utils";
import { buildSaveToast } from "@/lib/utils/toast-helpers";

type UploadState = "idle" | "uploading" | "type-selection" | "saving";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

interface DocumentUploadFormProps {
  vehicleId: string;
  vehicleName: string;
}

export function DocumentUploadForm({
  vehicleId,
  vehicleName,
}: DocumentUploadFormProps) {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [storagePath, setStoragePath] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
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
      setState("type-selection");
    } catch {
      setError("Upload failed — try again.");
      setState("idle");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSave = async () => {
    if (!selectedType) return;
    setState("saving");
    try {
      const result = await saveDocument(
        vehicleId,
        storagePath,
        selectedType,
        uploadedFileName,
      );
      if (!result.success) {
        setError(result.error);
        setState("type-selection");
      } else {
        toast(buildSaveToast(result.data.reminderDate));
        router.push(`/fleet/${vehicleId}`);
      }
    } catch {
      setError("Failed to save document. Try again.");
      setState("type-selection");
    }
  };

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
          {/* Hidden file input — no capture attribute so iOS shows Camera/Photos/Browse */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="sr-only"
            onChange={handleInputChange}
            aria-label="Select a file to upload"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
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

      {/* Step 3: Type selection */}
      {(state === "type-selection" || state === "saving") && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium mb-3">Document type</p>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPE_VALUES.map((type) => (
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
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={!selectedType || state === "saving"}
            className="min-h-[44px] self-start"
          >
            {state === "saving" ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

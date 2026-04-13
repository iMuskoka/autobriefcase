"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveDocument } from "@/lib/actions/documents";
import {
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/lib/validations/document";
import { cn } from "@/lib/utils";
import { buildSaveToast } from "@/lib/utils/toast-helpers";

const schema = z.object({
  holderName:   z.string().optional(),
  expiryDate:   z.string().optional(),
  policyNumber: z.string().optional(),
  issuerName:   z.string().optional(),
});

type ManualEntryValues = z.infer<typeof schema>;

interface ManualEntryFormProps {
  vehicleId: string;
  storagePath: string;
  fileName: string;
  initialValues?: {
    holderName?: string | null;
    expiryDate?: string | null;
    policyNumber?: string | null;
    issuerName?: string | null;
  };
}

export function ManualEntryForm({
  vehicleId,
  storagePath,
  fileName,
  initialValues,
}: ManualEntryFormProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ManualEntryValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      holderName:   initialValues?.holderName   ?? "",
      expiryDate:   initialValues?.expiryDate   ?? "",
      policyNumber: initialValues?.policyNumber ?? "",
      issuerName:   initialValues?.issuerName   ?? "",
    },
  });

  const onSubmit = async (values: ManualEntryValues) => {
    if (!selectedType) return;
    setError(null);
    const result = await saveDocument(
      vehicleId,
      storagePath,
      selectedType,
      fileName,
      {
        holderName:   values.holderName   || null,
        expiryDate:   values.expiryDate   || null,
        policyNumber: values.policyNumber || null,
        issuerName:   values.issuerName   || null,
      },
    );
    if (result.success) {
      toast(buildSaveToast(result.data.reminderDate));
      router.push(`/fleet/${vehicleId}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t read this one — fill in what you know.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Document type */}
        <div>
          <p className="text-sm font-medium mb-3">Document type</p>
          <div className="flex flex-wrap gap-2">
            {DOCUMENT_TYPE_VALUES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                disabled={isSubmitting}
                className={cn(
                  "px-4 py-2 rounded-md border text-sm font-medium min-h-[44px] transition-colors",
                  selectedType === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input bg-background hover:bg-accent",
                  isSubmitting && "opacity-50 cursor-not-allowed",
                )}
              >
                {DOCUMENT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Optional fields */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="holderName">Holder name</Label>
            <Input
              id="holderName"
              placeholder="e.g. Jane Smith"
              {...register("holderName")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expiryDate">Expiry date</Label>
            <Input
              id="expiryDate"
              type="date"
              {...register("expiryDate")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="policyNumber">Policy / plate / permit number</Label>
            <Input
              id="policyNumber"
              placeholder="e.g. ABC-123456"
              {...register("policyNumber")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="issuerName">Issuer / insurer name</Label>
            <Input
              id="issuerName"
              placeholder="e.g. Intact Insurance"
              {...register("issuerName")}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          disabled={!selectedType || isSubmitting}
          className="min-h-[44px] self-start"
        >
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}

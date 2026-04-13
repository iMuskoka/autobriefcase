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
import { updateDocument } from "@/lib/actions/documents";
import {
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/lib/validations/document";
import { cn } from "@/lib/utils";
import type { Document } from "@/types";

const schema = z.object({
  holderName:   z.string().optional(),
  expiryDate:   z.string().optional(),
  policyNumber: z.string().optional(),
  issuerName:   z.string().optional(),
});

type EditValues = z.infer<typeof schema>;

interface DocumentEditFormProps {
  document: Document;
  vehicleId: string;
}

export function DocumentEditForm({ document, vehicleId }: DocumentEditFormProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<DocumentType>(
    document.document_type as DocumentType,
  );
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      holderName:   document.holder_name   ?? "",
      expiryDate:   document.expiry_date   ?? "",
      policyNumber: document.policy_number ?? "",
      issuerName:   document.issuer_name   ?? "",
    },
  });

  const onSubmit = async (values: EditValues) => {
    setError(null);
    const result = await updateDocument(document.id, vehicleId, {
      documentType: selectedType,
      holderName:   values.holderName   || null,
      expiryDate:   values.expiryDate   || null,
      policyNumber: values.policyNumber || null,
      issuerName:   values.issuerName   || null,
    });
    if (result.success) {
      toast("Saved.");
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading font-semibold text-lg">Edit details</h2>

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

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-holderName">Holder name</Label>
            <Input
              id="edit-holderName"
              placeholder="e.g. Jane Smith"
              {...register("holderName")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-expiryDate">Expiry date</Label>
            <Input
              id="edit-expiryDate"
              type="date"
              {...register("expiryDate")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-policyNumber">Policy / plate / permit number</Label>
            <Input
              id="edit-policyNumber"
              placeholder="e.g. ABC-123456"
              {...register("policyNumber")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-issuerName">Issuer / insurer name</Label>
            <Input
              id="edit-issuerName"
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
          disabled={isSubmitting}
          className="min-h-[44px] self-start"
        >
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}

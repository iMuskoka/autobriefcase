import { z } from "zod";

export const DOCUMENT_TYPE_VALUES = [
  "insurance",
  "registration",
  "license",
  "seasonal_permit",
  "service_record",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPE_VALUES)[number];

export const documentTypeSchema = z.enum(DOCUMENT_TYPE_VALUES);

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  insurance:       "Insurance",
  registration:    "Registration",
  license:         "License",
  seasonal_permit: "Seasonal Permit",
  service_record:  "Service Record",
  other:           "Other",
};

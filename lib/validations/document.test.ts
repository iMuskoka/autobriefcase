import { describe, it, expect } from "vitest";
import {
  documentTypeSchema,
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_TYPE_LABELS,
} from "./document";

describe("documentTypeSchema", () => {
  it("accepts all valid document types", () => {
    for (const type of DOCUMENT_TYPE_VALUES) {
      expect(documentTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("rejects unknown document types", () => {
    expect(documentTypeSchema.safeParse("unknown_type").success).toBe(false);
    expect(documentTypeSchema.safeParse("").success).toBe(false);
    expect(documentTypeSchema.safeParse(null).success).toBe(false);
  });

  it("has a label for every document type value", () => {
    for (const type of DOCUMENT_TYPE_VALUES) {
      expect(DOCUMENT_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});

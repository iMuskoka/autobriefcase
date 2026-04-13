// ActionResult<T>: standard return type for all Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

import { VEHICLE_CATEGORY_VALUES } from "@/lib/validations/vehicle";
import type { DocumentType } from "@/lib/validations/document";

// Derived from VEHICLE_CATEGORY_VALUES — single source of truth, cannot drift
export type VehicleCategory = (typeof VEHICLE_CATEGORY_VALUES)[number];

export type Vehicle = {
  id: string
  user_id: string
  category: VehicleCategory
  make: string
  model: string
  year: number
  nickname: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Document = {
  id: string
  user_id: string
  vehicle_id: string
  storage_path: string
  document_type: DocumentType
  file_name: string
  expiry_date: string | null
  holder_name: string | null
  policy_number: string | null
  issuer_name: string | null
  created_at: string
  updated_at: string
}

// AI extraction canonical types — used everywhere extraction data flows
export type ExtractionConfidence = 'confirmed' | 'verify' | 'failed'

export type ExtractionField = {
  key: string           // 'holderName' | 'expiryDate' | 'policyNumber' | 'issuerName'
  value: string | null
  confidence: ExtractionConfidence
}

export type ExtractionResult = {
  fields: ExtractionField[]
  overallConfidence: ExtractionConfidence
  rawText?: string
}

export type Reminder = {
  id: string
  vehicle_id: string
  user_id: string
  created_at: string
}

// ActionResult<T>: standard return type for all Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

import { VEHICLE_CATEGORY_VALUES } from "@/lib/validations/vehicle";

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
  vehicle_id: string
  user_id: string
  created_at: string
}

export type Reminder = {
  id: string
  vehicle_id: string
  user_id: string
  created_at: string
}

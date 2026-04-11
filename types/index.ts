// ActionResult<T>: standard return type for all Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// Stub types — will be replaced with Database["public"]["Tables"][*]["Row"] once
// supabase.ts is generated and schema expands in Stories 2.x–5.x
export type Vehicle = {
  id: string
  user_id: string
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

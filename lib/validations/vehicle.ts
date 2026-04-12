import { z } from "zod";

export const VEHICLE_CATEGORY_VALUES = [
  "car",
  "motorcycle",
  "boat",
  "pwc",
  "snowmobile",
  "atv",
  "seasonal_pass",
] as const;

export type VehicleCategoryValue = (typeof VEHICLE_CATEGORY_VALUES)[number];

export const vehicleSchema = z.object({
  category: z.enum(VEHICLE_CATEGORY_VALUES, {
    error: "Select a vehicle category",
  }),
  make: z
    .string()
    .min(1, "Make is required")
    .max(100, "Make must be 100 characters or less"),
  model: z
    .string()
    .min(1, "Model is required")
    .max(100, "Model must be 100 characters or less"),
  // valueAsNumber: true in register() converts HTML input string → number before Zod sees it
  // refine (not .max) so the ceiling re-evaluates at validation time, not module load time.
  // Message is computed once at schema definition (module load), but the validator runs fresh.
  year: z
    .number({ error: "Year must be a number" })
    .int("Year must be a whole number")
    .min(1900, "Year must be 1900 or later")
    .refine(
      (val) => val <= new Date().getFullYear() + 1,
      { message: `Year cannot be after ${new Date().getFullYear() + 1}` },
    ),
  nickname: z
    .string()
    .max(100, "Nickname must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or less")
    .optional()
    .or(z.literal("")),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

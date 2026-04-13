import type { LucideIcon } from "lucide-react";
import {
  Car,
  Bike,
  Anchor,
  Waves,
  Snowflake,
  Tractor,
  Ticket,
  HelpCircle,
} from "lucide-react";
import type { VehicleCategory } from "@/types";

/** Maps every known VehicleCategory value to its display icon. */
export const VEHICLE_CATEGORY_ICONS: Record<VehicleCategory, LucideIcon> = {
  car: Car,
  motorcycle: Bike,
  boat: Anchor,
  pwc: Waves,
  snowmobile: Snowflake,
  atv: Tractor,
  seasonal_pass: Ticket,
};

/**
 * Fallback icon for unknown or future category values not yet in the map.
 * Use with: VEHICLE_CATEGORY_ICONS[category] ?? VEHICLE_CATEGORY_FALLBACK_ICON
 */
export const VEHICLE_CATEGORY_FALLBACK_ICON: LucideIcon = HelpCircle;

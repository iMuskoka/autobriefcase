import type { FleetHealthHeroProps } from "@/components/fleet/FleetHealthHero";
import type { VehicleHealthState } from "@/types";

export type { VehicleHealthState };

export type ObligationItem = {
  reminderId:   string
  vehicleId:    string
  vehicleName:  string        // nickname ?? `${year} ${make} ${model}`
  documentType: string        // human-readable label from DOCUMENT_TYPE_LABELS
  expiryDate:   string        // ISO "YYYY-MM-DD"
  daysToExpiry: number        // computed: Math.ceil((expiry - today) / 86_400_000)
}

/**
 * Parse an ISO date string "YYYY-MM-DD" as local time (no timezone shift).
 * Never use `new Date("YYYY-MM-DD")` — that parses as UTC midnight.
 */
export function getDaysToExpiry(expiryDate: string): number {
  const [y, m, d] = expiryDate.split("-").map(Number);
  const expiry = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Derive a single vehicle's health state from its obligations.
 * `obligations` should be only the pending obligations for one vehicle.
 */
export function getVehicleHealthState(obligations: ObligationItem[]): VehicleHealthState {
  if (obligations.length === 0) return 'no-docs';
  const minDays = Math.min(...obligations.map(o => o.daysToExpiry));
  if (minDays <= 14) return 'critical';
  if (minDays <= 30) return 'attention';
  return 'healthy';
}

/**
 * Build the discriminated union props for <FleetHealthHero> from all obligations.
 * `vehicleCount` = total number of vehicles in the fleet.
 */
export function buildFleetHeroProps(
  allObligations: ObligationItem[],
  vehicleCount: number,
): FleetHealthHeroProps {
  if (vehicleCount === 0) return { state: 'empty' };

  const criticalObs = allObligations.filter(o => o.daysToExpiry <= 14);
  const attentionObs = allObligations.filter(o => o.daysToExpiry > 14 && o.daysToExpiry <= 30);

  if (criticalObs.length > 0) {
    return {
      state: 'critical',
      vehicleCount: criticalObs.length,
      nextRenewalDays: Math.min(...criticalObs.map(o => o.daysToExpiry)),
    };
  }
  if (attentionObs.length > 0) {
    return {
      state: 'attention',
      vehicleCount: attentionObs.length,
      nextRenewalDays: Math.min(...attentionObs.map(o => o.daysToExpiry)),
    };
  }
  return { state: 'covered', vehicleCount };
}

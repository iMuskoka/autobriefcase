import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FleetHealthHero } from "@/components/fleet/FleetHealthHero";
import { VehicleCard } from "@/components/fleet/VehicleCard";
import { ObligationRow } from "@/components/obligations/ObligationRow";
import { getDaysToExpiry, buildFleetHeroProps, type ObligationItem } from "@/lib/obligations";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/validations/document";
import { getVehicleHealthState } from "@/lib/obligations";
import type { Vehicle } from "@/types";

export const metadata = {
  title: "Fleet | AutoBriefcase",
};

export default async function FleetPage() {
  const supabase = await createClient();

  const [{ data: vehicleData }, { data: reminderData }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("reminders")
      .select(`
        id, vehicle_id, expiry_date,
        documents!document_id (document_type),
        vehicles!vehicle_id (make, model, year, nickname)
      `)
      .eq("status", "pending")
      .order("expiry_date", { ascending: true }),
  ]);

  const vehicles: Vehicle[] = vehicleData ?? [];

  // Build ObligationItem[] from raw reminder rows
  // Guard: skip rows where the join returned null (orphaned reminder — document or vehicle deleted)
  const allObligations: ObligationItem[] = (reminderData ?? [])
    .filter(r => r.documents != null && r.vehicles != null)
    .map(r => {
      const rawType = (r.documents as unknown as { document_type: string }).document_type;
      const documentType = DOCUMENT_TYPE_LABELS[rawType as DocumentType] ?? rawType;
      const v = r.vehicles as unknown as { make: string; model: string; year: number; nickname: string | null };
      const vehicleName = v.nickname ?? `${v.year} ${v.make} ${v.model}`;
      return {
        reminderId:   r.id,
        vehicleId:    r.vehicle_id,
        vehicleName,
        documentType,
        expiryDate:   r.expiry_date,
        daysToExpiry: getDaysToExpiry(r.expiry_date),
      };
    });

  // Group by vehicle_id
  const obligationsByVehicle = new Map<string, ObligationItem[]>();
  for (const ob of allObligations) {
    const existing = obligationsByVehicle.get(ob.vehicleId) ?? [];
    existing.push(ob);
    obligationsByVehicle.set(ob.vehicleId, existing);
  }

  const heroProps = buildFleetHeroProps(allObligations, vehicles.length);

  // Upcoming strip: next 5 items (already sorted ascending by expiry_date from DB)
  const upcomingObligations = allObligations.slice(0, 5);

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      <FleetHealthHero {...heroProps} />
      {vehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => {
            const obligations = obligationsByVehicle.get(vehicle.id) ?? [];
            const healthState = getVehicleHealthState(obligations);
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                healthState={healthState}
                obligations={obligations}
              />
            );
          })}
        </div>
      )}
      {allObligations.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Coming up</h2>
            <Link
              href="/timeline"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {upcomingObligations.map(o => (
              <ObligationRow key={o.reminderId} obligation={o} variant="strip" />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

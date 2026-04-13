import { createClient } from "@/lib/supabase/server";
import { FleetHealthHero } from "@/components/fleet/FleetHealthHero";
import { VehicleCard } from "@/components/fleet/VehicleCard";
import type { Vehicle } from "@/types";

export const metadata = {
  title: "Fleet | AutoBriefcase",
};

export default async function FleetPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: true });

  const vehicles: Vehicle[] = data ?? [];

  const heroProps =
    vehicles.length === 0
      ? ({ state: "empty" } as const)
      : ({ state: "covered", vehicleCount: vehicles.length } as const);

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      <FleetHealthHero {...heroProps} />
      {vehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}

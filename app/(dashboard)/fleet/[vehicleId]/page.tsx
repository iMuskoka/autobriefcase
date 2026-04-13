import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleDetailHeader } from "@/components/fleet/VehicleDetailHeader";
import { VehicleTabs } from "@/components/fleet/VehicleTabs";
import type { Vehicle } from "@/types";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;

  const supabase = await createClient();
  const [{ data: vehicle }, { data: documents }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", vehicleId).single(),
    supabase
      .from("documents")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false }),
  ]);

  if (!vehicle) notFound();

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <VehicleDetailHeader vehicle={vehicle as Vehicle} vehicleId={vehicleId} />
      <VehicleTabs
        vehicleId={vehicleId}
        notes={(vehicle as Vehicle).notes}
        documents={documents ?? []}
      />
    </div>
  );
}

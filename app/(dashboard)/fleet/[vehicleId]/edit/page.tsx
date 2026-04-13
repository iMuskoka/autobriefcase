import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditVehicleForm } from "@/components/fleet/EditVehicleForm";
import type { Vehicle } from "@/types";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .single();

  if (!data) notFound();

  return (
    <div className="max-w-lg mx-auto p-6 lg:p-8">
      <EditVehicleForm vehicle={data as Vehicle} vehicleId={vehicleId} />
    </div>
  );
}

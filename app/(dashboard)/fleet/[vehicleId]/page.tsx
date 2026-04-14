import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleDetailHeader } from "@/components/fleet/VehicleDetailHeader";
import { VehicleTabs } from "@/components/fleet/VehicleTabs";
import { getDaysToExpiry, type ObligationItem } from "@/lib/obligations";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/validations/document";
import type { Vehicle } from "@/types";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;

  const supabase = await createClient();
  const [{ data: vehicle }, { data: documents }, { data: reminderData }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", vehicleId).single(),
    supabase
      .from("documents")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reminders")
      .select(`
        id, vehicle_id, expiry_date,
        documents!document_id (document_type)
      `)
      .eq("vehicle_id", vehicleId)
      .eq("status", "pending")
      .order("expiry_date", { ascending: true }),
  ]);

  if (!vehicle) notFound();

  const vehicleObj = vehicle as Vehicle;
  const vehicleName = vehicleObj.nickname ?? `${vehicleObj.year} ${vehicleObj.make} ${vehicleObj.model}`;

  // Guard: skip rows where the join returned null (orphaned reminder — document deleted)
  const obligations: ObligationItem[] = (reminderData ?? [])
    .filter(r => r.documents != null)
    .map(r => {
      const rawType = (r.documents as unknown as { document_type: string }).document_type;
      const documentType = DOCUMENT_TYPE_LABELS[rawType as DocumentType] ?? rawType;
      return {
        reminderId:   r.id,
        vehicleId:    r.vehicle_id,
        vehicleName,
        documentType,
        expiryDate:   r.expiry_date,
        daysToExpiry: getDaysToExpiry(r.expiry_date),
      };
    });

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <VehicleDetailHeader vehicle={vehicleObj} vehicleId={vehicleId} />
      <VehicleTabs
        vehicleId={vehicleId}
        notes={vehicleObj.notes}
        documents={documents ?? []}
        obligations={obligations}
      />
    </div>
  );
}

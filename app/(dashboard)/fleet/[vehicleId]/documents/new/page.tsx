import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";

export default async function DocumentUploadPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;

  const supabase = await createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, nickname")
    .eq("id", vehicleId)
    .single();

  if (!vehicle) notFound();

  const vehicleName =
    vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`;

  return (
    <div className="p-6 lg:p-8 max-w-lg">
      <DocumentUploadForm vehicleId={vehicleId} vehicleName={vehicleName} />
    </div>
  );
}

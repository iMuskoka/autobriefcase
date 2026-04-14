import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentUploadReveal } from "@/components/documents/DocumentUploadReveal";

export default async function DocumentUploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ renewsReminderId?: string }>;
}) {
  const { vehicleId } = await params;
  const { renewsReminderId } = await searchParams;

  const supabase = await createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, nickname")
    .eq("id", vehicleId)
    .single();

  if (!vehicle) notFound();

  const vehicleName =
    vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`;

  // Validate renewal context if renewsReminderId is provided
  let renewsContext: { reminderId: string; leadTimeDays: number } | undefined;
  if (renewsReminderId) {
    const { data: reminder } = await supabase
      .from("reminders")
      .select("id, lead_time_days, status")
      .eq("id", renewsReminderId)
      .eq("vehicle_id", vehicleId)
      .maybeSingle();
    // Only allow renewal of pending/sent reminders — not already dismissed ones
    if (reminder && reminder.status !== "dismissed") {
      renewsContext = {
        reminderId: reminder.id,
        leadTimeDays: reminder.lead_time_days,
      };
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-lg">
      <DocumentUploadReveal
        vehicleId={vehicleId}
        vehicleName={vehicleName}
        renewsContext={renewsContext}
      />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { ObligationTimeline } from "@/components/obligations/ObligationTimeline";
import { getDaysToExpiry, type ObligationItem } from "@/lib/obligations";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/validations/document";

export const metadata = {
  title: "Timeline | AutoBriefcase",
};

export default async function TimelinePage() {
  const supabase = await createClient();

  const { data: reminderData } = await supabase
    .from("reminders")
    .select(`
      id, vehicle_id, expiry_date,
      documents!document_id (document_type),
      vehicles!vehicle_id (make, model, year, nickname)
    `)
    .eq("status", "pending")
    .order("expiry_date", { ascending: true });

  // Guard: skip rows where the join returned null (orphaned reminder — document or vehicle deleted)
  const obligations: ObligationItem[] = (reminderData ?? [])
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

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Timeline</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All upcoming renewals across your fleet, sorted by urgency.
        </p>
      </div>
      <ObligationTimeline obligations={obligations} />
    </div>
  );
}

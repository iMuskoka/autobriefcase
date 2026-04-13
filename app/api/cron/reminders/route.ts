import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendReminder } from "@/lib/email/send-reminder";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/validations/document";

export async function GET(request: Request) {
  // 1. Verify CRON_SECRET — guard against missing env var before comparison
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET is not configured");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient(); // bypasses RLS
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. Query pending reminders with a generous cutoff, then filter per lead_time_days in JS
  const GENEROUS_CUTOFF_DAYS = 90; // covers Story 5.3 max lead time
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() + GENEROUS_CUTOFF_DAYS);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const { data: candidates, error: queryError } = await supabase
    .from("reminders")
    .select(`
      id, user_id, expiry_date, lead_time_days,
      vehicles!vehicle_id (make, model, year, nickname),
      documents!document_id (document_type)
    `)
    .eq("status", "pending")
    .lte("expiry_date", cutoffStr);

  if (queryError) {
    console.error("Cron reminders query error:", queryError);
    return Response.json({ error: "Query failed" }, { status: 500 });
  }

  // 3. Filter: reminder fire date = expiry_date - lead_time_days <= today
  const dueReminders = (candidates ?? []).filter(r => {
    const [y, m, d] = r.expiry_date.split("-").map(Number);
    const expiry = new Date(y, m - 1, d);
    const fireDate = new Date(expiry);
    fireDate.setDate(expiry.getDate() - r.lead_time_days);
    return fireDate <= today;
  });

  // 4. Get user emails from user_profiles
  const userIds = [...new Set(dueReminders.map(r => r.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("id, email")
    .in("id", userIds);
  if (profilesError) {
    console.error("Cron reminders: failed to fetch user profiles:", profilesError);
  }
  const emailByUserId = Object.fromEntries(
    (profiles ?? []).filter(p => p.email).map(p => [p.id, p.email as string]),
  );

  // 5. Dispatch each reminder independently (don't fail all on one error)
  let dispatched = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    const email = emailByUserId[reminder.user_id];
    if (!email) { failed++; continue; }

    try {
      const vehicle = reminder.vehicles as unknown as { make: string; model: string; year: number; nickname: string | null };
      const vehicleName = vehicle.nickname ?? `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      const rawType = (reminder.documents as unknown as { document_type: string }).document_type;
      const documentType = DOCUMENT_TYPE_LABELS[rawType as DocumentType] ?? rawType;

      const [y, m, d] = reminder.expiry_date.split("-").map(Number);
      const expiry = new Date(y, m - 1, d);
      const daysUntilExpiry = Math.max(0, Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000));
      const expiryDate = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(y, m - 1, d));

      await sendReminder({ to: email, vehicleName, documentType, expiryDate, daysUntilExpiry });

      const { error: updateError } = await supabase
        .from("reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", reminder.id);

      if (updateError) {
        console.error(`Failed to mark reminder ${reminder.id} as sent:`, updateError);
        failed++;
        continue;
      }

      dispatched++;
    } catch (err) {
      console.error(`Reminder dispatch failed for reminder ${reminder.id}:`, err);
      failed++;
    }
  }

  return Response.json({ dispatched, failed });
}

import { Resend } from "resend";
import { ReminderEmail } from "./templates/ReminderEmail";

export interface SendReminderParams {
  to:              string;   // user email
  vehicleName:     string;
  documentType:    string;   // human-readable label
  expiryDate:      string;   // formatted date string "July 1, 2026"
  daysUntilExpiry: number;
}

export async function sendReminder(params: SendReminderParams): Promise<{ messageId: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { to, vehicleName, documentType, expiryDate, daysUntilExpiry } = params;
  const subject = `Your ${vehicleName} ${documentType} renews in ${daysUntilExpiry} days`;

  const { data, error } = await resend.emails.send({
    from:  process.env.RESEND_FROM_EMAIL ?? "AutoBriefcase <noreply@autobriefcase.app>",
    to,
    subject,
    react: ReminderEmail({ vehicleName, documentType, expiryDate, daysUntilExpiry }),
  });

  if (error || !data?.id) {
    throw new Error(`Resend error: ${error?.message ?? "unknown"}`);
  }
  return { messageId: data.id };
}

export function buildSaveToast(reminderDate: string | null): string {
  if (!reminderDate) return "Saved.";
  const [y, m, d] = reminderDate.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
  return `Saved. Reminder set 30 days before ${formatted}.`;
}

export function buildRenewedToast(nextReminderDate: string | null): string {
  if (!nextReminderDate) return "Renewed.";
  const [y, m, d] = nextReminderDate.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
  return `Renewed. Next reminder set for ${formatted}.`;
}

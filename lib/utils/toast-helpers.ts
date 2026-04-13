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

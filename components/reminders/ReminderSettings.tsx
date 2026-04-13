"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateReminderSettings } from "@/lib/actions/reminders";
import type { Reminder } from "@/types";

const LEAD_TIME_OPTIONS = [14, 30, 60, 90] as const;

interface ReminderSettingsProps {
  reminder: Reminder;
  vehicleId: string;
  documentId: string;
}

export function ReminderSettings({ reminder, vehicleId, documentId }: ReminderSettingsProps) {
  const [isPending, startTransition] = useTransition();

  function handleSelect(days: number) {
    if (days === reminder.lead_time_days) return;
    startTransition(async () => {
      const result = await updateReminderSettings(reminder.id, days, vehicleId, documentId);
      if (result.success) {
        toast("Reminder updated.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-semibold text-base">Reminder</h2>
        <p className="text-sm text-muted-foreground">
          Send me an email this many days before the document expires.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {LEAD_TIME_OPTIONS.map((days) => {
          const isActive = reminder.lead_time_days === days;
          return (
            <Button
              key={days}
              variant={isActive ? "default" : "outline"}
              className="min-h-[44px] min-w-[44px]"
              aria-pressed={isActive}
              disabled={isPending}
              onClick={() => handleSelect(days)}
            >
              {days} days before
            </Button>
          );
        })}
      </div>
    </div>
  );
}

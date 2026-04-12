"use client";

import { Car, Bike, Anchor, Waves, Snowflake, Tractor, Ticket } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const VEHICLE_CATEGORIES = [
  { value: "car",           label: "Car",          Icon: Car       },
  { value: "motorcycle",    label: "Motorcycle",   Icon: Bike      },
  { value: "boat",          label: "Boat",         Icon: Anchor    },
  { value: "pwc",           label: "PWC",          Icon: Waves     },
  { value: "snowmobile",    label: "Snowmobile",   Icon: Snowflake },
  { value: "atv",           label: "ATV",          Icon: Tractor   },
  { value: "seasonal_pass", label: "Seasonal Pass",Icon: Ticket    },
] as const;

interface VehicleCategoryPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  error?: string;
  labelId?: string;
}

export function VehicleCategoryPicker({
  value,
  onValueChange,
  error,
  labelId,
}: VehicleCategoryPickerProps) {
  return (
    <div className="grid gap-2">
      <ToggleGroup
        type="single"
        value={value ?? ""}
        onValueChange={(val) => {
          // Radix fires "" when deselecting — keep current value to enforce required selection
          if (val) onValueChange(val);
        }}
        aria-label={labelId ? undefined : "Vehicle category"}
        aria-labelledby={labelId}
        className="flex flex-wrap gap-2 w-full justify-start"
      >
        {VEHICLE_CATEGORIES.map(({ value: catValue, label, Icon }) => (
          <ToggleGroupItem
            key={catValue}
            value={catValue}
            aria-label={label}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium rounded-md border border-border",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary",
              "data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground",
            )}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
    </div>
  );
}

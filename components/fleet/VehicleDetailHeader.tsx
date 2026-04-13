import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  VEHICLE_CATEGORY_ICONS,
  VEHICLE_CATEGORY_FALLBACK_ICON,
} from "@/lib/vehicle-categories";
import type { Vehicle, VehicleCategory } from "@/types";

export function VehicleDetailHeader({
  vehicle,
  vehicleId,
}: {
  vehicle: Vehicle;
  vehicleId: string;
}) {
  const Icon =
    VEHICLE_CATEGORY_ICONS[vehicle.category as VehicleCategory] ??
    VEHICLE_CATEGORY_FALLBACK_ICON;
  const displayName = vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`;
  const caption = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="self-start min-h-[44px] -ml-2 gap-1"
        >
          <Link href="/fleet">
            <ArrowLeft size={16} aria-hidden="true" />
            Fleet
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
          <Link href={`/fleet/${vehicleId}/edit`}>Edit vehicle</Link>
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Icon size={40} aria-hidden="true" className="text-muted-foreground shrink-0" />
        <div>
          <h1 className="font-heading font-bold text-2xl leading-tight">{displayName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{caption}</p>
        </div>
      </div>
    </div>
  );
}

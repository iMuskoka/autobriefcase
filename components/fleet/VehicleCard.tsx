import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Vehicle, VehicleCategory } from "@/types";
import {
  VEHICLE_CATEGORY_ICONS,
  VEHICLE_CATEGORY_FALLBACK_ICON,
} from "@/lib/vehicle-categories";
import { VehicleCardMenu } from "./VehicleCardMenu";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const Icon =
    VEHICLE_CATEGORY_ICONS[vehicle.category as VehicleCategory] ??
    VEHICLE_CATEGORY_FALLBACK_ICON;
  const displayName = vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`;
  const caption = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <Card
      role="article"
      aria-label={`${displayName} — no documents`}
      className="relative"
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 pt-1">
            <Icon size={24} aria-hidden="true" className="text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">—</Badge>
          </div>
          <div className="relative z-10">
            <VehicleCardMenu vehicleId={vehicle.id} vehicleName={displayName} />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-base leading-tight">
            <Link
              href={`/fleet/${vehicle.id}`}
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            >
              {displayName}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ObligationRow } from "@/components/obligations/ObligationRow";
import type { Vehicle, VehicleCategory, VehicleHealthState } from "@/types";
import type { ObligationItem } from "@/lib/obligations";
import {
  VEHICLE_CATEGORY_ICONS,
  VEHICLE_CATEGORY_FALLBACK_ICON,
} from "@/lib/vehicle-categories";
import { VehicleCardMenu } from "./VehicleCardMenu";

const HEALTH_LABELS: Record<VehicleHealthState, string> = {
  "no-docs":   "no documents",
  "healthy":   "covered",
  "attention": "due soon",
  "critical":  "due now",
};

interface VehicleCardProps {
  vehicle: Vehicle;
  healthState?: VehicleHealthState;
  obligations?: ObligationItem[];
}

export function VehicleCard({
  vehicle,
  healthState = "no-docs",
  obligations = [],
}: VehicleCardProps) {
  const Icon =
    VEHICLE_CATEGORY_ICONS[vehicle.category as VehicleCategory] ??
    VEHICLE_CATEGORY_FALLBACK_ICON;
  const displayName = vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`;
  const caption = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const healthLabel = HEALTH_LABELS[healthState];

  function renderHealthBadge() {
    if (healthState === "no-docs") {
      return <Badge variant="secondary" className="text-xs">—</Badge>;
    }
    if (healthState === "healthy") {
      return (
        <Badge className="text-xs gap-1 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
          <CheckCircle size={12} aria-hidden="true" />
          Covered
        </Badge>
      );
    }
    if (healthState === "attention") {
      return (
        <Badge className="text-xs gap-1 bg-warning/15 text-warning border-warning/30 hover:bg-warning/15">
          <AlertCircle size={12} aria-hidden="true" />
          Due soon
        </Badge>
      );
    }
    // critical
    return (
      <Badge className="text-xs gap-1 bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15">
        <AlertTriangle size={12} aria-hidden="true" />
        Due now
      </Badge>
    );
  }

  return (
    <Card
      role="article"
      aria-label={`${displayName} — ${healthLabel}`}
      className="relative"
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 pt-1">
            <Icon size={24} aria-hidden="true" className="text-muted-foreground" />
            {renderHealthBadge()}
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
        {obligations.length > 0 && (
          <div className="flex flex-col gap-2">
            {obligations.slice(0, 3).map(o => (
              <ObligationRow key={o.reminderId} obligation={o} variant="card" />
            ))}
            {obligations.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{obligations.length - 3} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

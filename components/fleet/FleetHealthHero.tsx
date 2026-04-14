import Link from "next/link";
import {
  FolderOpen,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FleetHealthHeroProps =
  | { state: "empty" }
  | { state: "covered"; vehicleCount: number }
  | { state: "attention"; vehicleCount: number; nextRenewalDays?: number }
  | { state: "critical"; vehicleCount: number; nextRenewalDays?: number };

export function FleetHealthHero(props: FleetHealthHeroProps) {
  const { state } = props;
  const vehicleCount = "vehicleCount" in props ? props.vehicleCount : 0;
  const nextRenewalDays =
    "nextRenewalDays" in props ? props.nextRenewalDays : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "w-full rounded-xl border p-8 flex flex-col items-center text-center gap-4",
        state === "covered" && "bg-primary/10 border-primary/30",
        state === "attention" && "bg-warning/10 border-warning/30",
        state === "critical" && "bg-destructive/10 border-destructive/30",
        state === "empty" && "bg-muted border-border",
      )}
    >
      {state === "empty" && (
        <>
          <FolderOpen
            size={48}
            className="text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">
              Your vault is empty
            </h1>
            <p className="text-muted-foreground mt-1">
              Add your first vehicle to get started
            </p>
          </div>
          <Button asChild className="min-h-[44px]">
            <Link href="/fleet/new">Add your first vehicle</Link>
          </Button>
        </>
      )}

      {state === "covered" && (
        <>
          <CheckCircle
            size={48}
            className="text-primary"
            aria-hidden="true"
          />
          <div>
            <h1 className="font-heading font-bold text-2xl text-primary">
              Fleet is covered
            </h1>
            <p className="text-muted-foreground mt-1">
              {vehicleCount} {vehicleCount === 1 ? "vehicle" : "vehicles"} —
              all obligations current
            </p>
          </div>
        </>
      )}

      {state === "attention" && (
        <>
          <AlertCircle
            size={48}
            className="text-warning"
            aria-hidden="true"
          />
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">
              {vehicleCount} {vehicleCount === 1 ? "renewal" : "renewals"}{" "}
              coming up
            </h1>
            {nextRenewalDays !== undefined && (
              <p className="text-muted-foreground mt-1">
                {nextRenewalDays <= 0
                  ? "Overdue"
                  : `Next renewal in ${nextRenewalDays} days`}
              </p>
            )}
          </div>
        </>
      )}

      {state === "critical" && (
        <>
          <AlertTriangle
            size={48}
            className="text-destructive"
            aria-hidden="true"
          />
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">
              {vehicleCount} {vehicleCount === 1 ? "renewal" : "renewals"}{" "}
              need action
            </h1>
            {nextRenewalDays !== undefined && (
              <p className="text-muted-foreground mt-1">
                {nextRenewalDays <= 0
                  ? "Overdue — act now"
                  : `${nextRenewalDays} days remaining — act now`}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

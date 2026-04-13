import { VehicleCardSkeleton } from "@/components/fleet/VehicleCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FleetLoading() {
  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      {/* Screen reader announcement — skeletons are aria-hidden */}
      <p role="status" aria-live="polite" className="sr-only">
        Loading fleet…
      </p>
      {/* Hero placeholder */}
      <Skeleton className="w-full rounded-xl h-40" aria-hidden="true" />
      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
      </div>
    </div>
  );
}

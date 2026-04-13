import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function VehicleCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-5 w-6 rounded" />
          </div>
          <Skeleton className="h-11 w-11 rounded" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VehicleNotFound() {
  return (
    <div className="p-6 lg:p-8 flex flex-col items-center gap-4 text-center">
      <h1 className="font-heading font-bold text-2xl">Vehicle not found</h1>
      <p className="text-muted-foreground">
        This vehicle doesn't exist or you don't have access to it.
      </p>
      <Button asChild className="min-h-[44px]">
        <Link href="/fleet">Back to fleet</Link>
      </Button>
    </div>
  );
}

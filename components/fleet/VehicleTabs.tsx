"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function VehicleTabs({
  vehicleId,
  notes,
}: {
  vehicleId: string;
  notes: string | null;
}) {
  return (
    <Tabs defaultValue="documents">
      <TabsList className="w-full sm:w-auto overflow-x-auto">
        <TabsTrigger value="documents" className="flex-1 sm:flex-none min-h-[44px]">
          Documents
        </TabsTrigger>
        <TabsTrigger value="obligations" className="flex-1 sm:flex-none min-h-[44px]">
          Obligations
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex-1 sm:flex-none min-h-[44px]">
          Notes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="documents" className="mt-6">
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <FileText size={40} className="text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium">No documents yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload an insurance card, registration, or permit to get started.
            </p>
          </div>
          <Button asChild className="min-h-[44px]">
            <Link href={`/fleet/${vehicleId}/documents/new`}>Upload document</Link>
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="obligations" className="mt-6">
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="font-medium text-muted-foreground">No obligations yet</p>
          <p className="text-sm text-muted-foreground">
            Obligations appear automatically once documents with expiry dates are uploaded.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="notes" className="mt-6">
        {notes ? (
          <p className="text-sm text-foreground whitespace-pre-wrap">{notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No notes added.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}

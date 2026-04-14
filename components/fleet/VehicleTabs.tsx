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
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/lib/validations/document";
import { ObligationRow } from "@/components/obligations/ObligationRow";
import type { Document } from "@/types";
import type { ObligationItem } from "@/lib/obligations";

export function VehicleTabs({
  vehicleId,
  notes,
  documents,
  obligations = [],
}: {
  vehicleId: string;
  notes: string | null;
  documents: Document[];
  obligations?: ObligationItem[];
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
        {documents.length === 0 ? (
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
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/fleet/${vehicleId}/documents/${doc.id}`}
                  className="flex items-center justify-between py-3 px-1 hover:bg-accent rounded-md min-h-[44px]"
                >
                  <span className="font-medium text-sm">
                    {DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType] ?? doc.document_type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString("en-CA")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="obligations" className="mt-6">
        {obligations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium text-muted-foreground">No obligations yet</p>
            <p className="text-sm text-muted-foreground">
              Obligations appear automatically once documents with expiry dates are uploaded.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {obligations.map(o => (
              <ObligationRow key={o.reminderId} obligation={o} variant="full" />
            ))}
          </ul>
        )}
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

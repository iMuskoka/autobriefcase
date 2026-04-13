import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createDownloadUrl } from "@/lib/storage/signed-urls";
import { Button } from "@/components/ui/button";
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/lib/validations/document";
import type { Vehicle } from "@/types";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string; documentId: string }>;
}) {
  const { vehicleId, documentId } = await params;

  const supabase = await createClient();
  const [{ data: document }, { data: vehicle }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("vehicle_id", vehicleId)
      .single(),
    supabase
      .from("vehicles")
      .select("id, make, model, nickname")
      .eq("id", vehicleId)
      .single(),
  ]);

  if (!document || !vehicle) notFound();

  let signedUrl: string;
  let downloadUrl: string;
  try {
    [signedUrl, downloadUrl] = await Promise.all([
      createDownloadUrl(supabase, document.storage_path),
      createDownloadUrl(supabase, document.storage_path, 900, document.file_name),
    ]);
  } catch {
    return notFound();
  }

  const vehicleName =
    (vehicle as Vehicle).nickname ?? `${(vehicle as Vehicle).make} ${(vehicle as Vehicle).model}`;
  const typeLabel =
    DOCUMENT_TYPE_LABELS[document.document_type as DocumentType] ?? document.document_type;
  const isImage = /\.(jpg|jpeg|png)$/i.test(document.file_name);

  return (
    <div className="flex flex-col gap-4 p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href={`/fleet/${vehicleId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {vehicleName}
        </Link>
        <h1 className="font-heading font-bold text-2xl mt-1">{typeLabel}</h1>
        <p className="text-sm text-muted-foreground">
          {document.file_name} ·{" "}
          {new Date(document.created_at).toLocaleDateString("en-CA")}
        </p>
      </div>

      {/* Download button */}
      <div>
        <Button asChild className="min-h-[44px]">
          <a href={downloadUrl} download={document.file_name}>
            Download
          </a>
        </Button>
      </div>

      {/* Inline viewer */}
      {isImage ? (
        <img
          src={signedUrl}
          alt={`${typeLabel} document`}
          className="w-full max-h-screen object-contain rounded-lg border border-border"
        />
      ) : (
        <iframe
          src={signedUrl}
          title={typeLabel}
          className="w-full rounded-lg border border-border"
          style={{ height: "80vh" }}
        />
      )}
    </div>
  );
}

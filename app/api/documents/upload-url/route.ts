import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUploadUrl } from "@/lib/storage/signed-urls";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vehicleId   = searchParams.get("vehicleId");
  const fileName    = searchParams.get("fileName");
  const contentType = searchParams.get("contentType");

  if (!vehicleId || !fileName || !contentType) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { signedUrl, path } = await createUploadUrl(
      supabase,
      user.id,
      vehicleId,
      fileName,
    );
    return NextResponse.json({ signedUrl, path });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}

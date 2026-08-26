import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";
import {
  getSupabaseAdminClient,
  getSupabaseStorageBucket,
  isSupabaseConfigured,
} from "@/app/lib/supabase-admin";

export const runtime = "nodejs";

const allowedScopes = new Set(["events", "team", "gallery", "alumni", "partners", "learning"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured for uploads." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const scope = String(formData.get("scope") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (!allowedScopes.has(scope)) {
    return NextResponse.json({ error: "Invalid upload scope." }, { status: 400 });
  }

  const extension = ALLOWED_IMAGE_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)." }, { status: 400 });
  }

  const storagePath = `uploads/${scope}/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdminClient();
  const bucket = getSupabaseStorageBucket();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .upsert(
      {
        bucket_id: bucket,
        storage_path: storagePath,
        public_url: data.publicUrl,
        scope,
        content_type: file.type,
        byte_size: file.size,
      },
      { onConflict: "bucket_id,storage_path" }
    )
    .select("id")
    .single<{ id: string }>();

  if (assetError?.code === "PGRST205") {
    // Keep CMS uploads working during a rolling deployment where the app is
    // live before the additive media registry migration has been applied.
    return NextResponse.json({ url: data.publicUrl, assetId: null, mediaRegistryPending: true });
  }

  if (assetError || !asset) {
    await supabase.storage.from(bucket).remove([storagePath]);
    return NextResponse.json(
      { error: "Image uploaded, but its media record could not be saved. The upload was rolled back." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data.publicUrl, assetId: asset.id });
}

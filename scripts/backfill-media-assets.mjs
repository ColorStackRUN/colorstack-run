import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "site-media";

if (!url || !key) {
  throw new Error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const scopeByFolder = new Map([
  ["events", "events"], ["team", "team"], ["gallery", "gallery"], ["alumni", "alumni"],
  ["partners", "partners"], ["companies", "partners"], ["learning", "learning"],
]);

const { error: registryError } = await supabase.from("media_assets").select("id").limit(1);
if (registryError) {
  if (registryError.code === "PGRST205") {
    throw new Error("media_assets is not available through the Supabase Data API. Apply migration 20260826230536_add_growth_content_tables.sql to this project, then retry.");
  }
  throw new Error(`Could not verify media_assets: ${registryError.message}`);
}

async function listFiles(prefix = "") {
  const files = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`Could not list ${prefix || "the bucket"}: ${error.message}`);
    if (!data?.length) break;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) files.push(...await listFiles(path));
      else files.push({ path, metadata: entry.metadata ?? {} });
    }
    if (data.length < 1000) break;
    offset += data.length;
  }
  return files;
}

const files = await listFiles();
const rows = files.flatMap(({ path, metadata }) => {
  const [, folder] = path.split("/");
  const scope = scopeByFolder.get(folder?.toLowerCase());
  if (!scope) return [];
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return [{
    bucket_id: bucket,
    storage_path: path,
    public_url: data.publicUrl,
    scope,
    content_type: typeof metadata.mimetype === "string" ? metadata.mimetype : "application/octet-stream",
    byte_size: typeof metadata.size === "number" ? metadata.size : 0,
  }];
});

if (rows.length) {
  const { error } = await supabase.from("media_assets").upsert(rows, { onConflict: "bucket_id,storage_path" });
  if (error) throw new Error(`Could not register media assets: ${error.message}`);
}

console.log(`Registered ${rows.length} media asset${rows.length === 1 ? "" : "s"}; skipped ${files.length - rows.length} unsupported object${files.length - rows.length === 1 ? "" : "s"}.`);

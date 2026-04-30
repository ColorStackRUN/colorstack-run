import { promises as fs } from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "site-media";
const CONTENT_FILE_PATH = path.join(process.cwd(), "data", "site-content.json");
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function mimeTypeForFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

async function listFilesRecursively(rootDir) {
  let files = [];
  let entries = [];
  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await listFilesRecursively(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

function replaceUploadUrls(input, map) {
  if (typeof input === "string") {
    return map.get(input) ?? input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => replaceUploadUrls(item, map));
  }
  if (input && typeof input === "object") {
    const output = {};
    for (const [key, value] of Object.entries(input)) {
      output[key] = replaceUploadUrls(value, map);
    }
    return output;
  }
  return input;
}

async function ensureBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Failed to list buckets: ${listError.message}`);

  const exists = buckets.some((bucket) => bucket.name === SUPABASE_STORAGE_BUCKET);
  if (exists) return;

  const { error: createError } = await supabase.storage.createBucket(SUPABASE_STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  if (createError) throw new Error(`Failed to create bucket: ${createError.message}`);
}

async function uploadLocalImages() {
  const files = await listFilesRecursively(UPLOADS_ROOT);
  const uploadMap = new Map();
  let uploadedCount = 0;

  for (const absolutePath of files) {
    const relFromUploads = toPosixPath(path.relative(UPLOADS_ROOT, absolutePath));
    const storagePath = `uploads/${relFromUploads}`;
    const legacyPath = `/uploads/${relFromUploads}`;
    const bytes = await fs.readFile(absolutePath);

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(storagePath, bytes, {
        contentType: mimeTypeForFile(absolutePath),
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed for ${legacyPath}: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(storagePath);
    uploadMap.set(legacyPath, data.publicUrl);
    uploadedCount += 1;
  }

  return { uploadMap, uploadedCount };
}

async function upsertContent(content) {
  const { error } = await supabase.from("site_content_store").upsert(
    {
      id: "primary",
      content_json: content,
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(`Failed to upsert content: ${error.message}`);
}

async function main() {
  await ensureBucket();

  const raw = await fs.readFile(CONTENT_FILE_PATH, "utf8");
  const content = JSON.parse(raw);

  const { uploadMap, uploadedCount } = await uploadLocalImages();
  const migratedContent = replaceUploadUrls(content, uploadMap);
  await upsertContent(migratedContent);

  console.log(`Uploaded ${uploadedCount} local files to bucket "${SUPABASE_STORAGE_BUCKET}".`);
  console.log("Seeded content into public.site_content_store (id=primary).");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});


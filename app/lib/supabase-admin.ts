import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_STORAGE_BUCKET = "site-media";

let cachedClient: SupabaseClient | null = null;

function getRequiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value =
    name === "SUPABASE_URL"
      ? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function isSupabaseConfigured(): boolean {
  if (process.env.DISABLE_SUPABASE === "true") return false;
  return Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getSupabaseStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET ?? DEFAULT_STORAGE_BUCKET;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = getRequiredEnv("SUPABASE_URL");
  const key = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

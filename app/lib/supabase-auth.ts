import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "./supabase-admin";

export type AuthenticatedAdmin = {
  userId: string;
  email: string;
  /** Google profile name, used only for display—not authorization. */
  googleProfileName: string | null;
  displayName: string;
};

function getGoogleProfileName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  const candidate = record.full_name ?? record.name;
  if (typeof candidate !== "string") return null;
  const name = candidate.trim();
  return name && name.length <= 120 ? name : null;
}

function getSupabaseAuthConfig(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function isSupabaseAuthConfigured(): boolean {
  return getSupabaseAuthConfig() !== null;
}

export async function createSupabaseServerAuthClient() {
  const config = getSupabaseAuthConfig();
  if (!config) {
    throw new Error("Supabase Auth is not configured.");
  }
  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes sessions for page requests.
        }
      },
    },
  });
}

export async function isAllowedAdminEmail(email: string): Promise<{ displayName: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;
  const { data, error } = await getSupabaseAdminClient()
    .from("admin_access")
    .select("display_name")
    .eq("email", normalizedEmail)
    .eq("is_active", true)
    .maybeSingle<{ display_name: string }>();
  if (error || !data) return null;
  return { displayName: data.display_name.trim() || normalizedEmail };
}

export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  if (!isSupabaseAuthConfigured()) return null;

  const supabase = await createSupabaseServerAuthClient();
  // getUser validates the bearer token with Supabase Auth; never authorize from client-editable metadata.
  const { data, error } = await supabase.auth.getUser();
  const email = data.user?.email?.trim().toLowerCase();
  if (error || !data.user || !email) return null;

  const access = await isAllowedAdminEmail(email);
  if (!access) return null;

  return {
    userId: data.user.id,
    email,
    googleProfileName: getGoogleProfileName(data.user.user_metadata),
    displayName: access.displayName,
  };
}

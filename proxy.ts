import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const MAINTENANCE_BYPASS_PREFIXES = [
  "/admin",
  "/api/admin",
  "/maintenance",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

function copyAuthCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (supabaseUrl && publishableKey) {
    const supabase = createServerClient(supabaseUrl, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    // Refresh an existing session before Server Components and API handlers read it.
    await supabase.auth.getUser();
  }

  if (!isMaintenanceMode()) return response;

  const { pathname } = request.nextUrl;

  if (MAINTENANCE_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return response;
  }

  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return response;
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = "/maintenance";
  return copyAuthCookies(response, NextResponse.rewrite(rewriteUrl, { status: 503 }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

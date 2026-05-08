import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
  if (!isMaintenanceMode()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (MAINTENANCE_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.rewrite(url, { status: 503 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

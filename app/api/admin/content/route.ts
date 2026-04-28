import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";
import { readSiteContent, writeSiteContent } from "@/app/lib/content-store";
import { type SiteContent } from "@/app/lib/content-types";

export const runtime = "nodejs";

export async function GET() {
  const content = await readSiteContent();
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nextContent = (await request.json()) as SiteContent;
  await writeSiteContent(nextContent);
  return NextResponse.json({ success: true });
}

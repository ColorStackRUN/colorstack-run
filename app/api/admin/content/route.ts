import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";
import { readSiteContent, writeSiteContent } from "@/app/lib/content-store";
import { type SiteContent } from "@/app/lib/content-types";
import { normalizeLearningResources, normalizeOpportunities } from "@/app/lib/hub-content";

export const runtime = "nodejs";

export async function GET() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const content = await readSiteContent();
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as SiteContent;
  const nextContent = { ...input, learningResources: normalizeLearningResources(input.learningResources), opportunities: normalizeOpportunities(input.opportunities) };
  if ((input.learningResources?.length ?? 0) !== nextContent.learningResources.length || (input.opportunities?.length ?? 0) !== nextContent.opportunities.length) {
    return NextResponse.json({ error: "One or more Learning Hub or Opportunity records are invalid. Check required fields, dates, URLs, and unique session slugs." }, { status: 400 });
  }
  await writeSiteContent(nextContent);
  return NextResponse.json({ success: true });
}

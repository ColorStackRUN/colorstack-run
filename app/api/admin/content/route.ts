import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";
import { readSiteContent, writeSiteContent } from "@/app/lib/content-store";
import { type SiteContent } from "@/app/lib/content-types";
import { normalizeLearningResources, normalizeOpportunities } from "@/app/lib/hub-content";
import {
  isLocalPublishingDisabled,
  LOCAL_PUBLISHING_DISABLED_MESSAGE,
} from "@/app/lib/local-publishing-guard";

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
  if (isLocalPublishingDisabled(request.headers.get("host"))) {
    return NextResponse.json({ error: LOCAL_PUBLISHING_DISABLED_MESSAGE }, { status: 403 });
  }

  const body = (await request.json()) as { content?: SiteContent; expectedRevision?: unknown };
  const input = body.content;
  const expectedRevision = body.expectedRevision;
  if (!input || typeof expectedRevision !== "number" || !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
    return NextResponse.json({ error: "Invalid publish request. Reload the admin console and try again." }, { status: 400 });
  }
  const nextContent = { ...input, learningResources: normalizeLearningResources(input.learningResources), opportunities: normalizeOpportunities(input.opportunities) };
  if ((input.learningResources?.length ?? 0) !== nextContent.learningResources.length || (input.opportunities?.length ?? 0) !== nextContent.opportunities.length) {
    return NextResponse.json({ error: "One or more Learning Hub or Opportunity records are invalid. Check required fields, dates, URLs, and unique session slugs." }, { status: 400 });
  }
  const result = await writeSiteContent(nextContent, expectedRevision);
  if (result.status === "conflict") {
    return NextResponse.json(
      { error: "Someone else published changes while you were editing. Your changes were not saved." },
      { status: 409 }
    );
  }
  return NextResponse.json({ success: true, revision: result.revision });
}

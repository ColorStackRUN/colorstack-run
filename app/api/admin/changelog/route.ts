import { NextResponse } from "next/server";
import { appendAdminChangelogEntry, readAdminChangelog } from "@/app/lib/admin-changelog-store";
import { getAuthenticatedAdmin } from "@/app/lib/supabase-auth";
import {
  isLocalPublishingDisabled,
  LOCAL_PUBLISHING_DISABLED_MESSAGE,
} from "@/app/lib/local-publishing-guard";

export const runtime = "nodejs";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const entries = await readAdminChangelog();
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isLocalPublishingDisabled()) {
    return NextResponse.json({ error: LOCAL_PUBLISHING_DISABLED_MESSAGE }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message =
    typeof body === "object" && body !== null && "message" in body ? String((body as { message: unknown }).message) : "";
  try {
    const entry = await appendAdminChangelogEntry({
      message,
      // Google profile metadata is display-only. The verified email below remains
      // the server-side authorization and audit identity.
      authorName: admin.googleProfileName ?? admin.displayName,
      authorEmail: admin.email,
      authorUserId: admin.userId,
    });
    return NextResponse.json({ entry });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save entry.";
    const is400 =
      msg === "Message is required." ||
      msg.startsWith("Message must be at most") ||
      msg.startsWith("Name must be at most");
    const status = is400 ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

import { NextResponse } from "next/server";
import { appendAdminChangelogEntry, readAdminChangelog } from "@/app/lib/admin-changelog-store";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const entries = await readAdminChangelog();
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message =
    typeof body === "object" && body !== null && "message" in body ? String((body as { message: unknown }).message) : "";
  const authorName =
    typeof body === "object" && body !== null && "authorName" in body
      ? String((body as { authorName: unknown }).authorName)
      : "";

  try {
    const entry = await appendAdminChangelogEntry({ message, authorName });
    return NextResponse.json({ entry });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save entry.";
    const is400 =
      msg === "Message is required." ||
      msg === "Name is required." ||
      msg.startsWith("Message must be at most") ||
      msg.startsWith("Name must be at most");
    const status = is400 ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

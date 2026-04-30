import { NextResponse } from "next/server";
import { isValidAdminPassword, setAdminSessionCookie } from "@/app/lib/admin-auth";

type AttemptRecord = {
  count: number;
  windowStartedAt: number;
  blockedUntil: number;
};

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 8;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, AttemptRecord>();

function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function getAttemptRecord(ip: string, now: number): AttemptRecord {
  const existing = loginAttempts.get(ip);
  if (!existing) {
    const fresh = { count: 0, windowStartedAt: now, blockedUntil: 0 };
    loginAttempts.set(ip, fresh);
    return fresh;
  }
  if (now - existing.windowStartedAt > LOGIN_WINDOW_MS) {
    existing.count = 0;
    existing.windowStartedAt = now;
    existing.blockedUntil = 0;
  }
  return existing;
}

export async function POST(request: Request) {
  const now = Date.now();
  const ip = resolveClientIp(request);
  const attempt = getAttemptRecord(ip, now);
  if (attempt.blockedUntil > now) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: { password?: string } = {};
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!process.env.ADMIN_DASHBOARD_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_DASHBOARD_PASSWORD is not configured." },
      { status: 500 }
    );
  }

  if (!body.password || !isValidAdminPassword(body.password)) {
    attempt.count += 1;
    if (attempt.count >= MAX_ATTEMPTS_PER_WINDOW) {
      attempt.blockedUntil = now + BLOCK_DURATION_MS;
    }
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  loginAttempts.delete(ip);
  await setAdminSessionCookie();
  return NextResponse.json({ success: true });
}

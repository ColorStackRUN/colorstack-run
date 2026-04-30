import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_COOKIE_NAME = "colorstack_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;
const ADMIN_SESSION_VERSION = 1;

type AdminSessionPayload = {
  v: number;
  iat: number;
  exp: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function resolveSessionSecret(): string | null {
  const explicitSecret = process.env.ADMIN_SESSION_SECRET;
  if (explicitSecret && explicitSecret.length >= 32) {
    return explicitSecret;
  }
  const password = process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!password) return null;
  // Backward-compatible fallback so existing env setups keep working.
  return password;
}

function signSessionPayload(payloadEncoded: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadEncoded).digest("base64url");
}

function createSessionToken(nowSeconds: number, secret: string): string {
  const payload: AdminSessionPayload = {
    v: ADMIN_SESSION_VERSION,
    iat: nowSeconds,
    exp: nowSeconds + ADMIN_SESSION_TTL_SECONDS,
  };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = signSessionPayload(payloadEncoded, secret);
  return `${payloadEncoded}.${signature}`;
}

function safeTokenEquals(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function isValidSessionToken(token: string, nowSeconds: number, secret: string): boolean {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return false;
  const expectedSignature = signSessionPayload(payloadEncoded, secret);
  if (!safeTokenEquals(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as AdminSessionPayload;
    if (payload.v !== ADMIN_SESSION_VERSION) return false;
    if (!Number.isFinite(payload.exp)) return false;
    return nowSeconds < payload.exp;
  } catch {
    return false;
  }
}

export function isValidAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!expected) return false;
  return safeTokenEquals(candidate, expected);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const secret = resolveSessionSecret();
  if (!sessionValue || !secret) return false;
  return isValidSessionToken(sessionValue, Math.floor(Date.now() / 1000), secret);
}

export async function setAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const secret = resolveSessionSecret();
  if (!secret) return;
  const token = createSessionToken(Math.floor(Date.now() / 1000), secret);
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

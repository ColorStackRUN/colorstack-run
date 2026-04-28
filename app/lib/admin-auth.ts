import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "colorstack_admin_session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!expected) return false;
  return sessionValue === expected;
}

export async function setAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!expected) return;
  cookieStore.set(ADMIN_COOKIE_NAME, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

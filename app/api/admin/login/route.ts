import { NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/app/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_DASHBOARD_PASSWORD is not configured." },
      { status: 500 }
    );
  }

  if (!body.password || body.password !== expected) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  await setAdminSessionCookie();
  return NextResponse.json({ success: true });
}

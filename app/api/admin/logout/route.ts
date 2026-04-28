import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/app/lib/admin-auth";

export async function POST() {
  await clearAdminSessionCookie();
  return NextResponse.json({ success: true });
}

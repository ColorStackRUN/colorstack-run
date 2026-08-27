import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Password login has been replaced by Google sign-in." },
    { status: 410 }
  );
}

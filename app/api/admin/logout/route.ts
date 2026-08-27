import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient, isSupabaseAuthConfigured } from "@/app/lib/supabase-auth";

export async function POST() {
  if (isSupabaseAuthConfigured()) {
    const supabase = await createSupabaseServerAuthClient();
    await supabase.auth.signOut();
  }
  return NextResponse.json({ success: true });
}

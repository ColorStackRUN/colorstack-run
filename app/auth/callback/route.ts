import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient, isAllowedAdminEmail } from "@/app/lib/supabase-auth";

function safeNextPath(next: string | null): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const loginUrl = new URL("/admin/login", url.origin);

  if (!code) {
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerAuthClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    loginUrl.searchParams.set("error", "sign_in_failed");
    return NextResponse.redirect(loginUrl);
  }

  const { data, error: userError } = await supabase.auth.getUser();
  const email = data.user?.email?.trim().toLowerCase();
  const allowed = email ? await isAllowedAdminEmail(email) : null;
  if (userError || !data.user || !allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/access-denied", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

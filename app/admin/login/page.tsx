"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";

function loginErrorFromUrl(): string {
  if (typeof window === "undefined") return "";
  const reason = new URLSearchParams(window.location.search).get("error");
  if (reason === "not_authorized") return "This Google account is not on the current board access list.";
  if (reason === "sign_in_failed") return "Google sign-in could not be completed. Please try again.";
  if (reason === "missing_code") return "Google did not return a sign-in code. Please try again.";
  return "";
}

export default function AdminLoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(loginErrorFromUrl);

  const onSignIn = async () => {
    setSubmitting(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (signInError) setError(signInError.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start Google sign-in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-5">
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600">Sign in with the Google account assigned to a current board member.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={onSignIn}
            disabled={submitting}
            className="w-full rounded-lg bg-red-600 text-white py-2.5 hover:bg-red-700 transition-colors disabled:opacity-70"
          >
            {submitting ? "Redirecting..." : "Continue with Google"}
          </button>
          <p className="text-xs leading-relaxed text-gray-500">
            Access is limited to the chapter&apos;s approved board email addresses.
          </p>
        </section>
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 transition-colors"
        >
          Go to site
        </Link>
      </div>
    </main>
  );
}

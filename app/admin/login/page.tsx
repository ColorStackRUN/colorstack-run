"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Invalid password.");
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-3">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-5"
        >
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600">Enter the admin password to edit website content.</p>
          <label className="block text-sm text-gray-700 space-y-1">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-red-600 text-white py-2.5 hover:bg-red-700 transition-colors disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
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

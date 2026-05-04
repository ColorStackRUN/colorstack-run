"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminChangelogEntry } from "@/app/lib/admin-changelog-types";

const buttonClass =
  "px-4 py-2 rounded-xl border border-black/80 bg-black text-white hover:bg-neutral-900 transition-all shadow-sm hover:shadow-md active:scale-[0.99]";

/** Same on Node and browsers — used for the first paint so SSR + hydration match. */
function formatUtcDeterministic(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day} ${h}:${mi} UTC`;
}

const CHANGELOG_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

function formatWhenEastern(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return CHANGELOG_DATE_FORMAT.format(d);
  } catch {
    return iso;
  }
}

function ChangelogEntryTimestamp({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => formatUtcDeterministic(iso));
  useEffect(() => {
    setLabel(formatWhenEastern(iso));
  }, [iso]);
  return (
    <time dateTime={iso} className="tabular-nums">
      {label}
    </time>
  );
}

type Props = {
  entries: AdminChangelogEntry[];
};

export function AdminChangelogClient({ entries }: Props) {
  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#fff7f2] via-[#fffdfb] to-[#f7faff] px-6 py-8 md:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-red-300/30 blur-3xl" />
        <div className="absolute top-28 right-[-90px] h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto space-y-8 relative">
        <header className="rounded-3xl border border-white/80 bg-gradient-to-r from-white via-white to-red-100/45 backdrop-blur p-6 md:p-7 shadow-[0_20px_50px_rgba(185,28,28,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex text-xs uppercase tracking-[0.14em] font-semibold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-full mb-3">
                Admin
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Change log</h1>
              <p className="text-slate-600 mt-1">
                A read-only record of site publishes. New entries are created when someone uses{" "}
                <strong className="font-semibold text-slate-800">Save &amp; publish</strong> in the main CMS (newest
                first).
              </p>
              <p className="mt-3">
                <Link
                  href="/admin"
                  className="text-sm font-medium text-red-700 hover:text-red-800 hover:underline underline-offset-2"
                >
                  ← Back to CMS
                </Link>
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button type="button" className={buttonClass} onClick={onLogout}>
                Log out
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/80 bg-gradient-to-b from-white to-[#fff7f5] backdrop-blur p-6 md:p-7 shadow-[0_14px_36px_rgba(15,23,42,0.08)] space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">History</h2>
          {entries.length === 0 ? (
            <p className="text-slate-600 text-sm">
              No entries yet. They will appear here after the first successful <strong className="font-semibold text-slate-800">Save &amp; publish</strong> from the CMS.
            </p>
          ) : (
            <ul className="space-y-4 divide-y divide-slate-100">
              {entries.map((entry) => (
                <li key={entry.id} className="pt-4 first:pt-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    {entry.authorName ? `${entry.authorName} · ` : ""}
                    <ChangelogEntryTimestamp iso={entry.createdAt} />
                  </p>
                  <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">{entry.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

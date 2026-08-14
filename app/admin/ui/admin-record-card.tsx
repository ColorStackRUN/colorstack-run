"use client";
import { useId, useState, type ReactNode } from "react";

export function AdminRecordCard({ title, meta, badge, children, onRemove }: { title: string; meta: string; badge?: string; children: ReactNode; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const panelId = useId();
  return <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
    <div className="flex items-center gap-3 px-4 py-3">
      <button type="button" className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={panelId}>
        <span className="block truncate font-semibold text-zinc-900">{title}</span>
        <span className="mt-0.5 block truncate font-mono text-xs text-zinc-500">{meta}</span>
      </button>
      {badge && <span className="hidden rounded-full bg-rose-50 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-rose-700 sm:inline">{badge}</span>}
      <button type="button" className="rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-red-600" onClick={() => setOpen(!open)} aria-label={`${open ? "Collapse" : "Edit"} ${title}`} aria-expanded={open} aria-controls={panelId}>{open ? "Close" : "Edit"}</button>
      {confirming ? <div className="flex items-center gap-1"><button type="button" className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white" onClick={onRemove}>Remove</button><button type="button" className="rounded-md px-2 py-1 text-xs text-zinc-600" onClick={() => setConfirming(false)}>Keep</button></div> : <button type="button" className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600" onClick={() => setConfirming(true)} aria-label={`Remove ${title}`}>⌫</button>}
    </div>
    <div id={panelId} hidden={!open} className="border-t border-zinc-200 bg-zinc-50/70 p-4">{children}</div>
  </article>;
}

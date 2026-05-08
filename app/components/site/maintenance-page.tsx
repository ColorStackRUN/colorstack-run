"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const BOOT_LOG_LINES: { ts: string; level: "info" | "warn" | "ok"; text: string }[] = [
  { ts: "00:00.014", level: "info", text: "starting deploy ──> colorstack-run.site (planned)" },
  { ts: "00:00.041", level: "ok",   text: "team approved release ............................. ok" },
  { ts: "00:00.067", level: "info", text: "fetching new content from chapter board ........... ok" },
  { ts: "00:00.103", level: "info", text: "rolling out fresh events, team, and alumni cards" },
  { ts: "00:00.158", level: "info", text: "compiling new ui ──> tuning animations & polish" },
  { ts: "00:00.214", level: "info", text: "warming caches before sending you back" },
  { ts: "00:00.302", level: "ok",   text: "all systems healthy · this is a scheduled upgrade" },
  { ts: "00:00.388", level: "info", text: "thanks for your patience — almost ready" },
  { ts: "00:00.452", level: "ok",   text: "deploy in progress · we'll be live again shortly" },
];

const STATUS_LINES = [
  "Shipping fresh updates to the site",
  "Polishing the new events page",
  "Refreshing the team and alumni cards",
  "Tuning hero animations",
  "Adding the latest chapter wins",
  "Making things just a little better",
];

type ServiceState = "online" | "syncing" | "building";

const SERVICES: { id: string; label: string; initial: ServiceState }[] = [
  { id: "edge",      label: "Edge / Proxy",       initial: "online"   },
  { id: "content",   label: "Content Store",      initial: "syncing"  },
  { id: "supabase",  label: "Supabase Storage",   initial: "online"   },
  { id: "admin",     label: "Admin Dashboard",    initial: "online"   },
  { id: "render",    label: "Render Pipeline",    initial: "building" },
];

const HEX_CHARS = "0123456789abcdef";
function buildHash(seed: number, length = 7): string {
  let h = seed;
  let out = "";
  for (let i = 0; i < length; i += 1) {
    h = (h * 9301 + 49297) % 233280;
    out += HEX_CHARS[Math.floor((h / 233280) * HEX_CHARS.length)];
  }
  return out;
}

function useTypewriterLog(lines: typeof BOOT_LOG_LINES) {
  const [count, setCount] = useState(0);
  const [partial, setPartial] = useState("");

  useEffect(() => {
    if (count >= lines.length) return;
    const target = lines[count].text;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setPartial(target.slice(0, i));
      if (i >= target.length) {
        window.clearInterval(id);
        window.setTimeout(() => {
          setCount((c) => c + 1);
          setPartial("");
        }, 90);
      }
    }, 14);
    return () => window.clearInterval(id);
  }, [count, lines]);

  return { count, partial };
}

function useRotatingStatus(messages: string[], intervalMs = 2600) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const target = messages[index];
    if (!erasing) {
      if (typed.length < target.length) {
        const id = window.setTimeout(() => setTyped(target.slice(0, typed.length + 1)), 38);
        return () => window.clearTimeout(id);
      }
      const id = window.setTimeout(() => setErasing(true), intervalMs);
      return () => window.clearTimeout(id);
    }
    if (typed.length > 0) {
      const id = window.setTimeout(() => setTyped(typed.slice(0, -1)), 22);
      return () => window.clearTimeout(id);
    }
    setErasing(false);
    setIndex((i) => (i + 1) % messages.length);
  }, [typed, erasing, index, messages, intervalMs]);

  return typed;
}

function useUptime(startedAt: number | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (startedAt === null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);
  if (startedAt === null || now === null) return "00:00:00";
  const elapsedMs = Math.max(0, now - startedAt);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function useProgress() {
  const [progress, setProgress] = useState(7);
  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 96) return 42 + Math.random() * 8;
        const step = (100 - p) * 0.045 + Math.random() * 0.6;
        return Math.min(98, p + step);
      });
    }, 320);
    return () => window.clearInterval(id);
  }, []);
  return progress;
}

function useServices() {
  const [states, setStates] = useState<Record<string, ServiceState>>(() =>
    Object.fromEntries(SERVICES.map((s) => [s.id, s.initial])) as Record<string, ServiceState>
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setStates((prev) => {
        const next = { ...prev };
        const target = SERVICES[Math.floor(Math.random() * SERVICES.length)];
        const states: ServiceState[] = ["online", "syncing", "building"];
        next[target.id] = states[Math.floor(Math.random() * states.length)];
        return next;
      });
    }, 1900);
    return () => window.clearInterval(id);
  }, []);

  return states;
}

const STATE_STYLES: Record<ServiceState, { dot: string; label: string; text: string }> = {
  online:   { dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)]", label: "ONLINE",   text: "text-emerald-300" },
  syncing:  { dot: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]",    label: "SYNCING",  text: "text-amber-300" },
  building: { dot: "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.65)]",     label: "BUILDING", text: "text-sky-300" },
};

const LEVEL_STYLES = {
  info: "text-white/55",
  warn: "text-amber-300",
  ok:   "text-emerald-300",
};

export function MaintenancePage() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  useEffect(() => {
    setStartedAt(Date.now());
  }, []);

  const log = useTypewriterLog(BOOT_LOG_LINES);
  const status = useRotatingStatus(STATUS_LINES);
  const uptime = useUptime(startedAt);
  const progress = useProgress();
  const services = useServices();

  const buildHashValue = useMemo(
    () => (startedAt === null ? "0000000" : buildHash(startedAt % 1_000_000)),
    [startedAt]
  );
  const incidentId = useMemo(
    () =>
      startedAt === null
        ? "00000000"
        : buildHash((startedAt + 7) % 1_000_000, 8).toUpperCase(),
    [startedAt]
  );

  const logRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log.count, log.partial]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#080808] text-white font-mono">
      <div aria-hidden className="absolute inset-0 hero-dot-grid opacity-60" />
      <div aria-hidden className="absolute inset-0 maintenance-scanlines" />
      <div aria-hidden className="absolute inset-0 maintenance-vignette" />
      <div aria-hidden className="absolute -top-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-red-600/20 blur-3xl animate-float-soft" />
      <div aria-hidden className="absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-red-500/15 blur-3xl animate-float-slow" />

      <div aria-hidden className="particle-field">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="particle-dot" />
        ))}
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-10">
        <header className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-white/45">
          <div className="flex items-center gap-3">
            <Image
              src="/colorstack_run_logo_red_4.png"
              alt="ColorStackRUN"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
            <span>colorstackrun · ops</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span>node {process.env.NODE_ENV === "production" ? "edge-1" : "dev-0"}</span>
            <span>build {buildHashValue}</span>
            <span className="flex items-center gap-2 text-emerald-200">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-emerald-400 pulse-ring" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              shipping
            </span>
          </div>
        </header>

        <div className="mt-10 sm:mt-14">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.32em] text-emerald-200">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Planned upgrade · Nothing&apos;s broken
          </div>

          <h1
            data-text="WE'LL BE RIGHT BACK."
            className="maintenance-glitch mt-5 text-[clamp(2.25rem,7.5vw,5rem)] font-black leading-[0.95] tracking-tight"
          >
            WE&apos;LL BE RIGHT BACK.
          </h1>

          <p className="mt-5 max-w-2xl text-base sm:text-lg text-white/75">
            <span className="text-red-400">&gt;</span>{" "}
            <span>{status}</span>
            <span className="ml-1 inline-block w-2.5 h-5 align-middle bg-red-500 maintenance-blink" />
          </p>
          <p className="mt-3 max-w-2xl text-sm text-white/55">
            The ColorStackRUN team is shipping improvements to the chapter site — fresh events,
            updated alumni, and a few extra polish touches. The site will be back online
            momentarily. No outage, no incident — just upgrades in progress.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.28em] text-white/55">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              release {buildHashValue}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              ticket #{incidentId}
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1 text-emerald-200/80">
              type: improvement
            </span>
          </div>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5 text-[10px] uppercase tracking-[0.3em] text-white/45">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-3">/var/log/colorstack-run.log</span>
              </div>
              <span>tail -f</span>
            </div>
            <div
              ref={logRef}
              className="h-72 overflow-y-auto px-4 py-3 text-[12.5px] leading-relaxed"
            >
              {BOOT_LOG_LINES.slice(0, log.count).map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-white/30 select-none">{line.ts}</span>
                  <span className={`uppercase text-[10px] tracking-widest pt-0.5 w-10 ${LEVEL_STYLES[line.level]}`}>
                    {line.level}
                  </span>
                  <span className="text-white/80">{line.text}</span>
                </div>
              ))}
              {log.count < BOOT_LOG_LINES.length && (
                <div className="flex gap-3">
                  <span className="text-white/30 select-none">{BOOT_LOG_LINES[log.count].ts}</span>
                  <span className={`uppercase text-[10px] tracking-widest pt-0.5 w-10 ${LEVEL_STYLES[BOOT_LOG_LINES[log.count].level]}`}>
                    {BOOT_LOG_LINES[log.count].level}
                  </span>
                  <span className="text-white/80">
                    {log.partial}
                    <span className="ml-0.5 inline-block w-1.5 h-3.5 align-middle bg-red-500 maintenance-blink" />
                  </span>
                </div>
              )}
              {log.count >= BOOT_LOG_LINES.length && (
                <div className="flex gap-3 pt-1">
                  <span className="text-red-400">$</span>
                  <span className="text-white/60">awaiting upstream signal</span>
                  <span className="ml-0.5 inline-block w-1.5 h-3.5 align-middle bg-red-500 maintenance-blink" />
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/45">
              <span>services</span>
              <span>5</span>
            </div>
            <ul className="space-y-2.5">
              {SERVICES.map((s) => {
                const state = services[s.id];
                const style = STATE_STYLES[state];
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex items-center gap-2.5 text-white/80">
                      <span className={`relative h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      {s.label}
                    </span>
                    <span className={`text-[10px] uppercase tracking-[0.25em] ${style.text}`}>
                      {style.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="my-4 h-px bg-white/10" />

            <dl className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-white/45 uppercase tracking-[0.22em] text-[10px]">Uptime</dt>
                <dd className="text-white/85 tabular-nums">{uptime}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/45 uppercase tracking-[0.22em] text-[10px]">Region</dt>
                <dd className="text-white/85">iad1 · newark</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/45 uppercase tracking-[0.22em] text-[10px]">Build</dt>
                <dd className="text-white/85">#{buildHashValue}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="mt-6 rounded-xl border border-white/10 bg-black/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/45">
            <span>rolling out improvements</span>
            <span className="tabular-nums text-white/80">{progress.toFixed(1)}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-300 transition-[width] duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-white/45">
            <span>step 3 / 5</span>
            <span>eta ~ 00:0{Math.max(2, 9 - Math.floor(progress / 12))}:00</span>
            <span>auto-resume when ready</span>
            <span>follow @colorstackrun for updates</span>
          </div>
        </section>

        <footer className="mt-auto pt-10 flex flex-col gap-2 text-[10px] uppercase tracking-[0.3em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>colorstackrun.org · rutgers university — newark</span>
          <span>questions? colorstackrun@gmail.com</span>
        </footer>
      </div>
    </main>
  );
}

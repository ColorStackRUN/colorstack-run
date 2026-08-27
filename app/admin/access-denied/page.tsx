import Link from "next/link";

export default function AdminAccessDeniedPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#121816] px-6 py-10 text-white flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <section className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-white/[0.06] p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
        <p className="mb-5 inline-flex rounded-full border border-red-300/25 bg-red-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-100">
          Admin area
        </p>
        <h1 className="max-w-md text-4xl font-bold tracking-tight text-white md:text-5xl">Nice try. This door is not for you.</h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 md:text-lg">
          You&apos;ve reached the ColorStack RUN admin console. It is reserved for authorized current E-Board members—not
          for curious clicks, side quests, or seeing what happens next.
        </p>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
          If you&apos;re supposed to be here, use your approved ScarletMail account. If not, this is the part where you
          gracefully step away from the control panel.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin/login"
            className="rounded-xl bg-[#E11D2E] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Try another account
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Back to the site
          </Link>
        </div>
      </section>
    </main>
  );
}

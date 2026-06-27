"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentProps, type CSSProperties, type MouseEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { type SiteContent } from "@/app/lib/content-types";
import { isSectionSlug, type SectionSlug } from "@/app/lib/site-sections";
import { MotionSection, Reveal, AnimatedCounter } from "./motion";
import { TeamCardPhysicsShell, TEAM_CARD_PHYSICS_MODE } from "./team-card-physics-shell";

type LandingPageProps = { content: SiteContent };
type ModalImageItem = { src: string; title: string };
type ActiveFlyerState = {
  src: string;
  title: string;
  galleryItems?: ModalImageItem[];
  galleryIndex?: number;
};
type ActiveAlumniStoryState = {
  member: SiteContent["alumni"][number];
  accent: string;
};
type ActiveTeamMemberState = SiteContent["team"][number];

const ALUMNI_COLORS = [
  "#dc2626", "#9333ea", "#ea580c", "#16a34a", "#ca8a04", "#0891b2",
];

/* ─────────────────────────────────────────
   Theme token maps
   All dark-mode classes carry a dark: prefix;
   light-mode classes are the default.
───────────────────────────────────────── */
const T = {
  page:        "bg-[#fafafa]        dark:bg-[#080808]",
  pageAlt:     "bg-[#f4f4f5]        dark:bg-[#0d0d0d]",
  surf:        "bg-white             dark:bg-[#0f0f0f]",
  surfAlumni:  "bg-white             dark:bg-[#111111]",
  footer:      "bg-gray-950",
  text:        "text-gray-900        dark:text-white",
  textMuted:   "text-gray-700        dark:text-white/72",
  textFaint:   "text-gray-600        dark:text-white/52",
  textDim:     "text-gray-500        dark:text-white/36",
  border:      "border-gray-100      dark:border-white/[0.07]",
  border2:     "border-gray-200      dark:border-white/10",
  border3:     "border-gray-300      dark:border-white/20",
  selection:   "selection:bg-red-100 dark:selection:bg-red-900/40",
  navBg: (scrolled: boolean, isDark: boolean) =>
    scrolled
      ? isDark ? "rgba(8,8,8,0.92)"        : "rgba(250,250,250,0.92)"
      : "transparent",
  navBorder: (scrolled: boolean, isDark: boolean) =>
    scrolled
      ? isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)"
      : "none",
  badge:      "bg-black/[0.04]  dark:bg-white/[0.04] border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70",
  cardBg:     "bg-white          dark:bg-[#0f0f0f]",
  cardHover:  "hover:bg-gray-50  dark:hover:bg-[#131313]",
  overlay:    "bg-white/[0.03]   dark:bg-white/[0.03]",
  iconBg:     "bg-black/[0.04]   dark:bg-white/10",
  iconBgHover:"hover:bg-black/[0.07] dark:hover:bg-white/20",
  orbColor:   "bg-red-600/[0.06] dark:bg-red-700/10",
  orbColor2:  "bg-red-500/[0.05] dark:bg-red-900/[0.08]",
  mobileMenu: "bg-white           dark:bg-[#0d0d0d]",
  flyerBg:    "bg-gray-100        dark:bg-[#161616]",
  modalBg:    "bg-white           dark:bg-[#111111]",
  modalInner: "bg-gray-50         dark:bg-[#0a0a0a]",
};

function handleCursorGlowMove(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const tiltY = ((x / rect.width) - 0.5) * 12;
  const tiltX = -((y / rect.height) - 0.5) * 12;
  event.currentTarget.style.setProperty("--glow-x", `${x}px`);
  event.currentTarget.style.setProperty("--glow-y", `${y}px`);
  event.currentTarget.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
  event.currentTarget.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
}

export function LandingPage({ content }: LandingPageProps) {
  const [scrollY, setScrollY]   = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFlyer, setActiveFlyer] = useState<ActiveFlyerState | null>(null);
  const [activeAlumniStory, setActiveAlumniStory] = useState<ActiveAlumniStoryState | null>(null);
  const [activeTeamMember, setActiveTeamMember] = useState<ActiveTeamMemberState | null>(null);
  const [isDark, setIsDark]     = useState(false);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const sectionFromPath = useMemo((): SectionSlug | null => {
    const seg = pathname.replace(/^\//, "");
    if (!seg) return null;
    return isSectionSlug(seg) ? seg : null;
  }, [pathname]);

  const { links, events, stats, team, impact, gallery, alumni, testimonials } = content;
  const partners = content.partners.filter((p) => p.src.trim().length > 0);
  const sortedEvents = [...events].sort((a, b) => compareEventDateTime(a, b));
  const { upcomingEvents, pastEvents } = splitEventsByStatus(sortedEvents);
  const gallerySections = buildGallerySections(gallery, sortedEvents);
  const [eventsView, setEventsView] = useState<"upcoming" | "past">("upcoming");
  const [activeGalleryTab, setActiveGalleryTab] = useState(0);
  const activeEvents = eventsView === "upcoming" ? upcomingEvents : pastEvents;
  const navLinks = useMemo(
    () => {
      const items: { id: SectionSlug; href: string; label: string }[] = [
        { id: "about", href: "/about", label: "About" },
        { id: "events", href: "/events", label: "Events" },
      ];
      if (gallery.length > 0) items.push({ id: "gallery", href: "/gallery", label: "Gallery" });
      items.push({ id: "team", href: "/team", label: "Team" });
      if (alumni.length > 0) items.push({ id: "alumni", href: "/alumni", label: "Alumni" });
      return items;
    },
    [gallery.length, alumni.length]
  );

  useEffect(() => {
    if (!sectionFromPath) return;
    const id = window.setTimeout(() => setActiveSection(sectionFromPath), 0);
    return () => window.clearTimeout(id);
  }, [sectionFromPath]);

  useEffect(() => {
    if (!sectionFromPath) return;
    const run = () => {
      const el = document.getElementById(sectionFromPath);
      if (!el) return;
      const offset = 80;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? "auto" : "smooth" });
    };
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(run);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [sectionFromPath, reduceMotion]);

  // Initialise from localStorage / system pref after mount (avoids hydration mismatch)
  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = localStorage.getItem("colorstack-theme");
      setIsDark(stored === "dark");
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("colorstack-theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setShowBackToTop(y > 420);

      const sectionIds = navLinks.map((item) => item.id);
      const marker = y + window.innerHeight * 0.35;
      let current = sectionIds[0] ?? "about";
      for (const id of sectionIds) {
        const sectionEl = document.getElementById(id);
        if (!sectionEl) continue;
        if (marker >= sectionEl.offsetTop - 80) current = id;
      }
      if (window.innerHeight + y >= document.body.scrollHeight - 20) {
        current = sectionIds[sectionIds.length - 1] ?? current;
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [navLinks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeFlyer) setActiveFlyer(null);
        if (activeAlumniStory) setActiveAlumniStory(null);
        if (activeTeamMember) setActiveTeamMember(null);
        if (activeFlyer || activeAlumniStory || activeTeamMember) return;
      }
      if (!activeFlyer) return;
      if (!activeFlyer.galleryItems || activeFlyer.galleryItems.length <= 1) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const delta = e.key === "ArrowRight" ? 1 : -1;
        const currentIndex = activeFlyer.galleryIndex ?? 0;
        const nextIndex = (currentIndex + delta + activeFlyer.galleryItems.length) % activeFlyer.galleryItems.length;
        const nextItem = activeFlyer.galleryItems[nextIndex];
        setActiveFlyer({ ...activeFlyer, src: nextItem.src, title: nextItem.title, galleryIndex: nextIndex });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeFlyer, activeAlumniStory, activeTeamMember]);

  const scrolled = scrollY > 60;

  return (
    <div className={`${T.page} ${T.selection} ${isDark ? "dark" : "light"}`}>
      {/* ── Navigation ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: T.navBg(scrolled, isDark),
          backdropFilter:  scrolled ? "blur(20px)" : "none",
          borderBottom:    T.navBorder(scrolled, isDark),
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/colorstack_run_logo_red_4.png"
                alt="ColorStack Rutgers Newark logo"
                width={36}
                height={36}
                className={`w-9 h-9 rounded-full object-cover ${T.border} group-hover:border-red-500/40 transition-colors`}
                priority
              />
              <span className={`font-semibold text-lg tracking-tight ${T.text}`}>
                ColorStack<span className="text-red-500">RUN</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ id, href, label }) => (
                <Link
                  key={id}
                  href={href}
                  scroll={false}
                  className={`px-4 py-2 text-sm rounded-lg transition-all ${
                    activeSection === id
                      ? "text-red-600 dark:text-red-400 bg-red-500/[0.08] border border-red-500/20"
                      : `${T.textMuted} hover:${T.text} hover:bg-black/[0.04] dark:hover:bg-white/[0.05]`
                  }`}
                >
                  {label}
                </Link>
              ))}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={`ml-2 w-9 h-9 flex items-center justify-center rounded-full ${T.border} border ${T.iconBg} ${T.iconBgHover} ${T.textFaint} hover:${T.text} transition-all`}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>

              <a
                href={links.join}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-glow ml-3 px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-full transition-all hover:shadow-lg hover:shadow-red-600/25 hover:shadow-[0_0_30px_rgba(239,68,68,0.28)] hover:scale-[1.02]"
                onMouseMove={handleCursorGlowMove}
              >
                Join Us
              </a>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={`w-9 h-9 flex items-center justify-center rounded-full ${T.border} border ${T.iconBg} ${T.textFaint} transition-all`}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              <button
                className={`p-2 ${T.textMuted} hover:${T.text} transition-colors`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${T.border} ${T.mobileMenu}`}>
            <div className="px-6 py-5 space-y-1">
              {navLinks.map(({ id, href, label }) => (
                <Link
                  key={id}
                  href={href}
                  scroll={false}
                  className={`block px-3 py-2.5 text-sm rounded-lg transition-all ${
                    activeSection === id
                      ? "text-red-600 dark:text-red-400 bg-red-500/[0.08] border border-red-500/20"
                      : `${T.textMuted} hover:bg-black/[0.04] dark:hover:bg-white/[0.05]`
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-3">
                <a
                  href={links.join}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-full text-center transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Join Us
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className={`absolute inset-0 hero-dot-grid ${isDark ? "" : "light"}`} />
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full ${T.orbColor} blur-[120px] animate-float-soft`} />
          <div className={`absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full ${T.orbColor2} blur-[100px] animate-float-soft-delayed`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-red-600/[0.04] dark:bg-red-950/10 blur-[160px] animate-float-slow`} />
        </div>
        <div className="particle-field" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => <span key={i} className="particle-dot" />)}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 pt-28 pb-24">
          {/* Two-column hero: logo left, content right */}
          <div className="grid lg:grid-cols-[340px_1fr] gap-10 lg:gap-20 items-center">

            {/* ── Left: Big logo ── */}
            <Reveal direction="left">
              <div className="flex justify-center lg:justify-start">
                <Image
                  src="/colorstack_run_logo_red_4.png"
                  alt="ColorStack Rutgers Newark logo"
                  width={340}
                  height={340}
                  className={`w-48 h-48 md:w-64 md:h-64 lg:w-[340px] lg:h-[340px] rounded-full object-cover border-2 ${T.border2} shadow-2xl shadow-red-500/10`}
                  priority
                />
              </div>
            </Reveal>

            {/* ── Right: Content ── */}
            <Reveal direction="right">
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
                {/* Badge */}
                <div className={`inline-flex items-center gap-2.5 px-4 py-2 ${T.badge} border rounded-full text-xs font-medium tracking-wide uppercase`}>
                  <span className="relative flex h-2 w-2">
                    <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  Rutgers University–Newark Chapter
                </div>

                {/* Headline */}
                <div>
                  <h1 className={`text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.98] mb-3 ${T.text}`}>
                    Welcome to
                  </h1>
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.98] bg-gradient-to-r from-red-600 via-red-500 to-rose-500 dark:from-red-500 dark:via-red-400 dark:to-rose-400 bg-clip-text text-transparent">
                    ColorStack<span className={T.text}> - RUN</span>
                  </h2>
                  <p className={`text-base md:text-lg ${T.textDim} mt-4 uppercase tracking-[0.14em] font-semibold`}>
                    Rutgers University–Newark
                  </p>
                </div>

                {/* Description */}
                <p className={`text-lg md:text-xl ${T.textMuted} leading-relaxed max-w-lg`}>
                  ColorStack at Rutgers University–Newark: ColorStackRUN is the official Rutgers Newark ColorStack chapter, building a stronger pathway for Black and Latinx students in tech through mentorship, career development, and community.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <a
                    href={links.join}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-glow group inline-flex items-center gap-2 px-7 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-full transition-all hover:shadow-xl hover:shadow-red-600/30 hover:shadow-[0_0_34px_rgba(239,68,68,0.3)] hover:scale-[1.03]"
                    onMouseMove={handleCursorGlowMove}
                  >
                    Join the Community
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                  <Link
                    href="/events"
                    scroll={false}
                    className={`cursor-glow inline-flex items-center gap-2 px-7 py-3.5 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/10 border ${T.border2} ${T.text} font-semibold rounded-full transition-all hover:shadow-[0_0_24px_rgba(239,68,68,0.14)]`}
                    onMouseMove={handleCursorGlowMove}
                  >
                    Explore Events <span>↓</span>
                  </Link>
                </div>

                {/* Social links */}
                <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-sm ${T.textDim}`}>
                  <a
                    href={links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 hover:${T.text} transition-colors`}
                  >
                    <InstagramIcon className="w-4 h-4" />
                    Instagram
                  </a>
                  <span aria-hidden>·</span>
                  <a
                    href={links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 hover:${T.text} transition-colors`}
                  >
                    <LinkedInIcon className="w-4 h-4" />
                    LinkedIn
                  </a>
                  <span aria-hidden>·</span>
                  <a
                    href={`mailto:${links.email}`}
                    className={`inline-flex items-center gap-1.5 hover:${T.text} transition-colors`}
                  >
                    <MailIcon className="w-4 h-4" />
                    Email Us
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Stats — full width below both columns */}
          <Reveal>
            <div className={`mt-20 pt-10 border-t ${T.border} grid grid-cols-2 md:grid-cols-4 gap-6`}>
              {stats.map((stat) => (
                <div key={stat.id} className="text-center px-2">
                  <div className={`text-xl md:text-2xl font-black tracking-tight ${T.text} mb-1 whitespace-nowrap`}>
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className={`text-xs ${T.textDim} uppercase tracking-widest font-medium`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center ${T.textDim} animate-bounce`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── About ── */}
      <MotionSection id="about" className={`py-28 md:py-36 px-6 lg:px-12 ${T.page}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
            <Reveal direction="left">
              <div className="space-y-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Who We Are</p>
                <h2 className={`text-5xl md:text-6xl font-black tracking-tight leading-tight ${T.text}`}>
                  More than <span className="text-red-500">code.</span>
                  <br />A <span className="text-red-500">community.</span>
                </h2>
                <p className={`${T.textMuted} text-lg leading-relaxed`}>
                  We are the ColorStack Rutgers Newark chapter — ColorStack at Rutgers University–Newark and the Rutgers Newark ColorStack
                  community on campus. As the local arm of the national nonprofit, we are dedicated to increasing the number of Black and Latinx computer science graduates.
                </p>
                <p className={`${T.textMuted} leading-relaxed`}>
                  Through mentorship, professional development, and real-world opportunities, we empower
                  members to thrive in tech and lead with impact.
                </p>
                <a
                  href={links.join}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${T.textMuted} hover:text-red-500 border-b ${T.border2} hover:border-red-400 pb-0.5 transition-all`}
                >
                  Learn More About Us →
                </a>
              </div>
            </Reveal>

            <Reveal direction="right">
              <div className="grid gap-3">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                      </svg>
                    ),
                    title: "Build Your Network",
                    desc: "Connect with peers, mentors, and industry professionals who support your growth.",
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                      </svg>
                    ),
                    title: "Find Opportunities",
                    desc: "Access internships, career resources, and exclusive opportunities in tech.",
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                      </svg>
                    ),
                    title: "Grow Your Future",
                    desc: "Sharpen your skills and lead with confidence through workshops and events.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`cursor-glow cursor-tilt group flex gap-4 p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border ${T.border} hover:border-red-500/30 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all hover:shadow-[0_0_30px_rgba(239,68,68,0.12)] cursor-default`}
                    onMouseMove={handleCursorGlowMove}
                  >
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-red-600/08 dark:bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:bg-red-600/12 dark:group-hover:bg-red-600/15 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${T.text} mb-1`}>{item.title}</h3>
                      <p className={`text-sm ${T.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </MotionSection>

      {/* ── Impact / What We Do ── */}
      <MotionSection className={`py-24 px-6 lg:px-12 ${T.page}`}>
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500 mb-4">What We Do</p>
              <h2 className={`text-4xl md:text-5xl font-black tracking-tight max-w-2xl leading-tight ${T.text}`}>
                Built for students serious about tech careers
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {impact.map((item, i) => (
              <Reveal key={item.id}>
                <div
                  className={`cursor-glow cursor-tilt relative overflow-hidden group p-7 rounded-2xl ${T.surf} border ${T.border} hover:border-red-500/25 dark:hover:border-red-500/25 hover:border-red-200 transition-all card-shimmer shadow-sm dark:shadow-none hover:shadow-[0_0_34px_rgba(239,68,68,0.14)]`}
                  onMouseMove={handleCursorGlowMove}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-600 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl" />
                  <div className="w-8 h-8 rounded-lg bg-red-600/08 dark:bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-5">
                    <span className="text-red-500 text-sm font-bold">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className={`text-lg font-bold ${T.text} mb-3`}>{item.title}</h3>
                  <p className={`${T.textMuted} text-sm leading-relaxed`}>{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </MotionSection>

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <MotionSection className={`py-24 px-6 lg:px-12 ${T.page}`}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="text-center mb-14">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500 mb-4">Member Stories</p>
                <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${T.text}`}>
                  Hear from our community
                </h2>
              </div>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.map((item) => {
                const initials = item.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
                return (
                  <Reveal key={item.id}>
                    <div
                      className={`cursor-glow cursor-tilt relative flex flex-col p-7 rounded-2xl ${T.surf} border ${T.border} hover:border-red-500/25 transition-all h-full shadow-sm dark:shadow-none hover:shadow-[0_0_30px_rgba(239,68,68,0.12)]`}
                      onMouseMove={handleCursorGlowMove}
                    >
                      <span className="text-red-500 text-5xl font-black leading-none select-none mb-2">&ldquo;</span>
                      <p className={`${T.textMuted} text-sm leading-relaxed flex-1`}>{item.testimonial}</p>
                      <div className={`flex items-center gap-3 mt-6 pt-5 border-t ${T.border}`}>
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <span className="text-red-500 text-sm font-bold">{initials}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm ${T.text}`}>{item.name}</p>
                          <p className={`text-xs ${T.textDim}`}>
                            Class of {item.graduationYear}{item.major ? ` · ${item.major}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </MotionSection>
      )}

      {/* ── Events ── */}
      <MotionSection id="events" className={`pt-28 pb-12 md:pb-14 px-6 lg:px-12 ${T.pageAlt}`}>
        <div className="max-w-7xl mx-auto">
          <Reveal direction="left">
            <div className={`flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8 border-b ${T.border} pb-6`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500 mb-3">Events</p>
                <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${T.text}`}>
                  {eventsView === "upcoming" ? "What's happening next" : "Event archive"}
                </h2>
              </div>
              <p className={`text-sm ${T.textDim}`}>All times Eastern</p>
            </div>
          </Reveal>

          <Reveal direction="right">
            <div className="mb-8 inline-flex rounded-full border border-red-500/20 bg-red-500/5 p-1">
              <button
                type="button"
                onClick={() => setEventsView("upcoming")}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                  eventsView === "upcoming"
                    ? "bg-red-600 text-white shadow-sm"
                    : `${T.textMuted} hover:text-gray-900 dark:hover:text-white`
                }`}
              >
                Upcoming ({upcomingEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setEventsView("past")}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                  eventsView === "past"
                    ? "bg-red-600 text-white shadow-sm"
                    : `${T.textMuted} hover:text-gray-900 dark:hover:text-white`
                }`}
              >
                Past ({pastEvents.length})
              </button>
            </div>
          </Reveal>

          <EventsCards
            emptyMessage={eventsView === "upcoming" ? "No upcoming events. Check back soon." : "Past events will appear here after they happen."}
            events={activeEvents}
            textColorClasses={T}
            setActiveFlyer={setActiveFlyer}
          />
        </div>
      </MotionSection>

      {/* ── Gallery ── */}
      {gallerySections.length > 0 && (
        <MotionSection id="gallery" className={`pt-8 pb-24 md:pt-10 px-6 lg:px-12 ${T.pageAlt}`}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="text-center mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500 mb-4">Gallery</p>
                <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${T.text}`}>Moments by event</h2>
              </div>
            </Reveal>

            {/* Tabs */}
            <Reveal>
              <div className="flex flex-wrap gap-2 mb-8">
                {gallerySections.map((section, i) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveGalleryTab(i)}
                    onMouseMove={handleCursorGlowMove}
                    className={`cursor-glow px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeGalleryTab === i
                        ? "bg-red-600 text-white shadow-sm hover:shadow-[0_0_26px_rgba(239,68,68,0.24)]"
                        : `${T.textMuted} bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.12)]`
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* Active tab content */}
            {gallerySections[activeGalleryTab] && (
              <motion.div
                key={gallerySections[activeGalleryTab].id}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {gallerySections[activeGalleryTab].subtitle && (
                  <p className={`text-sm ${T.textMuted} mb-6`}>{gallerySections[activeGalleryTab].subtitle}</p>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gallerySections[activeGalleryTab].images.map((item) => (
                    <figure
                      key={item.id}
                      className={`cursor-glow cursor-tilt rounded-2xl overflow-hidden border ${T.border} ${T.surf} group transition-all hover:border-red-400/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.12)]`}
                      onMouseMove={handleCursorGlowMove}
                    >
                      <button
                        type="button"
                        className="relative aspect-[4/3] w-full overflow-hidden cursor-zoom-in"
                        onClick={() => {
                          const sectionTitle = gallerySections[activeGalleryTab].title;
                          const items = gallerySections[activeGalleryTab].images.map((image) => ({
                            src: image.src,
                            title: image.caption || image.alt || sectionTitle,
                          }));
                          const index = items.findIndex((image) => image.src === item.src);
                          const selectedIndex = index >= 0 ? index : 0;
                          const selected = items[selectedIndex];
                          if (!selected) return;
                          setActiveFlyer({
                            src: selected.src,
                            title: selected.title,
                            galleryItems: items,
                            galleryIndex: selectedIndex,
                          });
                        }}
                        aria-label={`Open image preview for ${item.caption || item.alt}`}
                      >
                        <ImageWithSkeleton
                          src={item.src}
                          alt={item.alt}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 1024px) 50vw, 33vw"
                        />
                      </button>
                      {item.caption && (
                        <figcaption className={`px-4 py-3 text-sm font-semibold tracking-[0.04em] italic ${T.text}`}>
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </MotionSection>
      )}

      {/* ── Partners Marquee ── */}
      {partners.length > 0 && (
        <section className={`pt-10 pb-6 md:pt-12 md:pb-8 border-y ${T.border} ${T.page} overflow-hidden`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-4">
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${T.textDim} text-center`}>Our Partners</p>
          </div>
          <div className="partner-marquee-mask relative overflow-hidden">
            <div
              className="flex gap-12 md:gap-16 animate-marquee whitespace-nowrap"
              style={{ "--partner-loop-copies": 6 } as CSSProperties}
            >
              {Array.from({ length: 6 }).flatMap((_, loopIndex) =>
                partners.map((partner) => (
                  <div
                    key={`${partner.id}-${loopIndex}`}
                    className="h-20 md:h-24 w-52 md:w-64 shrink-0 flex items-center justify-center px-4 md:px-6 rounded-xl bg-transparent dark:bg-white/90 dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-all"
                  >
                    <Image
                      src={partner.src}
                      alt={`${partner.name} logo`}
                      width={240}
                      height={72}
                      className="partner-marquee-logo max-h-14 md:max-h-[4.25rem] w-auto max-w-[min(220px,85vw)] md:max-w-[240px] object-contain opacity-100 dark:opacity-90 dark:hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Team ── */}
      <MotionSection id="team" className={`pt-12 pb-28 md:pt-16 md:pb-36 px-6 lg:px-12 ${T.page}`}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-10 md:mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500 mb-4">Executive Board</p>
              <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${T.text}`}>Meet our leadership</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
            {team.map((member) => {
              const isFlipped = flippedCard === member.id;
              const initials = member.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
              return (
                <Reveal key={member.id}>
                  {/* Perspective wrapper — sets up 3D space */}
                  <div
                    className="group relative select-none aspect-[10/16] md:aspect-[3/4]"
                    style={{ perspective: "1200px" }}
                    onClick={() => {
                      if (window.matchMedia("(max-width: 767px)").matches) {
                        setFlippedCard(null);
                        setActiveTeamMember(member);
                        return;
                      }
                      setFlippedCard(isFlipped ? null : member.id);
                    }}
                  >
                    <TeamCardPhysicsShell
                      mode={TEAM_CARD_PHYSICS_MODE}
                      disabled={!!reduceMotion}
                      freeze={isFlipped}
                      className="relative h-full w-full"
                    >
                      <motion.div
                        className="relative h-full w-full cursor-pointer"
                        style={{ transformStyle: "preserve-3d" }}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                      >

                      {/* ── FRONT FACE ── */}
                      <div
                        className="absolute inset-0 rounded-2xl overflow-hidden"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-gray-100 to-gray-200 dark:from-red-950/80 dark:via-zinc-900 dark:to-black">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[80px] font-black text-black/[0.05] dark:text-white/[0.08] select-none">{initials}</span>
                            </div>
                          </div>
                        )}

                        {/* Gradient overlays */}
                        <div className="absolute inset-x-0 top-0 h-24 md:h-40 bg-gradient-to-b from-black/65 md:from-black/80 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-[58%] md:h-1/2 bg-gradient-to-t from-black/92 to-transparent" />

                        {/* Role + Name at top */}
                        <div className="absolute left-4 right-4 bottom-4 md:bottom-auto md:top-4 md:right-4 md:pr-20">
                          <p className="text-red-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.12em] md:tracking-widest mb-1 truncate">
                            {member.role}
                          </p>
                          <h3 className="text-white font-bold text-lg md:text-xl leading-tight line-clamp-2 md:line-clamp-none">
                            {member.name}
                          </h3>
                        </div>

                        {/* Graduation year tag — top right */}
                        {member.graduationYear && (
                          <div
                            className={`absolute top-4 right-4 transition-opacity duration-150 ${isFlipped ? "opacity-0" : "opacity-100"}`}
                            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                          >
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-semibold border border-white/20">
                              Class of {member.graduationYear}
                            </span>
                          </div>
                        )}

                        {/* "View Bio" hint — slides up on group hover */}
                        <div
                          className={`absolute bottom-5 inset-x-0 flex justify-center pointer-events-none transition-all duration-150 ${
                            isFlipped
                              ? "translate-y-3 opacity-0"
                              : "translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                          }`}
                          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                        >
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/55 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/20">
                            <FlipIcon /> View Bio
                          </span>
                        </div>

                        {/* Border glow */}
                        <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-red-500/40 transition-colors duration-300 pointer-events-none" />
                      </div>

                      {/* ── BACK FACE ── */}
                      <div
                        className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-white/[0.08]"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        {/* Red accent bar at top */}
                        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-600 to-red-500" />

                        <div className="flex flex-col h-full p-5 pt-6">
                          {/* Avatar + name */}
                          <div className="flex items-center gap-2.5 md:gap-3 mb-3 md:mb-4">
                            {member.image ? (
                              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-500/40 shrink-0">
                                <Image src={member.image} alt={member.name} fill className="object-cover" sizes="48px" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
                                <span className="text-red-400 text-sm font-bold">{initials}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-red-400 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.16em] leading-tight break-words">
                                {member.role}
                              </p>
                              <h3 className="text-white font-bold text-[15px] md:text-base leading-tight">{member.name}</h3>
                            </div>
                          </div>

                          {/* Bio */}
                          <div className="flex-1 min-h-0 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <p className="text-white/78 text-[13px] md:text-sm leading-relaxed">{member.bio}</p>
                          </div>

                          {/* Social buttons */}
                          <div className="flex gap-2 mt-3">
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 hover:border-white/20 rounded-xl text-white text-xs font-semibold transition-all"
                            >
                              <LinkedInIcon /> LinkedIn
                            </a>
                            <a
                              href={`mailto:${member.email ?? links.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 hover:border-white/20 rounded-xl text-white text-xs font-semibold transition-all"
                            >
                              <MailIcon /> Email
                            </a>
                          </div>

                          <p className="text-white/40 text-[10px] text-center mt-2">Click to close</p>
                        </div>
                      </div>

                      </motion.div>
                    </TeamCardPhysicsShell>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </MotionSection>

      {/* ── Alumni Network ── */}
      {alumni.length > 0 && (
        <MotionSection id="alumni" className={`py-28 md:py-36 px-6 lg:px-12 ${T.pageAlt}`}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="text-center mb-14">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500 mb-4">Alumni Network</p>
                <h2 className={`text-4xl md:text-5xl font-black tracking-tight mb-4 ${T.text}`}>
                  Where ColorStack Takes You
                </h2>
                <p className={`${T.textMuted} max-w-xl mx-auto text-lg`}>
                  Our alumni carry ColorStackRUN into industry, research, and leadership roles across the country.
                </p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {alumni.map((member, i) => {
                const accent = ALUMNI_COLORS[i % ALUMNI_COLORS.length];
                const initials = member.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
                return (
                  <Reveal key={member.id}>
                    <div
                      className={`cursor-glow group rounded-2xl overflow-hidden ${T.surfAlumni} transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-[0_0_34px_rgba(239,68,68,0.12)]`}
                      onMouseMove={handleCursorGlowMove}
                      style={{ border: `1.5px solid ${accent}40` }}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${accent}14` }}>
                            <span className="text-5xl font-black" style={{ color: `${accent}80` }}>{initials}</span>
                          </div>
                        )}
                        <div
                          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ background: `${accent}CC` }}
                        >
                          Class of {member.graduationYear}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className={`font-bold text-lg mb-0.5 ${T.text}`}>{member.name}</h3>
                        <p className={`text-sm mb-3 ${T.textMuted}`}>{member.role}</p>
                        <div className={`flex items-center gap-2 text-sm ${T.textFaint}`}>
                          <BuildingIcon />
                          <span>{member.company}</span>
                        </div>
                        {(member.linkedin || member.story?.trim()) && (
                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                            {member.linkedin && (
                              <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
                                style={{ color: accent }}
                              >
                                Connect on LinkedIn →
                              </a>
                            )}
                            {member.story?.trim() && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-400 transition-colors"
                                onClick={() => setActiveAlumniStory({ member, accent })}
                              >
                                {getAlumniStoryCta(member.name)} →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </MotionSection>
      )}

      {/* ── CTA ── */}
      <section id="join" className="relative py-24 md:py-28 px-6 lg:px-12 overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#180f12] via-[#120e12] to-[#0a0a0a]" />
        <div className="absolute inset-0 hero-dot-grid opacity-20" />
        <div className="absolute top-[-12%] right-[-5%] w-[420px] h-[420px] bg-red-500/8 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300/90 mb-5">Get Involved</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5 leading-tight text-white">
              Ready to build your future?
            </h2>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join a community that invests in you. Grow your network, build your skills,
              and create impact — together.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href={links.join}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-glow px-7 py-3.5 bg-white text-red-700 font-bold rounded-full hover:bg-gray-100 transition-all hover:shadow-lg hover:shadow-red-900/20 hover:shadow-[0_0_32px_rgba(239,68,68,0.28)] hover:scale-[1.02] text-base"
                onMouseMove={handleCursorGlowMove}
              >
                Join on RaiderLink
              </a>
              <a
                href={`mailto:${links.email}`}
                className="cursor-glow px-7 py-3.5 border border-white/25 hover:border-white/50 text-white font-semibold rounded-full hover:bg-white/10 transition-all hover:shadow-[0_0_24px_rgba(239,68,68,0.16)] text-base"
                onMouseMove={handleCursorGlowMove}
              >
                Contact Us
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 border-t border-white/06 text-white/55 py-14 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/colorstack_run_logo_red_4.png"
                  alt="ColorStack Rutgers Newark logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                />
                <span className="font-semibold text-white">
                  ColorStack<span className="text-red-500">RUN</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-5">
                Building a diverse tech community at Rutgers University–Newark.
              </p>
              <div className="flex gap-4">
                <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors">Instagram</a>
                <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors">LinkedIn</a>
                <a href={`mailto:${links.email}`} className="text-sm hover:text-white transition-colors">Email</a>
              </div>
            </div>
            <div>
              <h3 className="text-white text-xs font-semibold mb-4 uppercase tracking-widest">Quick Links</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/about" scroll={false} className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/events" scroll={false} className="hover:text-white transition-colors">Events</Link></li>
                <li><Link href="/team" scroll={false} className="hover:text-white transition-colors">Team</Link></li>
                {alumni.length > 0 && (
                  <li><Link href="/alumni" scroll={false} className="hover:text-white transition-colors">Alumni</Link></li>
                )}
                {gallery.length > 0 && (
                  <li><Link href="/gallery" scroll={false} className="hover:text-white transition-colors">Gallery</Link></li>
                )}
                <li><Link href="/join" scroll={false} className="hover:text-white transition-colors">Get involved</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-xs font-semibold mb-4 uppercase tracking-widest">Connect</h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href={links.join} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Join Us</a></li>
                <li><a href={links.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href={`mailto:${links.email}`} className="hover:text-white transition-colors">Email</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/06 pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <p>© {new Date().getFullYear()} ColorStackRUN. All rights reserved.</p>
            <p>Rutgers University–Newark</p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            aria-label="Back to top"
            className={`fixed z-[65] cursor-glow px-4 py-2.5 rounded-full border ${T.border2} ${T.surf} ${T.text} text-sm font-semibold shadow-lg`}
            style={{
              position: "fixed",
              right: "max(1rem, env(safe-area-inset-right))",
              bottom: "max(1rem, env(safe-area-inset-bottom))",
              left: "auto",
              top: "auto",
            }}
            onMouseMove={handleCursorGlowMove}
            onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.95 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            ↑ Top
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeAlumniStory && (
          <motion.div
            className="fixed inset-0 z-[72] bg-black/70 backdrop-blur-sm"
            onClick={() => setActiveAlumniStory(null)}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? false : { y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 14, opacity: 0, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.75)]">
                <div className="grid md:grid-cols-[1.1fr_minmax(0,1fr)] h-full min-w-0">
                  <div className="relative min-h-[260px] md:min-h-[620px] min-w-0">
                    {activeAlumniStory.member.image ? (
                      <Image
                        src={activeAlumniStory.member.image}
                        alt={activeAlumniStory.member.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 45vw"
                      />
                    ) : (
                      <div className="absolute inset-0" style={{ background: `${activeAlumniStory.accent}22` }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                    <div className="absolute left-5 right-5 bottom-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: activeAlumniStory.accent }}>
                        Alumni Spotlight
                      </p>
                      <h3 className="mt-2 text-3xl font-black text-white tracking-tight">
                        {activeAlumniStory.member.name}
                      </h3>
                      <p className="mt-1 text-white/85 text-sm">
                        {activeAlumniStory.member.role} · {activeAlumniStory.member.company}
                      </p>
                    </div>
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/20 bg-black/35">
                      Class of {activeAlumniStory.member.graduationYear}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveAlumniStory(null)}
                      className="absolute right-4 top-4 z-10 h-9 w-9 rounded-full bg-black/45 hover:bg-black/70 text-white text-lg flex items-center justify-center transition-colors"
                      aria-label="Close alumni story"
                    >
                      ×
                    </button>
                  </div>

                  <div className="relative min-w-0 overflow-x-hidden overflow-y-auto bg-gradient-to-b from-black via-[#050505] to-[#0a0a0a] p-6 md:p-7">
                    <div
                      className="pointer-events-none absolute -top-16 right-0 h-44 w-44 translate-x-1/4 rounded-full blur-3xl md:w-52"
                      style={{ background: `${activeAlumniStory.accent}30` }}
                      aria-hidden
                    />
                    <div className="relative min-w-0 max-w-full">
                      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-300">
                        Story
                      </div>
                      <p className="mt-5 text-[15px] leading-7 text-white/86 whitespace-pre-line break-words">
                        {activeAlumniStory.member.story?.trim() || "Story coming soon."}
                      </p>
                      <div className="mt-7 pt-5 border-t border-white/10 flex min-w-0 flex-wrap items-center gap-3">
                        {activeAlumniStory.member.linkedin && (
                          <a
                            href={activeAlumniStory.member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0a66c2] hover:bg-[#0958a5] text-white text-sm font-semibold transition-colors"
                          >
                            <LinkedInIcon />
                            Connect on LinkedIn
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveAlumniStory(null)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white/85 hover:text-white hover:bg-white/10 text-sm font-semibold transition-colors"
                        >
                          Back to alumni
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTeamMember && (
          <motion.div
            className="fixed inset-0 z-[71] bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveTeamMember(null)}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-4 md:p-6"
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? false : { y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black shadow-[0_28px_90px_rgba(0,0,0,0.75)]">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-600 to-red-500" />
                <button
                  type="button"
                  onClick={() => setActiveTeamMember(null)}
                  className="absolute right-4 top-4 z-10 h-9 w-9 rounded-full bg-black/45 hover:bg-black/70 text-white text-lg flex items-center justify-center transition-colors"
                  aria-label="Close team member details"
                >
                  ×
                </button>
                <div className="overflow-y-auto p-6 pt-8 max-h-[88vh]">
                  <div className="flex items-center gap-3 mb-6 pr-10">
                    {activeTeamMember.image ? (
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-red-500/40 shrink-0">
                        <Image src={activeTeamMember.image} alt={activeTeamMember.name} fill className="object-cover" sizes="56px" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
                        <span className="text-red-400 text-base font-bold">
                          {activeTeamMember.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-red-400 text-[11px] font-bold uppercase tracking-[0.18em] leading-tight">
                        {activeTeamMember.role}
                      </p>
                      <h3 className="text-white font-bold text-3xl leading-tight">{activeTeamMember.name}</h3>
                    </div>
                  </div>

                  {activeTeamMember.graduationYear && (
                    <div className="mb-5">
                      <span className="inline-flex px-3 py-1 rounded-full bg-black/45 text-white/80 text-xs font-semibold border border-white/20">
                        Class of {activeTeamMember.graduationYear}
                      </span>
                    </div>
                  )}

                  <p className="text-white/85 text-[17px] leading-8 whitespace-pre-line">
                    {activeTeamMember.bio}
                  </p>

                  <div className="flex gap-3 mt-8 pb-2">
                    <a
                      href={activeTeamMember.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 hover:border-white/20 rounded-xl text-white text-sm font-semibold transition-all"
                    >
                      <LinkedInIcon /> LinkedIn
                    </a>
                    <a
                      href={`mailto:${activeTeamMember.email ?? links.email}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 hover:border-white/20 rounded-xl text-white text-sm font-semibold transition-all"
                    >
                      <MailIcon /> Email
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Flyer Modal ── */}
      <AnimatePresence>
        {activeFlyer && (
          <motion.div
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveFlyer(null)}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
          >
            <motion.div
              className={`relative w-full max-w-3xl ${T.modalBg} border ${T.border} rounded-2xl shadow-2xl p-3`}
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                aria-label="Close flyer preview"
                onClick={() => setActiveFlyer(null)}
                className={`absolute right-3 top-3 z-10 w-8 h-8 rounded-full ${T.iconBg} ${T.iconBgHover} ${T.text} text-lg flex items-center justify-center transition-colors`}
              >
                ×
              </button>
              <div className={`relative w-full h-[72vh] rounded-xl overflow-hidden ${T.modalInner}`}>
                <ImageWithSkeleton
                  src={activeFlyer.src}
                  alt={`${activeFlyer.title} flyer preview`}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                />
              </div>
              {activeFlyer.galleryItems && activeFlyer.galleryItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeFlyer.galleryIndex ?? 0;
                      const nextIndex = (current - 1 + activeFlyer.galleryItems!.length) % activeFlyer.galleryItems!.length;
                      const nextItem = activeFlyer.galleryItems![nextIndex];
                      setActiveFlyer({ ...activeFlyer, src: nextItem.src, title: nextItem.title, galleryIndex: nextIndex });
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/85 hover:bg-red-600 text-white border border-white/15 text-lg flex items-center justify-center transition-colors"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeFlyer.galleryIndex ?? 0;
                      const nextIndex = (current + 1) % activeFlyer.galleryItems!.length;
                      const nextItem = activeFlyer.galleryItems![nextIndex];
                      setActiveFlyer({ ...activeFlyer, src: nextItem.src, title: nextItem.title, galleryIndex: nextIndex });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/85 hover:bg-red-600 text-white border border-white/15 text-lg flex items-center justify-center transition-colors"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
              {activeFlyer.title && (
                <div className="px-2 pt-3 pb-1 text-center">
                  <p className={`text-sm md:text-base font-semibold tracking-[0.04em] ${T.text} italic`}>
                    {activeFlyer.title}
                  </p>
                  {activeFlyer.galleryItems && activeFlyer.galleryItems.length > 1 && (
                    <p className={`mt-1 text-xs ${T.textDim}`}>Use Left / Right arrow keys to browse.</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImageWithSkeleton(props: ComponentProps<typeof Image>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-red-500/12 via-white/10 to-red-400/10 dark:from-red-500/15 dark:via-white/[0.04] dark:to-red-600/12" />
      )}
      <Image
        {...props}
        alt={props.alt ?? ""}
        onLoad={(event) => {
          setLoaded(true);
          props.onLoad?.(event);
        }}
      />
    </>
  );
}

function EventsCards({
  emptyMessage,
  events,
  textColorClasses,
  setActiveFlyer,
}: {
  emptyMessage: string;
  events: SiteContent["events"];
  textColorClasses: typeof T;
  setActiveFlyer: (value: ActiveFlyerState | null) => void;
}) {
  return (
    <>
      {events.length === 0 ? (
        <p className={`${textColorClasses.textFaint} text-center py-12`}>{emptyMessage}</p>
      ) : (
        <motion.div
          key={`events-${events[0]?.id ?? "empty"}-${events.length}`}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          {chunkEvents(events, 3).map((row, rowIndex) => {
            const colClass =
              row.length === 1 ? "md:grid-cols-1 md:max-w-xl mx-auto"
              : row.length === 2 ? "md:grid-cols-2 md:max-w-4xl mx-auto"
              : "md:grid-cols-3";
            return (
              <div key={`events-row-${rowIndex}`} className={`grid gap-4 ${colClass}`}>
                {row.map((event) => (
                  <article
                    key={event.id}
                    className={`cursor-glow cursor-tilt group relative overflow-hidden ${textColorClasses.surf} border ${textColorClasses.border} hover:border-red-400/40 rounded-2xl p-7 transition-all ${textColorClasses.cardHover} card-shimmer shadow-sm dark:shadow-none hover:shadow-lg hover:shadow-red-500/5 hover:shadow-[0_0_34px_rgba(239,68,68,0.14)] h-full`}
                    onMouseMove={handleCursorGlowMove}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className="text-5xl font-black text-red-500 leading-none">{getDayFromDate(event.date)}</div>
                        <div className={`text-xs ${textColorClasses.textDim} mt-1 uppercase tracking-widest`}>{formatMonthFromDate(event.date)}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-red-600/08 dark:bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-full">
                        {event.type}
                      </span>
                    </div>

                    <h3 className={`text-xl font-bold mb-2 group-hover:text-red-500 transition-colors ${textColorClasses.text}`}>{event.title}</h3>
                    <p className={`text-sm ${textColorClasses.textFaint} mb-1`}>{formatEventDateRange(event)}</p>
                    <p className={`text-sm ${textColorClasses.textFaint} mb-1`}>{formatTimeRange(event.startTime, event.endTime)}</p>
                    <p className={`text-sm ${textColorClasses.textFaint}`}>{event.location}</p>

                    {event.flyerImage && (
                      <button
                        type="button"
                        className={`mt-5 w-full rounded-xl border ${textColorClasses.border} hover:border-gray-300 dark:hover:border-white/15 overflow-hidden transition-all group/flyer`}
                        onClick={() => setActiveFlyer({ src: event.flyerImage!, title: event.title, galleryItems: undefined, galleryIndex: undefined })}
                      >
                        <div className={`relative h-44 ${textColorClasses.flyerBg} overflow-hidden`}>
                          <ImageWithSkeleton
                            src={event.flyerImage}
                            alt={`${event.title} flyer`}
                            fill
                            className="object-contain group-hover/flyer:scale-[1.02] transition-transform duration-500"
                            sizes="(max-width: 768px) 90vw, 33vw"
                          />
                        </div>
                      </button>
                    )}

                    {resolveEventStatus(event) === "upcoming" && (
                      <div className="flex flex-wrap gap-2 mt-5">
                        <a
                          href={buildGoogleCalendarUrl(event)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium ${textColorClasses.textMuted} hover:text-gray-900 dark:hover:text-white border ${textColorClasses.border} hover:${textColorClasses.border2} rounded-full transition-all`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                          </svg>
                          Add to calendar
                        </a>
                        {event.raiderlinkUrl && (
                          <a
                            href={event.raiderlinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-full transition-all hover:shadow-[0_0_24px_rgba(239,68,68,0.28)]"
                          >
                            RaiderLink →
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            );
          })}
        </motion.div>
      )}
    </>
  );
}

/* ── Inline icons ── */
function FlipIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function MailIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

/* ── Utility functions ── */
function getDayFromDate(dateValue: string) {
  const parsed = parseDateInput(dateValue);
  return parsed ? String(parsed.day) : dateValue;
}
function formatMonthFromDate(dateValue: string) {
  const parsed = parseDateInput(dateValue);
  if (!parsed) return "";
  return new Date(parsed.year, parsed.month - 1, parsed.day).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function formatTimeRange(s: string, e: string) {
  return `${to12Hour(s)} – ${to12Hour(e)} EST`;
}
function to12Hour(time: string) {
  const [h, m] = time.split(":");
  const hour = Number(h), minute = Number(m);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
  const meridiem = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}
function splitEventsByStatus(events: SiteContent["events"]) {
  const upcomingEvents: SiteContent["events"] = [];
  const pastEvents: SiteContent["events"] = [];
  for (const event of events) {
    if (resolveEventStatus(event) === "past") {
      pastEvents.push(event);
    } else {
      upcomingEvents.push(event);
    }
  }
  return { upcomingEvents, pastEvents };
}
function resolveEventStatus(event: SiteContent["events"][number]) {
  if (event.statusOverride) return event.statusOverride;
  const eventEnd = getEventEndDate(event);
  if (!eventEnd) return "upcoming";
  return eventEnd.getTime() < Date.now() ? "past" : "upcoming";
}
function getEventEndDate(event: SiteContent["events"][number]) {
  const parsed = parseDateInput(event.endDate ?? event.date);
  if (!parsed) return null;
  const [hourText, minuteText] = event.endTime.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return new Date(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59, 999);
  }
  return new Date(parsed.year, parsed.month - 1, parsed.day, hour, minute, 0, 0);
}
function compareEventDateTime(a: SiteContent["events"][number], b: SiteContent["events"][number]) {
  const aTime = getEventSortTime(a);
  const bTime = getEventSortTime(b);
  return aTime - bTime;
}
function getEventSortTime(event: SiteContent["events"][number]) {
  const parsed = parseDateInput(event.date);
  if (!parsed) return Number.MAX_SAFE_INTEGER;
  const [hourText, minuteText] = event.startTime.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const resolvedHour = Number.isNaN(hour) ? 0 : hour;
  const resolvedMinute = Number.isNaN(minute) ? 0 : minute;
  return new Date(parsed.year, parsed.month - 1, parsed.day, resolvedHour, resolvedMinute, 0, 0).getTime();
}
function formatEventDateRange(event: SiteContent["events"][number]) {
  const start = parseDateInput(event.date);
  const end = parseDateInput(event.endDate ?? event.date);
  if (!start || !end) return event.date;
  const startDate = new Date(start.year, start.month - 1, start.day);
  const endDate = new Date(end.year, end.month - 1, end.day);
  const startLabel = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const endLabel = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}
function buildGallerySections(gallery: SiteContent["gallery"], events: SiteContent["events"]) {
  const eventById = new Map(events.map((event) => [event.id, event]));
  const grouped = new Map<string, SiteContent["gallery"]>();
  const ungrouped: SiteContent["gallery"] = [];

  for (const item of gallery) {
    if (item.eventId && eventById.has(item.eventId)) {
      const existing = grouped.get(item.eventId) ?? [];
      existing.push(item);
      grouped.set(item.eventId, existing);
    } else {
      ungrouped.push(item);
    }
  }

  const eventSections = events
    .filter((event) => (grouped.get(event.id)?.length ?? 0) > 0)
    .map((event) => ({
      id: `event-gallery-${event.id}`,
      title: event.title,
      subtitle: `${formatEventDateRange(event)} · ${event.location}`,
      images: grouped.get(event.id) ?? [],
    }));

  if (ungrouped.length > 0) {
    eventSections.push({
      id: "event-gallery-ungrouped",
      title: "Recent Moments",
      subtitle: "",
      images: ungrouped,
    });
  }

  return eventSections;
}
function parseDateInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d] = match.map(Number);
  if (Number.isNaN(y) || Number.isNaN(mo) || Number.isNaN(d) || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { year: y, month: mo, day: d };
}
function chunkEvents<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
function buildGoogleCalendarUrl(event: { title: string; date: string; endDate?: string; startTime: string; endTime: string; location: string }) {
  const start = toCalendarDateTime(event.date, event.startTime);
  const endDate = event.endDate && parseDateInput(event.endDate) ? event.endDate : event.date;
  const end   = toCalendarDateTime(endDate, event.endTime);
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates: `${start}/${end}`, details: "Hosted by ColorStack Rutgers–Newark", location: event.location });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
function toCalendarDateTime(date: string, time: string) {
  const [y, mo, d] = date.split("-");
  const [h, m] = time.split(":");
  if (!y || !mo || !d || !h || !m) return "";
  return `${y}${mo}${d}T${h}${m}00`;
}

function getAlumniStoryCta(fullName: string) {
  const firstName = fullName.trim().split(/\s+/)[0] || "Alumni";
  const possessive = /s$/i.test(firstName) ? `${firstName}'` : `${firstName}'s`;
  return `Read ${possessive} Story`;
}

import type { LearningResource, Opportunity } from "./content-types";

export const CLOSING_SOON_DAYS = 14;
export const LEARNING_LEVELS = ["beginner", "intermediate", "advanced", "all-levels"] as const;
export const OPPORTUNITY_CATEGORIES = ["internship-job", "scholarship", "fellowship", "hackathon", "conference", "research", "mentorship", "campus-leadership"] as const;
export const WORK_MODES = ["remote", "hybrid", "in-person", "not-applicable"] as const;

export function isSafeHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
export function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
export function isSafeSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const optionalUrl = (value: unknown) => isSafeHttpsUrl(value) ? value.trim() : undefined;

export function normalizeLearningResources(value: unknown): LearningResource[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((raw): LearningResource[] => {
    const r = raw as Partial<LearningResource>;
    const slug = text(r.slug).toLowerCase();
    if (!text(r.id) || !isSafeSlug(slug) || seen.has(slug)) return [];
    seen.add(slug);
    const level = LEARNING_LEVELS.includes(r.level as LearningResource["level"]) ? r.level as LearningResource["level"] : "all-levels";
    const topics = Array.isArray(r.topics) ? r.topics.map(text).filter(Boolean) : [];
    const chapters = Array.isArray(r.chapters) ? r.chapters.map(c => ({ timestamp: text(c?.timestamp), label: text(c?.label) })).filter(c => c.timestamp && c.label) : [];
    const published = Boolean(r.published) && Boolean(r.recordingConsentConfirmed) && Boolean(text(r.title) && text(r.series) && text(r.summary) && text(r.description) && text(r.speakerName) && isValidDate(r.sessionDate) && isSafeHttpsUrl(r.recordingUrl));
    return [{ id: text(r.id), slug, title: text(r.title), series: text(r.series) || "Whiteboard Warriors", summary: text(r.summary), description: text(r.description), speakerName: text(r.speakerName), speakerTitle: text(r.speakerTitle) || undefined, speakerOrganization: text(r.speakerOrganization) || undefined, speakerBio: text(r.speakerBio) || undefined, sessionDate: isValidDate(r.sessionDate) ? r.sessionDate : "", durationMinutes: typeof r.durationMinutes === "number" && r.durationMinutes > 0 ? r.durationMinutes : undefined, level, topics, recordingUrl: optionalUrl(r.recordingUrl) ?? "", thumbnail: text(r.thumbnail) || undefined, slidesUrl: optionalUrl(r.slidesUrl), notesUrl: optionalUrl(r.notesUrl), codeUrl: optionalUrl(r.codeUrl), transcriptUrl: optionalUrl(r.transcriptUrl), chapters, featured: Boolean(r.featured), published, recordingConsentConfirmed: Boolean(r.recordingConsentConfirmed) }];
  });
}
export function normalizeOpportunities(value: unknown): Opportunity[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): Opportunity[] => {
    const o = raw as Partial<Opportunity>;
    const category = OPPORTUNITY_CATEGORIES.includes(o.category as Opportunity["category"]) ? o.category as Opportunity["category"] : "internship-job";
    const workMode = o.workMode && WORK_MODES.includes(o.workMode as NonNullable<Opportunity["workMode"]>) ? o.workMode as NonNullable<Opportunity["workMode"]> : undefined;
    const published = Boolean(o.published) && Boolean(text(o.title) && text(o.organization) && text(o.summary) && isSafeHttpsUrl(o.applyUrl) && isValidDate(o.postedAt));
    if (!text(o.id)) return [];
    return [{ id: text(o.id), title: text(o.title), organization: text(o.organization), category, summary: text(o.summary), eligibility: text(o.eligibility) || undefined, location: text(o.location) || undefined, workMode, deadline: isValidDate(o.deadline) ? o.deadline : undefined, compensation: text(o.compensation) || undefined, applyUrl: optionalUrl(o.applyUrl) ?? "", sourceUrl: optionalUrl(o.sourceUrl), postedAt: isValidDate(o.postedAt) ? o.postedAt : "", verifiedAt: isValidDate(o.verifiedAt) ? o.verifiedAt : undefined, featured: Boolean(o.featured), published }];
  });
}
export function isActiveOpportunity(opportunity: Opportunity, now = new Date()) { return opportunity.published && (!opportunity.deadline || new Date(`${opportunity.deadline}T23:59:59`).getTime() >= now.getTime()); }
export function isClosingSoon(opportunity: Opportunity, now = new Date()) { if (!isActiveOpportunity(opportunity, now) || !opportunity.deadline) return false; const days = (new Date(`${opportunity.deadline}T23:59:59`).getTime() - now.getTime()) / 86400000; return days <= CLOSING_SOON_DAYS; }
export function sortOpportunities(items: Opportunity[]) { return [...items].sort((a,b) => Number(b.featured)-Number(a.featured) || (a.deadline ? Date.parse(a.deadline) : Infinity) - (b.deadline ? Date.parse(b.deadline) : Infinity) || Date.parse(b.postedAt)-Date.parse(a.postedAt)); }
export function supportedEmbedUrl(url: string) { try { const u = new URL(url); if ((u.hostname === "youtube.com" || u.hostname.endsWith(".youtube.com")) && u.pathname.startsWith("/embed/")) return u.toString(); if (u.hostname === "www.youtube.com" && u.pathname === "/watch") { const id = u.searchParams.get("v"); return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null; } if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${encodeURIComponent(u.pathname.slice(1))}`; } catch {} return null; }

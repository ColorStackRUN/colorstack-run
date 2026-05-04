import type {
  AlumniMember,
  EventItem,
  GalleryImage,
  ImpactItem,
  PartnerItem,
  SiteContent,
  SiteLinks,
  StatItem,
  TeamMember,
  TestimonialItem,
} from "./content-types";

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

function changedKeysFor(a: object, b: object, keys: string[]): string[] {
  const ar = a as Record<string, unknown>;
  const br = b as Record<string, unknown>;
  const out: string[] = [];
  for (const k of keys) {
    if (stableStringify(ar[k]) !== stableStringify(br[k])) out.push(k);
  }
  return out;
}

const LINK_KEYS: (keyof SiteLinks)[] = ["instagram", "linkedin", "join", "email"];

function summarizeLinks(before: SiteLinks, after: SiteLinks): string[] {
  const lines: string[] = [];
  for (const k of LINK_KEYS) {
    if (before[k] !== after[k]) {
      lines.push(`Chapter link “${k}” updated`);
    }
  }
  return lines;
}

function summarizeIdArray<T extends { id: string }>(
  label: string,
  before: T[],
  after: T[],
  titleOf: (item: T) => string,
  fieldKeys: (keyof T & string)[]
): string[] {
  const lines: string[] = [];
  const beforeMap = new Map(before.map((x) => [x.id, x]));
  const afterMap = new Map(after.map((x) => [x.id, x]));
  for (const id of beforeMap.keys()) {
    if (!afterMap.has(id)) {
      lines.push(`${label}: removed “${titleOf(beforeMap.get(id)!)}”`);
    }
  }
  for (const id of afterMap.keys()) {
    if (!beforeMap.has(id)) {
      lines.push(`${label}: added “${titleOf(afterMap.get(id)!)}”`);
    }
  }
  for (const id of beforeMap.keys()) {
    const a = beforeMap.get(id);
    const b = afterMap.get(id);
    if (!a || !b) continue;
    const keys = changedKeysFor(a, b, fieldKeys as string[]);
    if (keys.length > 0) {
      lines.push(`${label}: updated “${titleOf(b)}” (${keys.join(", ")})`);
    }
  }
  return lines;
}

const STAT_FIELDS: (keyof StatItem & string)[] = ["label", "value"];
const IMPACT_FIELDS: (keyof ImpactItem & string)[] = ["title", "description"];
const EVENT_FIELDS: (keyof EventItem & string)[] = [
  "date",
  "endDate",
  "startTime",
  "endTime",
  "title",
  "location",
  "type",
  "statusOverride",
  "raiderlinkUrl",
  "flyerImage",
];
const TEAM_FIELDS: (keyof TeamMember & string)[] = ["name", "role", "bio", "linkedin", "email", "graduationYear", "image"];
const PARTNER_FIELDS: (keyof PartnerItem & string)[] = ["name", "src"];
const GALLERY_FIELDS: (keyof GalleryImage & string)[] = ["src", "alt", "caption", "eventId"];
const ALUMNI_FIELDS: (keyof AlumniMember & string)[] = [
  "name",
  "role",
  "company",
  "graduationYear",
  "story",
  "image",
  "linkedin",
];
const TESTIMONIAL_FIELDS: (keyof TestimonialItem & string)[] = [
  "name",
  "graduationYear",
  "major",
  "testimonial",
  "image",
];

const MAX_LINES = 45;

/**
 * Human-readable bullet list of what changed between two site content snapshots.
 * Safe to show in admin UI (no secrets beyond URLs already in content).
 */
export function buildSiteContentChangeSummary(before: SiteContent, after: SiteContent): string {
  if (stableStringify(before) === stableStringify(after)) {
    return "• No structured changes detected (nothing to publish).";
  }

  const lines: string[] = [];
  lines.push(...summarizeLinks(before.links, after.links));

  lines.push(
    ...summarizeIdArray<StatItem>("Stats", before.stats, after.stats, (s) => s.label || s.id, STAT_FIELDS)
  );
  lines.push(
    ...summarizeIdArray<ImpactItem>("Impact", before.impact, after.impact, (i) => i.title || i.id, IMPACT_FIELDS)
  );
  lines.push(
    ...summarizeIdArray<EventItem>("Events", before.events, after.events, (e) => e.title || e.id, EVENT_FIELDS)
  );
  lines.push(
    ...summarizeIdArray<TeamMember>("Executive board", before.team, after.team, (t) => t.name || t.id, TEAM_FIELDS)
  );
  lines.push(
    ...summarizeIdArray<PartnerItem>("Partners", before.partners, after.partners, (p) => p.name || p.id, PARTNER_FIELDS)
  );
  lines.push(
    ...summarizeIdArray<GalleryImage>(
      "Gallery",
      before.gallery,
      after.gallery,
      (g) => g.alt || g.id,
      GALLERY_FIELDS
    )
  );
  lines.push(
    ...summarizeIdArray<AlumniMember>("Alumni", before.alumni, after.alumni, (m) => m.name || m.id, ALUMNI_FIELDS)
  );
  lines.push(
    ...summarizeIdArray<TestimonialItem>(
      "Testimonials",
      before.testimonials,
      after.testimonials,
      (t) => t.name || t.id,
      TESTIMONIAL_FIELDS
    )
  );

  if (lines.length === 0) {
    return "• Site content was modified (diff could not be summarized — review sections manually).";
  }

  const trimmed = lines.slice(0, MAX_LINES);
  const more = lines.length - trimmed.length;
  const bullets = trimmed.map((l) => `• ${l}`).join("\n");
  if (more > 0) {
    return `${bullets}\n• …and ${more} more line(s) omitted (large update).`;
  }
  return bullets;
}

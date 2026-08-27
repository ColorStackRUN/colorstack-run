import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultSiteContent, type SiteContent } from "./content-types";
import { getSupabaseAdminClient, isSupabaseConfigured } from "./supabase-admin";
import { normalizeLearningResources, normalizeOpportunities } from "./hub-content";

const contentFilePath = path.join(process.cwd(), "data", "site-content.json");
const CONTENT_TABLE = "site_content_store";
const PRIMARY_CONTENT_ID = "primary";

export type SiteContentSnapshot = {
  content: SiteContent;
  revision: number;
};

export type SiteContentWriteResult =
  | { status: "updated"; revision: number }
  | { status: "conflict" };

function normalizeSiteContent(raw: SiteContent): SiteContent {
  const normalizedEvents = (raw.events ?? defaultSiteContent.events).map((event) => {
    const legacy = event as { time?: string; startTime?: string; endTime?: string };
    return {
      ...event,
      startTime: legacy.startTime ?? legacy.time ?? "18:00",
      endTime: legacy.endTime ?? "19:00",
    };
  });

  return {
    ...defaultSiteContent,
    ...raw,
    links: { ...defaultSiteContent.links, ...raw.links },
    stats: raw.stats ?? defaultSiteContent.stats,
    impact: raw.impact ?? defaultSiteContent.impact,
    events: normalizedEvents,
    team: raw.team ?? defaultSiteContent.team,
    committee: Array.isArray(raw.committee) ? raw.committee : defaultSiteContent.committee,
    partners: Array.isArray(raw.partners) ? raw.partners : defaultSiteContent.partners,
    gallery: raw.gallery ?? defaultSiteContent.gallery,
    alumni: raw.alumni ?? defaultSiteContent.alumni,
    testimonials: raw.testimonials ?? defaultSiteContent.testimonials,
    learningResources: normalizeLearningResources(raw.learningResources),
    opportunities: normalizeOpportunities(raw.opportunities),
  };
}

async function readSiteContentFromFile(): Promise<SiteContent> {
  try {
    const raw = await fs.readFile(contentFilePath, "utf8");
    return normalizeSiteContent(JSON.parse(raw) as SiteContent);
  } catch {
    await fs.mkdir(path.dirname(contentFilePath), { recursive: true });
    await fs.writeFile(contentFilePath, `${JSON.stringify(defaultSiteContent, null, 2)}\n`, "utf8");
    return defaultSiteContent;
  }
}

async function readSiteContentFromSupabase(): Promise<SiteContentSnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(CONTENT_TABLE)
    .select("content_json, revision")
    .eq("id", PRIMARY_CONTENT_ID)
    .maybeSingle<{ content_json: SiteContent; revision: number }>();
  if (error || !data?.content_json) return null;
  return { content: normalizeSiteContent(data.content_json), revision: data.revision };
}

export async function readSiteContentSnapshot(): Promise<SiteContentSnapshot> {
  const fromSupabase = await readSiteContentFromSupabase();
  if (fromSupabase) return fromSupabase;
  return { content: await readSiteContentFromFile(), revision: 0 };
}

export async function readSiteContent(): Promise<SiteContent> {
  return (await readSiteContentSnapshot()).content;
}

async function writeSiteContentToSupabase(content: SiteContent, expectedRevision: number): Promise<SiteContentWriteResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .rpc("update_site_content_if_revision_matches", {
      expected_revision: expectedRevision,
      next_content: content,
    })
    .maybeSingle<{ revision: number }>();
  if (error) {
    throw new Error(`Failed to write content to Supabase: ${error.message}`);
  }
  if (!data) return { status: "conflict" };
  return { status: "updated", revision: data.revision };
}

export async function writeSiteContent(content: SiteContent, expectedRevision: number): Promise<SiteContentWriteResult> {
  const normalized = normalizeSiteContent(content);
  return writeSiteContentToSupabase(normalized, expectedRevision);
}

export async function syncLocalSiteContentToSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  try {
    const localContent = await readSiteContentFromFile();
    const snapshot = await readSiteContentSnapshot();
    const result = await writeSiteContentToSupabase(localContent, snapshot.revision);
    if (result.status === "conflict") {
      throw new Error("Content changed while the local sync was running.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    throw new Error(`Failed syncing local content to Supabase: ${message}`);
  }
}

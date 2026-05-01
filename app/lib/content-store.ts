import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultSiteContent, type SiteContent } from "./content-types";
import { getSupabaseAdminClient, isSupabaseConfigured } from "./supabase-admin";

const contentFilePath = path.join(process.cwd(), "data", "site-content.json");
const CONTENT_TABLE = "site_content_store";
const PRIMARY_CONTENT_ID = "primary";

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
    partners: Array.isArray(raw.partners) ? raw.partners : defaultSiteContent.partners,
    gallery: raw.gallery ?? defaultSiteContent.gallery,
    alumni: raw.alumni ?? defaultSiteContent.alumni,
    testimonials: raw.testimonials ?? defaultSiteContent.testimonials,
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

async function readSiteContentFromSupabase(): Promise<SiteContent | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(CONTENT_TABLE)
    .select("content_json")
    .eq("id", PRIMARY_CONTENT_ID)
    .maybeSingle<{ content_json: SiteContent }>();
  if (error || !data?.content_json) return null;
  return normalizeSiteContent(data.content_json);
}

export async function readSiteContent(): Promise<SiteContent> {
  const fromSupabase = await readSiteContentFromSupabase();
  if (fromSupabase) return fromSupabase;
  return readSiteContentFromFile();
}

async function writeSiteContentToSupabase(content: SiteContent): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from(CONTENT_TABLE).upsert(
    {
      id: PRIMARY_CONTENT_ID,
      content_json: content,
    },
    { onConflict: "id" }
  );
  if (error) {
    throw new Error(`Failed to write content to Supabase: ${error.message}`);
  }
}

export async function writeSiteContent(content: SiteContent): Promise<void> {
  const normalized = normalizeSiteContent(content);
  await writeSiteContentToSupabase(normalized);
}

export async function syncLocalSiteContentToSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  try {
    const localContent = await readSiteContentFromFile();
    await writeSiteContentToSupabase(localContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    throw new Error(`Failed syncing local content to Supabase: ${message}`);
  }
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultSiteContent, type SiteContent } from "./content-types";

const contentFilePath = path.join(process.cwd(), "data", "site-content.json");

export async function readSiteContent(): Promise<SiteContent> {
  try {
    const raw = await fs.readFile(contentFilePath, "utf8");
    const parsed = JSON.parse(raw) as SiteContent;
    const normalizedEvents = (parsed.events ?? defaultSiteContent.events).map((event) => {
      const legacy = event as { time?: string; startTime?: string; endTime?: string };
      return {
        ...event,
        startTime: legacy.startTime ?? legacy.time ?? "18:00",
        endTime: legacy.endTime ?? "19:00",
      };
    });

    return {
      ...defaultSiteContent,
      ...parsed,
      links: { ...defaultSiteContent.links, ...parsed.links },
      stats: parsed.stats ?? defaultSiteContent.stats,
      impact: parsed.impact ?? defaultSiteContent.impact,
      events: normalizedEvents,
      team: parsed.team ?? defaultSiteContent.team,
      gallery: parsed.gallery ?? defaultSiteContent.gallery,
    };
  } catch {
    await writeSiteContent(defaultSiteContent);
    return defaultSiteContent;
  }
}

export async function writeSiteContent(content: SiteContent): Promise<void> {
  await fs.mkdir(path.dirname(contentFilePath), { recursive: true });
  await fs.writeFile(contentFilePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

import type { MetadataRoute } from "next";
import { readSiteContent } from "@/app/lib/content-store";
import { SECTION_SLUGS, sectionIsPublished } from "@/app/lib/site-sections";
import { getSiteOrigin } from "@/app/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteOrigin();
  const content = await readSiteContent();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
  entries.push({ url: `${base}/learn`, lastModified: now, changeFrequency: "weekly", priority: 0.85 });
  entries.push({ url: `${base}/opportunities`, lastModified: now, changeFrequency: "daily", priority: 0.85 });
  entries.push({ url: `${base}/community`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
  for (const resource of content.learningResources) {
    if (resource.published) entries.push({ url: `${base}/learn/${resource.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  }

  for (const section of SECTION_SLUGS) {
    if (!sectionIsPublished(section, content)) continue;
    entries.push({
      url: `${base}/${section}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: section === "about" ? 0.9 : 0.75,
    });
  }

  return entries;
}

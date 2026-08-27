const PRODUCTION_PUBLISH_HOST = "colorstackrun.org";

function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;
  return host.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "") ?? null;
}

/**
 * Fail closed: only the real Vercel production deployment on the canonical
 * domain may mutate CMS data. Local servers and preview deployments can read
 * production content for an accurate preview, but cannot write to it.
 */
export function isLocalPublishingDisabled(host: string | null | undefined): boolean {
  return !(process.env.VERCEL_ENV === "production" && normalizeHost(host) === PRODUCTION_PUBLISH_HOST);
}

export const LOCAL_PUBLISHING_DISABLED_MESSAGE =
  "Publishing is disabled outside the live production site. Your edits stay in this browser and cannot update the live site.";

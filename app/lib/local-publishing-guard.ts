/**
 * Local admin sessions may read production content for an accurate preview, but
 * must never mutate the production Supabase project. Keep this check server-side
 * so a disabled browser button cannot be bypassed with a direct API request.
 */
export function isLocalPublishingDisabled(): boolean {
  return process.env.DISABLE_ADMIN_PUBLISHING === "true" || process.env.NODE_ENV !== "production";
}

export const LOCAL_PUBLISHING_DISABLED_MESSAGE =
  "Publishing is disabled in local development. Your edits stay in this browser and cannot update the live site.";

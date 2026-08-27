export type AdminChangelogEntry = {
  id: string;
  /** Verified display label for newer entries; historical entries are self-reported. */
  authorName: string;
  /** Present only for entries created after Google sign-in was enabled. */
  authorEmail: string | null;
  message: string;
  createdAt: string;
};

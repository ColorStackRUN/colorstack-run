export type AdminChangelogEntry = {
  id: string;
  /** Self-reported name of who recorded this entry. */
  authorName: string;
  message: string;
  createdAt: string;
};

/** Phrases people search; used in meta keywords and woven into descriptions (Google matches loosely). */
export const SITE_KEYWORDS = [
  "ColorStack Rutgers Newark",
  "Rutgers Newark ColorStack",
  "ColorStack at Rutgers Newark",
  "Rutgers University–Newark ColorStack",
  "ColorStackRUN",
] as const;

/**
 * Homepage & site-wide snippet for Google / social cards.
 * Includes common query variants: “colorstack rutgers newark”, “rutgers newark colorstack”, “colorstack at rutgers newark”.
 */
export const HOME_DESCRIPTION =
  "ColorStack Rutgers Newark: ColorStackRUN is ColorStack at Rutgers University–Newark — the Rutgers Newark ColorStack chapter. Mentorship, career workshops, employer networking, and community for Black and Latinx students in tech. Events, leadership, alumni, gallery, and join on RaiderLink.";

/** Keep under ~60 characters where possible for SERP title display. */
export const HOME_TITLE = "ColorStackRUN | ColorStack Rutgers Newark";

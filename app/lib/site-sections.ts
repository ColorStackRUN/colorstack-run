import type { Metadata } from "next";
import type { SiteContent } from "@/app/lib/content-types";
import { getSiteOrigin } from "@/app/lib/site-url";

/** Path segments that map to on-page sections (same IDs as `MotionSection` anchors). */
export const SECTION_SLUGS = ["about", "events", "gallery", "team", "alumni", "join"] as const;
export type SectionSlug = (typeof SECTION_SLUGS)[number];

export function isSectionSlug(value: string): value is SectionSlug {
  return (SECTION_SLUGS as readonly string[]).includes(value);
}

export function sectionIsPublished(section: SectionSlug, content: SiteContent): boolean {
  if (section === "gallery") return content.gallery.length > 0;
  if (section === "alumni") return content.alumni.length > 0;
  return true;
}

const SECTION_COPY: Record<
  SectionSlug,
  { title: string; description: string }
> = {
  about: {
    title: "About",
    description:
      "About ColorStack at Rutgers University–Newark (ColorStackRUN): the Rutgers Newark ColorStack chapter — mentorship, professional development, and community for Black and Latinx students in tech.",
  },
  events: {
    title: "Events",
    description:
      "ColorStack Rutgers Newark events: workshops, mixers, and chapter programming for Rutgers–Newark ColorStack members — upcoming and past.",
  },
  gallery: {
    title: "Gallery",
    description:
      "Photos and moments from ColorStackRUN events at Rutgers University–Newark — hackathons, employer series, and community highlights.",
  },
  team: {
    title: "Executive board",
    description:
      "Meet the ColorStackRUN leadership team at Rutgers University–Newark — co-presidents, officers, and how we serve our members.",
  },
  alumni: {
    title: "Alumni",
    description:
      "Where ColorStackRUN graduates go next — alumni in software engineering, internships, and full-time roles, with stories and LinkedIn links.",
  },
  join: {
    title: "Get involved",
    description:
      "Join Rutgers Newark ColorStack (ColorStackRUN): RaiderLink, email, Instagram, and LinkedIn — get involved with ColorStack at Rutgers University–Newark.",
  },
};

export function buildSectionMetadata(section: SectionSlug): Metadata {
  const origin = getSiteOrigin();
  const { title, description } = SECTION_COPY[section];
  const pageTitle = `${title} | ColorStackRUN`;
  const path = `/${section}`;
  const url = `${origin}${path}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url,
      siteName: "ColorStackRUN",
      title: pageTitle,
      description,
      images: [
        {
          url: "/colorstack_run_logo_red_4.png",
          width: 1024,
          height: 1024,
          alt: "ColorStack Rutgers Newark logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: ["/colorstack_run_logo_red_4.png"],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

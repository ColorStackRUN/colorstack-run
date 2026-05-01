import { notFound } from "next/navigation";
import { LandingPage } from "@/app/components/site/landing-page";
import { readSiteContent } from "@/app/lib/content-store";
import { buildSectionMetadata, isSectionSlug, sectionIsPublished } from "@/app/lib/site-sections";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props) {
  const { section } = await params;
  if (!isSectionSlug(section)) notFound();
  const content = await readSiteContent();
  if (!sectionIsPublished(section, content)) notFound();
  return buildSectionMetadata(section);
}

export default async function SiteSectionPage({ params }: Props) {
  const { section } = await params;
  if (!isSectionSlug(section)) notFound();
  const content = await readSiteContent();
  if (!sectionIsPublished(section, content)) notFound();
  return <LandingPage content={content} />;
}

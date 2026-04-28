import { LandingPage } from "@/app/components/site/landing-page";
import { readSiteContent } from "@/app/lib/content-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await readSiteContent();
  return <LandingPage content={content} />;
}

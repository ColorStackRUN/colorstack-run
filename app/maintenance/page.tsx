import type { Metadata } from "next";
import { MaintenancePage } from "@/app/components/site/maintenance-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Maintenance · ColorStackRUN",
  description: "ColorStackRUN is currently undergoing scheduled maintenance.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return <MaintenancePage />;
}

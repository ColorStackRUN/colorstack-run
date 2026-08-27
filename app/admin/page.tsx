import { redirect } from "next/navigation";
import { readSiteContent } from "@/app/lib/content-store";
import { getAuthenticatedAdmin } from "@/app/lib/supabase-auth";
import { isLocalPublishingDisabled } from "@/app/lib/local-publishing-guard";
import { AdminDashboard } from "./ui/admin-dashboard";

export default async function AdminPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const content = await readSiteContent();
  return (
    <AdminDashboard
      initialContent={content}
      admin={admin}
      publishingDisabled={isLocalPublishingDisabled()}
    />
  );
}

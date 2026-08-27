import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
  const requestHeaders = await headers();
  return (
    <AdminDashboard
      initialContent={content}
      admin={admin}
      publishingDisabled={isLocalPublishingDisabled(requestHeaders.get("host"))}
    />
  );
}

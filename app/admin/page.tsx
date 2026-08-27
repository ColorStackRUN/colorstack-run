import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { readSiteContentSnapshot } from "@/app/lib/content-store";
import { getAuthenticatedAdmin } from "@/app/lib/supabase-auth";
import { isLocalPublishingDisabled } from "@/app/lib/local-publishing-guard";
import { AdminDashboard } from "./ui/admin-dashboard";

export default async function AdminPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const snapshot = await readSiteContentSnapshot();
  const requestHeaders = await headers();
  return (
    <AdminDashboard
      initialContent={snapshot.content}
      initialRevision={snapshot.revision}
      admin={admin}
      publishingDisabled={isLocalPublishingDisabled(requestHeaders.get("host"))}
    />
  );
}

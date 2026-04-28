import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";
import { readSiteContent } from "@/app/lib/content-store";
import { AdminDashboard } from "./ui/admin-dashboard";

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/admin/login");
  }

  const content = await readSiteContent();
  return <AdminDashboard initialContent={content} />;
}

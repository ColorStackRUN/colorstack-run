import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";
import { readAdminChangelog } from "@/app/lib/admin-changelog-store";
import { AdminChangelogClient } from "../ui/admin-changelog-client";

export default async function AdminChangelogPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/admin/login");
  }

  const entries = await readAdminChangelog();
  return <AdminChangelogClient entries={entries} />;
}

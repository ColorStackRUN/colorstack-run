import { getAuthenticatedAdmin } from "./supabase-auth";

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAuthenticatedAdmin()) !== null;
}

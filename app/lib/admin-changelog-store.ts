import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getSupabaseAdminClient, isSupabaseConfigured } from "./supabase-admin";
import type { AdminChangelogEntry } from "./admin-changelog-types";

const changelogFilePath = path.join(process.cwd(), "data", "admin-changelog.json");
const MAX_MESSAGE_LENGTH = 8000;
const MAX_AUTHOR_NAME_LENGTH = 120;
const QUERY_LIMIT = 200;

type ChangelogFileShape = {
  entries: AdminChangelogEntry[];
};

function normalizeEntries(raw: unknown): AdminChangelogEntry[] {
  if (!raw || typeof raw !== "object") return [];
  const entries = (raw as ChangelogFileShape).entries;
  if (!Array.isArray(entries)) return [];
  const parsed: AdminChangelogEntry[] = [];
  for (const e of entries) {
    if (typeof e !== "object" || e === null) continue;
    const rec = e as Record<string, unknown>;
    const id = typeof rec.id === "string" ? rec.id : "";
    const message = typeof rec.message === "string" ? rec.message : "";
    const createdAt = typeof rec.createdAt === "string" ? rec.createdAt : "";
    const authorName = typeof rec.authorName === "string" ? rec.authorName : "";
    const authorEmail = typeof rec.authorEmail === "string" ? rec.authorEmail : null;
    if (!id || !message || !createdAt) continue;
    parsed.push({ id, message, createdAt, authorName, authorEmail });
  }
  return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function readChangelogFromFile(): Promise<AdminChangelogEntry[]> {
  try {
    const raw = await fs.readFile(changelogFilePath, "utf8");
    return normalizeEntries(JSON.parse(raw) as ChangelogFileShape);
  } catch {
    await fs.mkdir(path.dirname(changelogFilePath), { recursive: true });
    const empty: ChangelogFileShape = { entries: [] };
    await fs.writeFile(changelogFilePath, `${JSON.stringify(empty, null, 2)}\n`, "utf8");
    return [];
  }
}

async function writeChangelogToFile(entries: AdminChangelogEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(changelogFilePath), { recursive: true });
  const payload: ChangelogFileShape = { entries };
  await fs.writeFile(changelogFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readChangelogFromSupabase(): Promise<AdminChangelogEntry[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_changelog")
    .select("id, author_name, author_email, message, created_at")
    .order("created_at", { ascending: false })
    .limit(QUERY_LIMIT);
  if (error) {
    console.error("[admin-changelog] Supabase read failed:", error.message);
    return null;
  }
  return (data ?? []).map((row: { id: string; author_name: string | null; author_email: string | null; message: string; created_at: string }) => ({
    id: row.id,
    authorName: row.author_name?.trim() ?? "",
    authorEmail: row.author_email?.trim() ?? null,
    message: row.message,
    createdAt: row.created_at,
  }));
}

export async function readAdminChangelog(): Promise<AdminChangelogEntry[]> {
  const fromDb = await readChangelogFromSupabase();
  if (fromDb) return fromDb;
  return readChangelogFromFile();
}

export async function appendAdminChangelogEntry(input: {
  message: string;
  authorName: string;
  authorEmail: string;
  authorUserId: string;
}): Promise<AdminChangelogEntry> {
  const trimmed = input.message.trim();
  const author = input.authorName.trim();
  if (!trimmed) {
    throw new Error("Message is required.");
  }
  if (!author) {
    throw new Error("Name is required.");
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message must be at most ${MAX_MESSAGE_LENGTH} characters.`);
  }
  if (author.length > MAX_AUTHOR_NAME_LENGTH) {
    throw new Error(`Name must be at most ${MAX_AUTHOR_NAME_LENGTH} characters.`);
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_changelog")
      .insert({
        message: trimmed,
        author_name: author,
        author_email: input.authorEmail.trim().toLowerCase(),
        author_user_id: input.authorUserId,
      })
      .select("id, author_name, author_email, message, created_at")
      .single<{ id: string; author_name: string; author_email: string | null; message: string; created_at: string }>();
    if (error) {
      throw new Error(`Failed to save change log entry: ${error.message}`);
    }
    return {
      id: data.id,
      authorName: data.author_name?.trim() ?? author,
      authorEmail: data.author_email?.trim() ?? input.authorEmail.trim().toLowerCase(),
      message: data.message,
      createdAt: data.created_at,
    };
  }

  const existing = await readChangelogFromFile();
  const entry: AdminChangelogEntry = {
    id: randomUUID(),
    authorName: author,
    authorEmail: input.authorEmail.trim().toLowerCase() || null,
    message: trimmed,
    createdAt: new Date().toISOString(),
  };
  await writeChangelogToFile([entry, ...existing]);
  return entry;
}

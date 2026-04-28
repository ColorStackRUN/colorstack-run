import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";

export const runtime = "nodejs";

const allowedScopes = new Set(["events", "team", "gallery", "alumni"]);

export async function POST(request: Request) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const scope = String(formData.get("scope") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (!allowedScopes.has(scope)) {
    return NextResponse.json({ error: "Invalid upload scope." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const fileName = `${randomUUID()}.${ext}`;
  const relativePath = `/uploads/${scope}/${fileName}`;
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(absolutePath, Buffer.from(arrayBuffer));

  return NextResponse.json({ url: relativePath });
}

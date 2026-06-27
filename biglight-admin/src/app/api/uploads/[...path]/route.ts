import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";
const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml" };

// GET — phục vụ ảnh đã upload (công khai để hiện trên thẻ求人).
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const rel = (params.path || []).join("/");
  if (!rel || rel.includes("..")) return NextResponse.json({ error: "Bad path" }, { status: 400 });
  try {
    const buf = await readFile(path.join(UPLOAD_DIR, rel));
    const ext = rel.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

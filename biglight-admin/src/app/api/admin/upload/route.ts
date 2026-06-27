import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";

// POST (multipart) — upload ảnh tuyển dụng. Trả về { url } để gán vào imageUrl.
export async function POST(req: Request) {
  const g = await guard("jobs.update");
  if (!g.ok) return g.res;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "ファイルがありません。" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "画像ファイルを選択してください。" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "5MB以下の画像をご利用ください。" }, { status: 400 });

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(UPLOAD_DIR, "jobs");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/api/uploads/jobs/${name}` });
}

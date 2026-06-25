import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";
const SLOTS = ["rirekisho", "zairyu", "hyouka", "jlpt", "tokutei"];
const MAX = 10 * 1024 * 1024; // 10MB

type Doc = { name: string; file: string; size: number };

async function getCandidate() {
  const session = await getSessionUser();
  if (!session || session.role !== "CANDIDATE") return null;
  return prisma.candidate.findUnique({ where: { userId: session.id } });
}

// Upload 1 file vào 1 slot.
export async function POST(req: Request) {
  const candidate = await getCandidate();
  if (!candidate) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const slot = String(form.get("slot") || "");
  const file = form.get("file") as File | null;
  if (!SLOTS.includes(slot) || !file) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "ファイルが大きすぎます（最大10MB）" }, { status: 400 });

  const dir = path.join(UPLOAD_DIR, candidate.id);
  await mkdir(dir, { recursive: true });
  const safe = file.name.replace(/[^\w.\-]/g, "_").slice(-80) || "file";
  const stored = `${slot}-${String(Date.now())}-${safe}`;
  await writeFile(path.join(dir, stored), Buffer.from(await file.arrayBuffer()));

  const docs = ((candidate.documents as Record<string, Doc[]>) || {}) as Record<string, Doc[]>;
  if (!Array.isArray(docs[slot])) docs[slot] = [];
  docs[slot].push({ name: file.name, file: stored, size: file.size });
  await prisma.candidate.update({ where: { id: candidate.id }, data: { documents: docs as object } });

  return NextResponse.json({ ok: true, slot, files: docs[slot] });
}

// Xoá 1 file khỏi 1 slot.
export async function DELETE(req: Request) {
  const candidate = await getCandidate();
  if (!candidate) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slot, file } = await req.json().catch(() => ({}));
  const docs = ((candidate.documents as Record<string, Doc[]>) || {}) as Record<string, Doc[]>;
  if (!Array.isArray(docs[slot])) return NextResponse.json({ ok: true, slot, files: [] });

  docs[slot] = docs[slot].filter((d) => d.file !== file);
  await prisma.candidate.update({ where: { id: candidate.id }, data: { documents: docs as object } });
  try { await unlink(path.join(UPLOAD_DIR, candidate.id, String(file))); } catch {}

  return NextResponse.json({ ok: true, slot, files: docs[slot] });
}

// Tải file (chỉ chủ hồ sơ).
export async function GET(req: Request) {
  const candidate = await getCandidate();
  if (!candidate) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const slot = url.searchParams.get("slot") || "";
  const fileName = url.searchParams.get("file") || "";
  const docs = ((candidate.documents as Record<string, Doc[]>) || {}) as Record<string, Doc[]>;
  const found = (docs[slot] || []).find((d) => d.file === fileName);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const buf = await readFile(path.join(UPLOAD_DIR, candidate.id, fileName));
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(found.name)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

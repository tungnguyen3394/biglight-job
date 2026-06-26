import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";
type Doc = { name: string; file: string; size: number };

// GET /api/candidates/[id]/document?slot=zairyu&file=... — admin xem file đính kèm của ứng viên.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session || !can(session.role, "view", "candidate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const slot = url.searchParams.get("slot") || "";
  const fileName = url.searchParams.get("file") || "";

  const c = await prisma.candidate.findUnique({ where: { id: params.id }, select: { documents: true } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const docs = (c.documents as Record<string, Doc[]>) || {};
  const found = (docs[slot] || []).find((d) => d.file === fileName);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const buf = await readFile(path.join(UPLOAD_DIR, params.id, fileName));
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(found.name)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

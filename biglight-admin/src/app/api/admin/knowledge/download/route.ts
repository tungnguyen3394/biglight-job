import { NextResponse } from "next/server";
import { guard } from "@/lib/guard";
import { readRaw, safeName } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

// GET ?file=... — tải file gốc (Admin-only).
export async function GET(req: Request) {
  const g = await guard("settings.view");
  if (!g.ok) return g.res;
  const file = new URL(req.url).searchParams.get("file") || "";
  if (!file) return NextResponse.json({ error: "対象が不正です。" }, { status: 422 });
  try {
    const raw = await readRaw(file);
    return new NextResponse(raw, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName(file))}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "ファイルが見つかりません。" }, { status: 404 });
  }
}

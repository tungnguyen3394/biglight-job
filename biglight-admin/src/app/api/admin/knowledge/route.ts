import { NextResponse } from "next/server";
import { guard } from "@/lib/guard";
import { listDocs, saveDoc, setStatus, setOrder, removeDoc, DOC_TYPES } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

// AI Knowledge — quản lý tài liệu (settings.* = Admin-only). KHÔNG đụng AI/OpenAI hiện tại.
export async function GET() {
  const g = await guard("settings.view");
  if (!g.ok) return g.res;
  return NextResponse.json({ docs: await listDocs(), types: DOC_TYPES });
}

// POST { file, name, type, version, content, status? } — upload mới hoặc Replace (ghi đè cùng file).
export async function POST(req: Request) {
  const g = await guard("settings.update");
  if (!g.ok) return g.res;
  const b = await req.json().catch(() => ({}));
  const file = String(b.file || "").trim();
  const content = typeof b.content === "string" ? b.content : "";
  if (!file) return NextResponse.json({ error: "ファイル名が必要です。" }, { status: 422 });
  if (!/\.(md|txt)$/i.test(file)) return NextResponse.json({ error: ".md または .txt のみ対応しています。" }, { status: 422 });
  if (content.length > 1_000_000) return NextResponse.json({ error: "ファイルが大きすぎます（最大1MB）。" }, { status: 422 });
  // 種類: cho phép tự đặt tên (preset hoặc tự do). Bỏ ký tự phá frontmatter.
  const type = (String(b.type || "").replace(/[\r\n:]/g, " ").trim().slice(0, 40)) || "Other";
  const status = b.status === "OFF" ? "OFF" : "ON";
  try {
    const meta = await saveDoc({ file, name: String(b.name || "").trim() || file, type, version: String(b.version || "1.0").trim(), content, status });
    return NextResponse.json({ ok: true, doc: meta });
  } catch (e) {
    return NextResponse.json({ error: `保存に失敗しました（書き込み権限をご確認ください）: ${(e as Error)?.message ?? ""}` }, { status: 500 });
  }
}

// PATCH { file, status } — bật/tắt ON/OFF.
export async function PATCH(req: Request) {
  const g = await guard("settings.update");
  if (!g.ok) return g.res;
  const b = await req.json().catch(() => ({}));
  // Sắp xếp lại thứ tự 1 nhóm: reorder = [file1, file2, ...] → order = index.
  if (Array.isArray(b.reorder)) {
    await Promise.all(b.reorder.map((f: unknown, i: number) => setOrder(String(f), i).catch(() => {})));
    return NextResponse.json({ ok: true });
  }
  const file = String(b.file || "").trim();
  if (!file) return NextResponse.json({ error: "対象が不正です。" }, { status: 422 });
  await setStatus(file, b.status === "OFF" ? "OFF" : "ON").catch(() => {});
  return NextResponse.json({ ok: true });
}

// DELETE ?file=...
export async function DELETE(req: Request) {
  const g = await guard("settings.update");
  if (!g.ok) return g.res;
  const file = new URL(req.url).searchParams.get("file") || "";
  if (!file) return NextResponse.json({ error: "対象が不正です。" }, { status: 422 });
  await removeDoc(file).catch(() => {});
  return NextResponse.json({ ok: true });
}

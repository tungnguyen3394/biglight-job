import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { translate, detectLang, type Lang } from "@/lib/translate";

export const dynamic = "force-dynamic";

// POST { text, target? } → { translated, source } — dùng cho preview dịch khi gõ.
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const text = typeof b.text === "string" ? b.text : "";
  const target = (["ja", "vi", "id", "en"].includes(b.target) ? b.target : "ja") as Lang;
  if (!text.trim()) return NextResponse.json({ translated: "", source: "en" });

  const source = detectLang(text);
  if (source === target) return NextResponse.json({ translated: text, source });
  const translated = await translate(text, target, source);
  return NextResponse.json({ translated, source });
}

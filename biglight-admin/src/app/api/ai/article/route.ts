import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSessionUser } from "@/lib/auth";
import { isBiglight } from "@/lib/api";

const MODEL = "claude-opus-4-8";
const textOf = (h: string) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000);

// xây prompt theo action → trả về { system, user, json? }
function build(action: string, a: Record<string, unknown>) {
  const title = (a.title as string) || "";
  const kw = (a.focusKeyword as string) || "";
  const excerpt = (a.excerpt as string) || "";
  const body = textOf(a.content as string);
  const ctx = `【記事タイトル】${title}\n【フォーカスキーワード】${kw}\n【抜粋】${excerpt}\n【本文】${body || "（未入力）"}`;
  const sys = "あなたはBIGLIGHT Job（特定技能・外国人材の求人サイト）のSEO編集者です。日本語で、検索意図とAI検索（ChatGPT/Gemini/AI Overview）に最適化された自然な文章を出力します。前置きや説明は不要、要求された内容のみ返してください。";

  switch (action) {
    case "seoTitle":
      return { sys, user: `次の記事に最適なSEOタイトルを1つだけ、30〜60文字で出力してください（記号での装飾やクオートは不要、タイトル本文のみ）。\n\n${ctx}` };
    case "meta":
      return { sys, user: `次の記事のメタディスクリプションを1つ、120〜160文字で出力してください（説明文のみ）。\n\n${ctx}` };
    case "readability":
      return { sys, user: `次の本文を、見出し・短い段落・箇条書きを使って読みやすく整えたHTMLに書き換えてください。出力はHTMLのみ（h2/h3/p/ul/li/strong等。<html>や<body>は不要）。\n\n${ctx}` };
    case "improve":
      return { sys, user: `次の記事本文をSEO・E-E-A-T・AI検索向けに改善した完全なHTMLを出力してください。見出し構成(H2/H3)、導入、具体例、内部リンク示唆を含め、HTMLのみ返す。\n\n${ctx}` };
    case "faq":
      return { sys, user: `次の記事に関するFAQを5件、JSONのみで出力してください。形式: {"faqs":[{"q":"質問","a":"回答"}]}。回答は2〜3文。\n\n${ctx}`, json: true };
    case "ilinks":
      return { sys, user: `次の記事に追加すべき内部リンクのアンカーテキスト候補を5件、1行ずつ「- アンカー → 想定リンク先」の形式で出力してください。\n\n${ctx}` };
    case "related":
      return { sys, user: `次の記事の読者が次に読みたくなる関連記事タイトル案を6件、1行ずつ出力してください。\n\n${ctx}` };
    case "jobs":
      return { sys, user: `次の記事末尾に置くと有効な「関連求人」の職種・条件の切り口を5件、1行ずつ出力してください。\n\n${ctx}` };
    case "guides":
      return { sys, user: `次の記事から誘導すべき特定技能ガイドのトピック案を5件、1行ずつ出力してください。\n\n${ctx}` };
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !isBiglight(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "AI未設定：ANTHROPIC_API_KEY を設定してください。" }, { status: 503 });

  const { action, article } = await req.json().catch(() => ({}));
  const p = build(String(action), (article as Record<string, unknown>) || {});
  if (!p) return NextResponse.json({ error: "未対応のアクション" }, { status: 400 });

  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: action === "improve" || action === "readability" ? 8000 : 1500,
      system: p.sys,
      messages: [{ role: "user", content: p.user }],
    });
    const text = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();

    if (p.json) {
      const m = text.match(/\{[\s\S]*\}/);
      let faqs: { q: string; a: string }[] = [];
      try { faqs = JSON.parse(m ? m[0] : text).faqs ?? []; } catch {}
      return NextResponse.json({ faqs });
    }
    return NextResponse.json({ text: text.replace(/^["「]|["」]$/g, "").trim() });
  } catch (e) {
    const msg = e instanceof Anthropic.APIError ? `AIエラー (${e.status})` : "AI呼び出しに失敗しました";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

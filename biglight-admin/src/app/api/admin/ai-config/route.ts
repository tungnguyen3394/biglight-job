import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/guard";
import { getAiConfig, aiKeyConfigured, buildJobContext } from "@/lib/ai";

export const dynamic = "force-dynamic";

// settings.* là Admin-only (Staff/View không có) → guard chỉ Admin qua được.
export async function GET() {
  const g = await guard("settings.view");
  if (!g.ok) return g.res;
  const c = await getAiConfig();
  // Chẩn đoán: AI đọc được gì từ DB (đúng bộ lọc PUBLIC + OPEN mà aiReply dùng).
  const jobCount = await prisma.job.count({ where: { publicStatus: "PUBLIC", status: "OPEN" } });
  const jobContext = await buildJobContext();
  return NextResponse.json({ config: { enabled: c.enabled, instructions: c.instructions, model: c.model }, keyConfigured: aiKeyConfigured(), jobCount, jobContext });
}

export async function PUT(req: Request) {
  const g = await guard("settings.update");
  if (!g.ok) return g.res;
  const b = await req.json().catch(() => ({}));
  const data: { enabled?: boolean; instructions?: string; model?: string } = {};
  if (typeof b.enabled === "boolean") data.enabled = b.enabled;
  if (typeof b.instructions === "string") data.instructions = b.instructions.slice(0, 8000);
  if (typeof b.model === "string" && b.model.trim()) data.model = b.model.trim();
  const c = await prisma.aiConfig.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
  return NextResponse.json({ ok: true, config: { enabled: c.enabled, instructions: c.instructions, model: c.model } });
}

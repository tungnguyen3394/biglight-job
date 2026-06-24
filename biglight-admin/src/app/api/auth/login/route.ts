import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie, isAllowedAdminEmail } from "@/lib/auth";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  if (!isAllowedAdminEmail(email)) {
    return NextResponse.json(
      { error: "BIGLIGHT（@biglight.jp）のメールアドレスのみログインできます" },
      { status: 403 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE" || !user.passwordHash) {
    return NextResponse.json({ error: "メールまたはパスワードが違います" }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "メールまたはパスワードが違います" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    ctvId: user.ctvId,
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role },
  });
}

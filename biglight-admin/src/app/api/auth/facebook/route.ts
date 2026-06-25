import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFacebookAccessToken } from "@/lib/facebook";
import { setSessionCookie, isAllowedAdminEmail } from "@/lib/auth";

// POST /api/auth/facebook  { accessToken }  — accessToken từ Facebook JS SDK
export async function POST(req: Request) {
  const { accessToken } = await req.json().catch(() => ({}));
  if (!accessToken) {
    return NextResponse.json({ error: "No access token" }, { status: 400 });
  }

  const payload = await verifyFacebookAccessToken(accessToken);
  if (!payload) {
    return NextResponse.json({ error: "Facebook認証に失敗しました" }, { status: 401 });
  }

  if (!payload.email || !isAllowedAdminEmail(payload.email)) {
    return NextResponse.json(
      { error: "BIGLIGHT（@biglight.jp）のメールアドレスのみログインできます" },
      { status: 403 }
    );
  }

  // Chỉ user đã được admin tạo sẵn mới đăng nhập được.
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "このメールアドレスのアカウントがありません。管理者にお問い合わせください。" },
      { status: 403 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { facebookId: payload.id, image: payload.picture ?? user.image, lastLoginAt: new Date() },
  });

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    ctvId: user.ctvId,
  });

  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
}

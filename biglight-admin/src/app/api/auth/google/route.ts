import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyGoogleIdToken } from "@/lib/google";
import { setSessionCookie, isAllowedAdminEmail } from "@/lib/auth";

// POST /api/auth/google  { credential }  — credential = Google ID token (GIS)
export async function POST(req: Request) {
  const { credential } = await req.json().catch(() => ({}));
  if (!credential) {
    return NextResponse.json({ error: "No credential" }, { status: 400 });
  }

  const payload = await verifyGoogleIdToken(credential);
  if (!payload) {
    return NextResponse.json({ error: "Google認証に失敗しました" }, { status: 401 });
  }

  if (!isAllowedAdminEmail(payload.email)) {
    return NextResponse.json(
      { error: "BIGLIGHT社内アカウントのみログインできます。" },
      { status: 403 }
    );
  }

  // Only pre-registered users may log in (admin creates accounts).
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "このメールアドレスのアカウントがありません。管理者にお問い合わせください。" },
      { status: 403 }
    );
  }

  // An toàn: tài khoản ứng viên (CANDIDATE) không được đăng nhập khu admin.
  if (user.role === "CANDIDATE") {
    return NextResponse.json(
      { error: "BIGLIGHT社内アカウントのみログインできます。" },
      { status: 403 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { googleId: payload.sub, image: payload.picture ?? null, lastLoginAt: new Date() },
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

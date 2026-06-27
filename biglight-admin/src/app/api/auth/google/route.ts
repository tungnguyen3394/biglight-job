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

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  // Ứng viên (CANDIDATE) không được đăng nhập khu admin.
  if (user && user.role === "CANDIDATE") {
    return NextResponse.json({ error: "BIGLIGHT社内アカウントのみログインできます。" }, { status: 403 });
  }
  // Tài khoản bị khoá.
  if (user && user.status !== "ACTIVE") {
    return NextResponse.json({ error: "このアカウントはロックされています。管理者にお問い合わせください。" }, { status: 403 });
  }

  if (!user) {
    // Tự tạo tài khoản cho BẤT KỲ nhân viên @biglight.jp lần đầu đăng nhập.
    // Mặc định cấp VIEW (chỉ xem) — Admin nâng quyền sau ở ユーザー管理.
    user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        role: "BIGLIGHT_STAFF",
        adminRole: "VIEW",
        status: "ACTIVE",
        googleId: payload.sub,
        image: payload.picture ?? null,
        lastLoginAt: new Date(),
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub, image: payload.picture ?? null, lastLoginAt: new Date() },
    });
  }

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    adminRole: user.adminRole,
    companyId: user.companyId,
    ctvId: user.ctvId,
  });

  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
}

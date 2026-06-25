import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

type Provider = {
  email?: string | null;
  name: string;
  picture?: string | null;
  googleId?: string;
  facebookId?: string;
};

// Tìm hoặc tạo tài khoản LAO ĐỘNG (role CANDIDATE) từ Google/Facebook, rồi set session.
// Định danh theo googleId/facebookId/email; Facebook không có email vẫn được (email tổng hợp).
export async function loginOrCreateCandidate(p: Provider) {
  let user =
    (p.googleId && (await prisma.user.findUnique({ where: { googleId: p.googleId } }))) ||
    (p.facebookId && (await prisma.user.findUnique({ where: { facebookId: p.facebookId } }))) ||
    (p.email && (await prisma.user.findUnique({ where: { email: p.email } }))) ||
    null;

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: p.googleId ?? user.googleId,
        facebookId: p.facebookId ?? user.facebookId,
        image: p.picture ?? user.image,
        lastLoginAt: new Date(),
      },
    });
  } else {
    const email =
      p.email ||
      (p.facebookId ? `fb-${p.facebookId}@fb.biglight.local` : `g-${p.googleId}@google.biglight.local`);
    user = await prisma.user.create({
      data: {
        name: p.name,
        email,
        role: "CANDIDATE",
        googleId: p.googleId ?? null,
        facebookId: p.facebookId ?? null,
        image: p.picture ?? null,
        lastLoginAt: new Date(),
      },
    });
  }

  // Đảm bảo có hồ sơ Candidate liên kết với tài khoản.
  const existing = await prisma.candidate.findUnique({ where: { userId: user.id } });
  if (!existing) {
    await prisma.candidate.create({
      data: { name: user.name, email: p.email ?? null, userId: user.id, status: "新規" },
    });
  }

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    ctvId: user.ctvId,
  });

  return user;
}

import { NextResponse } from "next/server";
import { verifyGoogleIdToken } from "@/lib/google";
import { loginOrCreateCandidate, CandidateAuthError } from "@/lib/candidateAuth";

// POST /api/auth/candidate/google { credential } — đăng nhập LAO ĐỘNG bằng Google (mọi email).
export async function POST(req: Request) {
  const { credential } = await req.json().catch(() => ({}));
  if (!credential) return NextResponse.json({ error: "No credential" }, { status: 400 });

  const payload = await verifyGoogleIdToken(credential);
  if (!payload) return NextResponse.json({ error: "Google認証に失敗しました" }, { status: 401 });

  try {
    const user = await loginOrCreateCandidate({
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      googleId: payload.sub,
    });
    return NextResponse.json({ user: { id: user.id, name: user.name } });
  } catch (e) {
    if (e instanceof CandidateAuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
}

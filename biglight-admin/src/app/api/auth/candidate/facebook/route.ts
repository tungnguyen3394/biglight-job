import { NextResponse } from "next/server";
import { verifyFacebookAccessToken } from "@/lib/facebook";
import { loginOrCreateCandidate } from "@/lib/candidateAuth";

// POST /api/auth/candidate/facebook { accessToken } — đăng nhập LAO ĐỘNG bằng Facebook.
export async function POST(req: Request) {
  const { accessToken } = await req.json().catch(() => ({}));
  if (!accessToken) return NextResponse.json({ error: "No access token" }, { status: 400 });

  const payload = await verifyFacebookAccessToken(accessToken);
  if (!payload) return NextResponse.json({ error: "Facebook認証に失敗しました" }, { status: 401 });

  const user = await loginOrCreateCandidate({
    email: payload.email ?? null,
    name: payload.name,
    picture: payload.picture,
    facebookId: payload.id,
  });
  return NextResponse.json({ user: { id: user.id, name: user.name } });
}

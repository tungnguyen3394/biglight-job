import { NextResponse } from "next/server";
import { verifyFacebookAccessToken } from "@/lib/facebook";
import { loginOrCreateCandidate } from "@/lib/candidateAuth";
import { attachSessionCookie } from "@/lib/auth";
import { PUBLIC_BASE_URL } from "@/lib/site";

const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// GET /api/auth/candidate/facebook/callback?code=... — Facebook redirect về đây.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "/mypage";
  const dest = state.startsWith("/") ? state : "/mypage";
  const fail = (e: string) => NextResponse.redirect(`${PUBLIC_BASE_URL}/mypage?fberror=${e}`);

  if (!code || !APP_ID || !APP_SECRET) return fail("config");

  const redirectUri = `${PUBLIC_BASE_URL}/api/auth/candidate/facebook/callback`;
  try {
    // 1) đổi code lấy access token
    const tokRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`
    );
    const tok = await tokRes.json();
    if (!tok?.access_token) return fail("token");

    // 2) xác thực + lấy hồ sơ
    const payload = await verifyFacebookAccessToken(tok.access_token);
    if (!payload) return fail("profile");

    // 3) tạo/đăng nhập tài khoản ứng viên + set session
    const user = await loginOrCreateCandidate({ email: payload.email ?? null, name: payload.name, picture: payload.picture, facebookId: payload.id });

    const res = NextResponse.redirect(`${PUBLIC_BASE_URL}${dest}`);
    await attachSessionCookie(res, user);
    return res;
  } catch {
    return fail("exception");
  }
}

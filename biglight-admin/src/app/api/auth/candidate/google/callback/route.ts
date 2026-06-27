import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { loginOrCreateCandidate, CandidateAuthError } from "@/lib/candidateAuth";
import { attachSessionCookie } from "@/lib/auth";
import { PUBLIC_BASE_URL } from "@/lib/site";

// GET /api/auth/candidate/google/callback?code=...&state=/... — Google redirect về đây.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "/mypage";
  const dest = state.startsWith("/") ? state : "/mypage";
  const fail = (e: string) => NextResponse.redirect(`${PUBLIC_BASE_URL}/mypage?gerror=${e}`);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!code || !clientId || !secret) return fail("config");

  const redirectUri = `${PUBLIC_BASE_URL}/api/auth/candidate/google/callback`;
  try {
    const oauth = new OAuth2Client(clientId, secret, redirectUri);
    const { tokens } = await oauth.getToken(code);
    if (!tokens.id_token) return fail("token");
    const ticket = await oauth.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const p = ticket.getPayload();
    if (!p?.email) return fail("profile");

    const user = await loginOrCreateCandidate({ email: p.email, name: p.name || p.email, picture: p.picture, googleId: p.sub });
    const res = NextResponse.redirect(`${PUBLIC_BASE_URL}${dest}`);
    await attachSessionCookie(res, user);
    return res;
  } catch (e) {
    if (e instanceof CandidateAuthError) return fail("admin");
    return fail("exception");
  }
}

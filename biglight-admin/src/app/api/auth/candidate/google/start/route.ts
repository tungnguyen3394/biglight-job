import { NextResponse } from "next/server";
import { PUBLIC_BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// GET /api/auth/candidate/google/start?redirect=/... — bắt đầu Google OAuth (redirect flow)
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(`${PUBLIC_BASE_URL}/mypage?gerror=config`);

  const url = new URL(req.url);
  const redirect = url.searchParams.get("redirect") || "/mypage";
  const redirectUri = `${PUBLIC_BASE_URL}/api/auth/candidate/google/callback`;

  const g = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  g.searchParams.set("client_id", clientId);
  g.searchParams.set("redirect_uri", redirectUri);
  g.searchParams.set("response_type", "code");
  g.searchParams.set("scope", "openid email profile");
  g.searchParams.set("prompt", "select_account");
  g.searchParams.set("state", redirect.startsWith("/") ? redirect : "/mypage");
  return NextResponse.redirect(g.toString());
}

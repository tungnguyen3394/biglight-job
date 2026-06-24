import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GooglePayload {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

/** Verify a Google ID token (from Google Identity Services) on the server. */
export async function verifyGoogleIdToken(idToken: string): Promise<GooglePayload | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p?.email || !p.email_verified) return null;
    return { email: p.email, name: p.name || p.email, picture: p.picture, sub: p.sub };
  } catch {
    return null;
  }
}

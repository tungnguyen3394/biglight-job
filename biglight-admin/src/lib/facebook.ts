// Xác thực access token của Facebook ở phía server (Facebook Login JS SDK).

const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

export interface FacebookPayload {
  email: string;
  name: string;
  picture?: string;
  id: string;
}

/** Verify a Facebook access token (from the JS SDK) and return the user profile. */
export async function verifyFacebookAccessToken(accessToken: string): Promise<FacebookPayload | null> {
  if (!accessToken) return null;
  try {
    // 1) Kiểm tra token thuộc đúng app của ta (chống token giả/từ app khác).
    if (APP_ID && APP_SECRET) {
      const appToken = `${APP_ID}|${APP_SECRET}`;
      const dbgRes = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`
      );
      const dbg = await dbgRes.json();
      const data = dbg?.data;
      if (!data?.is_valid || String(data.app_id) !== String(APP_ID)) return null;
    }

    // 2) Lấy thông tin hồ sơ (cần quyền "email").
    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`
    );
    const me = await meRes.json();
    if (!me?.email) return null;

    return {
      id: String(me.id),
      email: me.email,
      name: me.name || me.email,
      picture: me.picture?.data?.url,
    };
  } catch {
    return null;
  }
}

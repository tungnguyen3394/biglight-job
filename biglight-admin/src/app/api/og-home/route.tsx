import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // render lúc request, cache bằng header

// Ảnh Open Graph TRANG CHỦ: nền trắng + logo BIGLIGHT Smile (file gốc /public/logo3.png) ở giữa.
// Nhúng thẳng file PNG → ảnh nét (không bị mờ), 1200×630, hiển thị rõ khi share FB/LINE/Messenger.
let LOGO_URI = "";
try {
  const buf = readFileSync(join(process.cwd(), "public", "logo3.png"));
  LOGO_URI = `data:image/png;base64,${buf.toString("base64")}`;
} catch { /* nếu thiếu file vẫn trả nền trắng + chữ */ }

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {LOGO_URI ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={LOGO_URI} width={420} height={420} alt="BIGLIGHT" />
        ) : null}
        <div style={{ display: "flex", gap: 18, fontSize: 76, fontWeight: 900, letterSpacing: -2 }}>
          <span style={{ color: "#16181D" }}>BIGLIGHT</span>
          <span style={{ color: "#D02E26" }}>JOB</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=86400, immutable" } }
  );
}

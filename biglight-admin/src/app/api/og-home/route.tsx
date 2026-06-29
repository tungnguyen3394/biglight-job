import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // render lúc request, cache bằng header

// Ảnh Open Graph TRANG CHỦ: nền trắng + logo BIGLIGHT Smile ở giữa (1200×630).
// Chỉ chữ Latin → không cần nạp font tiếng Nhật. Hiển thị rõ khi share FB/LINE/Messenger.
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
          gap: 44,
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo BIGLIGHT Smile (giống Logo.tsx) */}
        <svg width="300" height="300" viewBox="0 0 120 120">
          <rect x="2" y="2" width="116" height="116" rx="30" fill="#ffffff" stroke="#ECECEC" strokeWidth="2" />
          <circle cx="47" cy="52" r="5" fill="#D02E26" />
          <path d="M66 52 A8 6 0 0 1 80 52" fill="none" stroke="#D02E26" strokeWidth="6" strokeLinecap="round" />
          <path d="M42 66 A22 22 0 0 0 78 66" fill="none" stroke="#D02E26" strokeWidth="8" strokeLinecap="round" />
        </svg>

        <div style={{ display: "flex", gap: 20, fontSize: 88, fontWeight: 900, letterSpacing: -2 }}>
          <span style={{ color: "#16181D" }}>BIGLIGHT</span>
          <span style={{ color: "#D02E26" }}>JOB</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#6B7280" }}>job.biglight.jp</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=86400, immutable" } }
  );
}

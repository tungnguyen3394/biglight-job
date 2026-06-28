import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // render lúc request, cache bằng header (tránh prerender lúc build)

// Ảnh Open Graph thương hiệu mặc định (1200×630). Chỉ chữ Latin → không cần font Nhật.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #FFF6F2 0%, #FFE7DF 55%, #FFD9CC 100%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ width: 104, height: 104, borderRadius: 26, background: "#D02E26", color: "#fff", fontSize: 68, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>B</div>
          <div style={{ display: "flex", gap: 14, fontSize: 58, fontWeight: 900 }}>
            <span style={{ color: "#16181D" }}>BIGLIGHT</span>
            <span style={{ color: "#D02E26" }}>JOB</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 70, fontWeight: 900, color: "#16181D", lineHeight: 1.05 }}>Tokutei Ginou Jobs in Japan</div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: "#6B7280" }}>For foreign talent · Dormitory · Visa support · Free</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {["Manufacturing", "Construction", "Care", "Food", "Agriculture"].map((t) => (
              <div key={t} style={{ display: "flex", background: "#ffffffcc", color: "#D02E26", fontSize: 22, fontWeight: 700, padding: "8px 16px", borderRadius: 999 }}>{t}</div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: "#D02E26" }}>job.biglight.jp</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=86400, immutable" } }
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt     = "askaisl — AI Consumer Research Interviews";
export const size    = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #0d0d0f 0%, #111827 100%)",
          padding: 80,
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
          {/* Simple "A" mark */}
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#0d0d0f" }}>A</span>
          </div>
          <span style={{ fontSize: 52, fontWeight: 500, color: "white", letterSpacing: "-1px" }}>askaisl</span>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: 56, fontWeight: 700, color: "white",
          textAlign: "center", lineHeight: 1.15,
          letterSpacing: "-1.5px", marginBottom: 28, maxWidth: 900,
        }}>
          AI Consumer Research Interviews
        </div>

        {/* Subtext */}
        <div style={{
          fontSize: 26, color: "rgba(255,255,255,0.55)",
          textAlign: "center", maxWidth: 760, lineHeight: 1.5,
          marginBottom: 52,
        }}>
          Trilingual · English, Sinhala &amp; Tamil · FMCG brands · Sri Lanka
        </div>

        {/* Pill badges */}
        <div style={{ display: "flex", gap: 16 }}>
          {["24/7 Available", "No Recruiter Needed", "Instant Insights"].map(t => (
            <div key={t} style={{
              padding: "12px 24px", borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.75)", fontSize: 20,
            }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

const HEADERS = ["", "vinterview", "Human moderator", "Survey form"];

const ROWS = [
  ["Available 24/7",                  "✓", "✗", "✓"],
  ["Adaptive follow-up questions",    "✓", "✓", "✗"],
  ["Consistent interview quality",    "✓", "✗", "✓"],
  ["Qualitative depth of insights",   "✓", "✓", "✗"],
  ["Instant research report",         "✓", "✗", "✗"],
  ["Trilingual support",              "✓", "✗", "✓"],
  ["Free to start",                   "✓", "✗", "✓"],
];

export default function ComparisonTable() {
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 52px" }}>
      <div style={{ fontSize: 12, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 20 }}>Why vinterview</div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(34px, 3.5vw, 52px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        Not all research<br /><em style={{ fontStyle: "italic" }}>is equal</em>
      </h2>

      <div style={{ marginTop: 56, border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
          {HEADERS.map((h, i) => (
            <div key={i} style={{ padding: "18px 24px", fontSize: 13, fontWeight: 600, letterSpacing: "0.01em", borderRight: i < 3 ? "1px solid var(--border)" : "none", background: i === 1 ? "var(--inv)" : "inherit", color: i === 1 ? "var(--inv-txt)" : "var(--txt)" }}>{h}</div>
          ))}
        </div>

        {/* Data rows */}
        {ROWS.map(([feature, ...cells], ri) => (
          <div key={ri} className="vt-compare-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderBottom: ri < ROWS.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ padding: "16px 24px", fontSize: 14, fontWeight: 400, borderRight: "1px solid var(--border)", color: "var(--txt)" }}>{feature}</div>
            {cells.map((c, ci) => (
              <div key={ci} style={{ padding: "16px 24px", fontSize: 16, borderRight: ci < 2 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", background: ci === 0 ? "color-mix(in srgb, var(--inv) 3%, transparent)" : "inherit", color: c === "✓" ? "var(--txt)" : "var(--txt3)" }}>{c}</div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border)", marginTop: 100 }} />
    </section>
  );
}

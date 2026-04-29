const ITEMS = [
  "Behavioral Research", "Brand Perception", "Decision Journey",
  "Pain Point Discovery", "Concept Testing", "Voice Interviews",
  "Sinhala Support", "Tamil Support", "Auto Reports", "CSV Export",
];

const DOUBLED = [...ITEMS, ...ITEMS];

export default function MarqueeStrip() {
  return (
    <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "16px 0", overflow: "hidden", position: "relative", background: "var(--bg2)" }}>
      <div style={{ display: "flex", gap: 0, animation: "marquee 22s linear infinite", width: "max-content" }}>
        {DOUBLED.map((item, i) => (
          <div key={i} style={{ padding: "0 40px", fontSize: 13, color: "var(--txt3)", fontWeight: 500, letterSpacing: "0.02em", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 10 }}>
            {item}
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border2)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

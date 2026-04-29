import Link from "next/link";

const TYPES = [
  {
    name: "Behavioral",
    label: "Habits · Usage",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M14.5 11v6M11.5 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Decision Journey",
    label: "Choice · Drivers",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 14l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    name: "Pain Points",
    label: "Frustrations · Needs",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 18c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Perception",
    label: "Brand · Trust",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2.4 5H18l-4.5 3.3 1.7 5.2L10 12.5 4.8 15.5l1.7-5.2L2 7h5.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Concept Testing",
    label: "Ideas · Reactions",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 5V4a1 1 0 011-1h4a1 1 0 011 1v1M10 9v4M8 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function InterviewTypesSection() {
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 52px" }}>
      <div style={{ fontSize: 12, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 20 }}>Research frameworks</div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(34px, 3.5vw, 52px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        Every research objective,<br /><em style={{ fontStyle: "italic" }}>covered</em>
      </h2>
      <p style={{ fontSize: 16, color: "var(--txt2)", fontWeight: 300, lineHeight: 1.7, maxWidth: 520, marginTop: 12 }}>
        Mrs Dissanayake adapts her interview approach entirely based on your research objective.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 52 }}>
        {TYPES.map(({ name, label, icon }) => (
          <Link
            key={name}
            href="/chat"
            className="vt-type-card"
            style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "28px 20px", background: "var(--bg)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
          >
            <div className="vt-type-icon" style={{ width: 44, height: 44, borderRadius: 11, background: "var(--bg2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {icon}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{name}</div>
            <div className="vt-type-label" style={{ fontSize: 12, color: "var(--txt3)" }}>{label}</div>
          </Link>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border)", marginTop: 100 }} />
    </section>
  );
}

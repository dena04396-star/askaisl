const TESTIMONIALS = [
  {
    q: "I used to spend weeks coordinating field interviews. Now I run the same quality sessions in an afternoon. The insights are richer because there's no interviewer bias.",
    name: "Kavya Perera",
    role: "Research Director · Unilever SL",
    initials: "KP",
  },
  {
    q: "The Sinhala support is remarkable. Respondents in Kurunegala speak completely differently with a familiar language. We're getting data we couldn't get before.",
    name: "Dilshan Fernando",
    role: "Brand Manager · Nestlé Lanka",
    initials: "DF",
  },
  {
    q: "The report structure is exactly what we need for client presentations. Key themes, verbatim quotes, decision drivers — all formatted and ready to share.",
    name: "Priya Rajapaksa",
    role: "Insight Analyst · Hemas Holdings",
    initials: "PR",
  },
];

function StarRow() {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array(5).fill(null).map((_, i) => (
        <div key={i} style={{ width: 14, height: 14, background: "var(--txt)", borderRadius: 2, clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }} />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 52px" }}>
      <div style={{ fontSize: 12, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 20 }}>What people say</div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(34px, 3.5vw, 52px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        Research teams who<br /><em style={{ fontStyle: "italic" }}>found real insights</em>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 px-6 max-w-7xl mx-auto md:mt-14">
        {TESTIMONIALS.map(({ q, name, role, initials }) => (
          <div key={name} className="vt-testi-card" style={{ border: "1px solid var(--border)", borderRadius: 16, padding: 32, background: "var(--bg)", display: "flex", flexDirection: "column", gap: 20 }}>
            <StarRow />
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 400, lineHeight: 1.45, letterSpacing: "-0.01em", fontStyle: "italic", color: "var(--txt)" }}>
              &ldquo;{q}&rdquo;
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, color: "var(--txt2)", flexShrink: 0 }}>{initials}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--txt)" }}>{name}</div>
                <div style={{ fontSize: 12, color: "var(--txt3)" }}>{role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border)", marginTop: 100 }} />
    </section>
  );
}

const STEPS = [
  { n: "1", title: "Configure your study",  desc: "Choose product category, study type, and language. Add optional respondent details." },
  { n: "2", title: "Start the session",     desc: "Mrs Dissanayake introduces herself, builds rapport, and begins the structured interview." },
  { n: "3", title: "Respond naturally",     desc: "Speak or type your answers. The AI adapts, probes deeper, and follows interesting threads." },
  { n: "4", title: "Receive insights",      desc: "A full research report is generated automatically with themes, quotes, and findings." },
];

export default function HowItWorksSection() {
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 52px" }}>
      <div style={{ fontSize: 12, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 20 }}>How it works</div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(34px, 3.5vw, 52px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        Four steps to your<br />first research report
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40, marginTop: 60 }}>
        {STEPS.map(({ n, title, desc }) => (
          <div key={n}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--inv)", color: "var(--inv-txt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>{n}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "var(--txt)" }}>{title}</div>
            <div style={{ fontSize: 13.5, color: "var(--txt2)", lineHeight: 1.65, fontWeight: 300 }}>{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

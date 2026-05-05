const FEATURES = [
  {
    num: "01",
    title: "AI Interviewer",
    desc: "Mrs Dissanayake follows structured discussion guides and probes deeper based on every response — just like a real senior moderator.",
  },
  {
    num: "02",
    title: "Voice Interaction",
    desc: "Speak naturally in English, Sinhala, or Tamil. ElevenLabs TTS responds immediately. Respondents never feel like they're filling a form.",
  },
  {
    num: "03",
    title: "Instant Reports",
    desc: "Every session ends with a research-grade summary: key themes, pain points, decision drivers, and verbatim quotes — automatically.",
  },
];

export default function FeaturesSection() {
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 52px" }}>
      <div style={{ fontSize: 12, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 20 }}>What we offer</div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(34px, 3.5vw, 52px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        Everything you need for<br /><em style={{ fontStyle: "italic" }}>real consumer research</em>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px mt-10 md:mt-16 bg-[var(--border)] border border-[var(--border)] overflow-hidden rounded-2xl">
        {FEATURES.map(({ num, title, desc }) => (
          <div key={num} className="vt-feat-card" style={{ background: "var(--bg)", padding: "40px 36px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 12, color: "var(--txt3)", fontWeight: 600, letterSpacing: "0.08em" }}>{num}</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500, color: "var(--txt)" }}>{title}</div>
            <div style={{ fontSize: 14, color: "var(--txt2)", lineHeight: 1.7, fontWeight: 300 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border)", marginTop: 100 }} />
    </section>
  );
}

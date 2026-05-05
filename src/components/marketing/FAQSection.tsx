const FAQS = [
  {
    q: "Do respondents need to download anything?",
    a: "No. Askaisl runs entirely in the browser. Respondents just visit the link — no app, no signup, no friction.",
  },
  {
    q: "Which languages are supported?",
    a: "English, Sinhala (සිංහල), and Tamil (தமிழ்). Language is chosen per session so you can run multilingual fieldwork from the same platform.",
  },
  {
    q: "How does voice input work?",
    a: "Push-to-talk via the microphone button. The browser transcribes the answer. Mrs Dissanayake responds via ElevenLabs text-to-speech with natural intonation.",
  },
  {
    q: "What study types are supported?",
    a: "Behavioral, Decision Journey, Pain Points, Brand Perception, and Concept Testing. Each framework changes how Mrs Dissanayake probes and follows up.",
  },
  {
    q: "How do I get the data out?",
    a: "Every interview generates a full transcript and a structured summary report. Use Export CSV to download a transcript that opens directly in Excel.",
  },
];

export default function FAQSection() {
  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "100px 52px" }}>
      <div style={{ fontSize: 12, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 20, textAlign: "center" }}>Questions</div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(34px, 3.5vw, 52px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em", textAlign: "center", marginBottom: 52 }}>
        Everything you<br /><em style={{ fontStyle: "italic" }}>might be wondering</em>
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {FAQS.map(({ q, a }, i) => (
          <div key={q} className="vt-faq-item" style={{ padding: "24px 28px", borderBottom: i < FAQS.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: "var(--txt)" }}>{q}</div>
            <div style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, lineHeight: 1.65 }}>{a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

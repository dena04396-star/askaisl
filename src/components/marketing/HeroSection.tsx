import Link from "next/link";

function HeroVisual() {
  const wvHeights = [5, 10, 14, 10, 5, 9];
  return (
    <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "4/3", background: "var(--bg2)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden", borderRadius: "inherit" }}>

        {/* Left: avatar panel */}
        <div style={{ background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 55% at 50% 65%,var(--bg3) 0%,transparent 70%)", pointerEvents: "none" }} />

          {/* Topbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg)", position: "relative", zIndex: 1, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.22)" }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#16a34a", animation: "blink 1.6s infinite" }} />
                <span style={{ fontSize: 8.5, fontWeight: 700, color: "#16a34a", letterSpacing: "0.07em" }}>LIVE</span>
              </div>
              <span style={{ fontSize: 9.5, color: "var(--txt3)" }}>04:32</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg2)" }} />
              <div style={{ width: 18, height: 18, borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg2)" }} />
            </div>
          </div>

          {/* Avatar stage */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "1px solid var(--border2)", animation: "breathe 3s ease-in-out infinite" }} />
                <div style={{ position: "absolute", inset: -26, borderRadius: "50%", border: "1px solid var(--border)", animation: "breathe 3.6s ease-in-out infinite 0.5s", opacity: 0.4 }} />
                <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--bg)", border: "1.5px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden", position: "relative" }}>
                  <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
                    <ellipse cx="27" cy="52" rx="16" ry="7" fill="var(--bg3)" opacity="0.6" />
                    <rect x="22.5" y="42" width="7" height="7" rx="1.5" fill="var(--txt3)" opacity="0.4" />
                    <ellipse cx="27" cy="30" rx="14" ry="15" fill="var(--txt3)" opacity="0.5" />
                    <ellipse cx="27" cy="16" rx="14" ry="7" fill="var(--border2)" opacity="0.9" />
                    <ellipse cx="14" cy="26" rx="3" ry="8" fill="var(--border2)" opacity="0.8" />
                    <ellipse cx="40" cy="26" rx="3" ry="8" fill="var(--border2)" opacity="0.8" />
                    <ellipse cx="20" cy="29" rx="3" ry="3.2" fill="var(--txt)" />
                    <ellipse cx="34" cy="29" rx="3" ry="3.2" fill="var(--txt)" />
                    <circle cx="21" cy="28" r="1" fill="var(--bg)" opacity="0.5" />
                    <circle cx="35" cy="28" r="1" fill="var(--bg)" opacity="0.5" />
                    <path d="M17 25 Q20 23 23 25" stroke="var(--border2)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <path d="M31 25 Q34 23 37 25" stroke="var(--border2)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <path d="M23 40 Q27 43 31 40" stroke="var(--border2)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--txt)" }}>Mrs Dissanayake</div>
                <div style={{ fontSize: 9.5, color: "var(--txt2)", fontWeight: 300, marginTop: 1 }}>Senior Interviewer</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2, height: 14 }}>
                {wvHeights.map((h, i) => (
                  <div key={i} style={{ width: 2.5, borderRadius: 2, background: "var(--txt2)", height: h, animation: `wv 0.9s ease-in-out infinite ${i * 0.1}s` }} />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "var(--bg)", border: "1px solid var(--border)", fontSize: 9.5, color: "var(--txt2)" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a" }} />
                Speaking
              </div>
            </div>
          </div>
        </div>

        {/* Right: chat panel */}
        <div style={{ display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--txt)" }}>Transcript</div>
            <div style={{ fontSize: 9, color: "var(--txt3)", marginTop: 1 }}>English · Behavioral</div>
          </div>
          <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 5, overflow: "hidden" }}>
            <div style={{ fontSize: 8.5, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 8px" }}>Mrs Dissanayake</div>
            <div style={{ padding: "8px 10px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 9, borderBottomLeftRadius: 2, fontSize: 10, lineHeight: 1.5, color: "var(--txt)", fontWeight: 300, maxWidth: "92%" }}>Can you walk me through the last time you bought this product?</div>
            <div style={{ fontSize: 8.5, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 8px", marginTop: 3 }}>You</div>
            <div style={{ padding: "8px 10px", background: "var(--inv)", borderRadius: 9, borderBottomRightRadius: 2, fontSize: 10, lineHeight: 1.5, color: "var(--inv-txt)", fontWeight: 300, maxWidth: "92%", alignSelf: "flex-end" }}>I usually buy it at the supermarket when I see it on promotion.</div>
            <div style={{ fontSize: 8.5, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 8px", marginTop: 3 }}>Mrs Dissanayake</div>
            <div style={{ display: "flex", gap: 3, alignItems: "center", padding: "7px 10px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 9, borderBottomLeftRadius: 2, width: "fit-content" }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--txt3)", animation: "td 1.2s ease-in-out infinite 0s" }} />
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--txt3)", animation: "td 1.2s ease-in-out infinite 0.2s" }} />
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--txt3)", animation: "td 1.2s ease-in-out infinite 0.4s" }} />
            </div>
          </div>
          <div style={{ padding: 9, borderTop: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 8px 6px 11px" }}>
              <div style={{ flex: 1, fontSize: 9.5, color: "var(--txt3)" }}>Type your response…</div>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--bg3)", border: "1px solid var(--border)", flexShrink: 0 }} />
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--inv)", flexShrink: 0 }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const AVATARS = ["R", "A", "P", "J"];

export default function HeroSection() {
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 52px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 99, border: "1px solid var(--border2)", fontSize: 12.5, color: "var(--txt2)", marginBottom: 28 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a", animation: "blink 2s ease-in-out infinite" }} />
          Now in private beta
        </div>

        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(46px, 5vw, 72px)", fontWeight: 400, lineHeight: 1.06, letterSpacing: "-0.025em", marginBottom: 22 }}>
          Consumer research<br />interviews that <em style={{ fontStyle: "italic" }}>feel real</em>
        </h1>

        <p style={{ fontSize: 16.5, color: "var(--txt2)", fontWeight: 300, lineHeight: 1.72, marginBottom: 40, maxWidth: 430 }}>
          Meet Mrs Dissanayake — your AI market research interviewer. Adaptive, trilingual, and available 24/7. Real questions, real insights, real research.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
          <Link href="/chat" className="vt-btn-solid vt-btn-lg">
            Start Interview
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <button className="vt-btn-ghost vt-btn-lg">See how it works</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--txt3)" }}>
          <div style={{ display: "flex" }}>
            {AVATARS.map((l, i) => (
              <div key={l} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--bg)", background: "var(--bg3)", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "var(--txt2)" }}>{l}</div>
            ))}
          </div>
          <span>Trusted by 2,400+ research teams</span>
        </div>
      </div>

      <HeroVisual />
    </section>
  );
}

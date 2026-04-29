import Link from "next/link";

export default function CTABanner() {
  return (
    <section style={{ padding: "0 52px 100px" }}>
      <div style={{ borderRadius: 20, background: "var(--inv)", color: "var(--inv-txt)", padding: "80px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 500 }}>
          Ready to uncover<br /><em style={{ fontStyle: "italic" }}>real consumer insights?</em>
        </h2>
        <Link href="/chat" className="vt-btn-banner">
          Start for free
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>
    </section>
  );
}

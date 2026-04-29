import Link from "next/link";

function LogoMark() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--inv)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const COLS = [
  { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
  { title: "Legal",   links: ["Privacy", "Terms", "Security"] },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "60px 52px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 60, marginBottom: 60 }}>
        <div>
          <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 500, color: "var(--txt)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <LogoMark /> vinterview
          </Link>
          <p style={{ fontSize: 13.5, color: "var(--txt2)", lineHeight: 1.7, fontWeight: 300, maxWidth: 240 }}>
            AI-powered consumer research interviews for FMCG brands in Sri Lanka.
          </p>
        </div>

        {COLS.map(({ title, links }) => (
          <div key={title}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--txt3)", marginBottom: 16 }}>{title}</div>
            {links.map((l) => (
              <a key={l} href="#" className="vt-footer-link">{l}</a>
            ))}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: "var(--txt3)" }}>
        <span>© 2026 vinterview, Inc. All rights reserved.</span>
        <span>Made with care for research teams worldwide.</span>
      </div>
    </footer>
  );
}

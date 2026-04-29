"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/auth/client";

function LogoMark() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--inv)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await getBrowserClient().auth.signOut();
    router.push("/");
  }

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 52px", height: 62 }}>
      <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: 21, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--txt)", textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}>
        <LogoMark /> vinterview
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button className="vt-nav-link">Product</button>
        <button className="vt-nav-link">Pricing</button>
        <button className="vt-nav-link">Blog</button>
      </nav>

      {/* Fixed-width container prevents layout shift while loading */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200, justifyContent: "flex-end" }}>
        {loading ? (
          <div style={{ width: 200, height: 34 }} />
        ) : user ? (
          <>
            <Link href="/dashboard" className="vt-btn-ghost">Dashboard</Link>
            <button className="vt-btn-solid" onClick={handleSignOut}>Sign out</button>
          </>
        ) : (
          <>
            <Link href="/login" className="vt-btn-ghost">Sign in</Link>
            <Link href="/signup" className="vt-btn-solid">Get started</Link>
          </>
        )}
      </div>
    </header>
  );
}

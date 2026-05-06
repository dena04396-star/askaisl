"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/auth/client";

import Image from "next/image";

function LogoMark() {
  return (
    <div className="w-5.5 h-5.5 rounded-md flex items-center justify-center shrink-0">
      <Image src="/logo.png" alt="askaisl logo" width={34} height={34} className="object-contain" />
    </div>
  );
}

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await getBrowserClient().auth.signOut();
    router.push("/");
    setMenuOpen(false);
  }

  const navLinks = [
    { label: "Product", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "Blog", href: "#" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between px-5 md:px-12 h-15.5 max-w-300 mx-auto">

        {/* Logo */}
        <Link href="/"
          className="flex items-center gap-2 no-underline font-medium text-xl"
          style={{ fontFamily: "var(--font-serif)", color: "var(--txt)" }}
          onClick={() => setMenuOpen(false)}
        >
          <LogoMark /> askaisl
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, href }) => (
            <Link key={label} href={href} className="vt-nav-link">{label}</Link>
          ))}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          {loading ? (
            <div className="w-45 h-9" />
          ) : user ? (
            <>
              <Link href="/dashboard" className="vt-btn-ghost">Dashboard</Link>
              <button className="vt-btn-solid" onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="vt-btn-ghost">Sign in</Link>
              <Link href="/login" className="vt-btn-solid">Get started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border"
          style={{ background: "var(--bg2)", borderColor: "var(--border)", color: "var(--txt2)" }}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t px-5 py-4 flex flex-col gap-1"
          style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          {navLinks.map(({ label, href }) => (
            <Link key={label} href={href} className="vt-nav-link w-full text-left py-3"
              onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
          <div className="h-px my-2" style={{ background: "var(--border)" }} />
          {!loading && (
            user ? (
              <>
                <Link href="/dashboard" className="vt-btn-ghost w-full justify-center"
                  onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button className="vt-btn-solid w-full justify-center" onClick={handleSignOut}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="vt-btn-ghost w-full justify-center"
                  onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link href="/login" className="vt-btn-solid w-full justify-center"
                  onClick={() => setMenuOpen(false)}>Get started</Link>
              </>
            )
          )}
        </div>
      )}
    </header>
  );
}

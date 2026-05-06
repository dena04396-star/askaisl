"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/auth/client";
import { useAuth } from "@/components/auth/AuthProvider";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", background: "var(--bg2)", color: "var(--txt)",
  border: "1px solid var(--border)", borderRadius: 10, fontSize: 14.5, outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");
  const [busy,    setBusy]    = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await getBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("rate") || msg.includes("limit") || msg.includes("too many"))
        setError("Too many requests — please wait a few minutes before trying again.");
      else if (msg.includes("invalid") || msg.includes("not allowed"))
        setError("This email address is not allowed. Please use a different one.");
      else
        setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginBottom: 40, justifyContent: "center" }}>
          <Image src="/logo.png" alt="askaisl" width={40} height={40} style={{ objectFit: "contain" }} />
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--txt)" }}>askaisl</span>
        </Link>

        <div style={{ padding: "40px", border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg)", boxShadow: "var(--shadow-lg)" }}>

          {sent ? (
            /* ── Sent state ── */
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>
                ✉
              </div>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--txt)", marginBottom: 10 }}>
                Check your email
              </h1>
              <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, lineHeight: 1.7, marginBottom: 16 }}>
                We sent a magic link to <strong style={{ color: "var(--txt)", fontWeight: 500 }}>{email}</strong>. Click it to sign in — no password needed.
              </p>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", fontSize: 13, color: "#ca8a04", marginBottom: 24, textAlign: "left", lineHeight: 1.6 }}>
                Can&apos;t find it? Check your <strong>Spam / Junk</strong> folder. Free accounts are limited to 3 emails per hour — if you&apos;ve tried recently, wait a few minutes.
              </div>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                style={{ fontSize: 13.5, color: "var(--txt2)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 8, color: "var(--txt)" }}>
                Sign in
              </h1>
              <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, marginBottom: 32 }}>
                Enter your email and we&apos;ll send you a magic link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--txt2)", marginBottom: 8 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--txt)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {error && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13.5, color: "#ef4444" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  style={{ width: "100%", padding: 13, borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: busy ? "not-allowed" : "pointer", border: "none", background: "var(--inv)", color: "var(--inv-txt)", opacity: busy ? 0.65 : 1, transition: "opacity 0.15s", fontFamily: "inherit", marginTop: 4 }}
                >
                  {busy ? "Sending…" : "Send magic link"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: 24, fontSize: 12.5, color: "var(--txt3)", lineHeight: 1.6 }}>
                No account needed — entering your email creates one automatically.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

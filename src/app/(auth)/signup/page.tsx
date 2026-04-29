"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/auth/client";
import { useAuth } from "@/components/auth/AuthProvider";

function LogoMark() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--inv)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", background: "var(--bg2)", color: "var(--txt)",
  border: "1px solid var(--border)", borderRadius: 10, fontSize: 14.5, outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [message,  setMessage]  = useState("");
  const [busy,     setBusy]     = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setBusy(true);
    const { error, data } = await getBrowserClient().auth.signUp({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (data.session) { router.replace("/dashboard"); return; }
    setMessage("Check your email to confirm your account, then sign in.");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Brand */}
        <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--txt)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginBottom: 40, justifyContent: "center" }}>
          <LogoMark /> vinterview
        </Link>

        {/* Card */}
        <div style={{ padding: "40px", border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg)", boxShadow: "var(--shadow-lg)" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 8, color: "var(--txt)" }}>
            Create account
          </h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, marginBottom: 32 }}>
            Start running AI-powered research interviews.
          </p>

          {message ? (
            <div style={{ padding: "16px 18px", borderRadius: 10, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", fontSize: 14, color: "#16a34a", lineHeight: 1.6, marginBottom: 16 }}>
              {message}
              <div style={{ marginTop: 12 }}>
                <Link href="/login" style={{ color: "inherit", fontWeight: 600, textDecoration: "underline" }}>
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--txt2)", marginBottom: 8 }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--txt)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--txt2)", marginBottom: 8 }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 6 characters" style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--txt)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--txt2)", marginBottom: 8 }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="••••••••" style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--txt)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13.5, color: "#ef4444" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={busy}
                style={{ width: "100%", padding: 13, borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: busy ? "not-allowed" : "pointer", border: "none", background: "var(--inv)", color: "var(--inv-txt)", opacity: busy ? 0.65 : 1, transition: "all 0.15s", fontFamily: "inherit", marginTop: 4 }}
              >
                {busy ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          {!message && (
            <p style={{ textAlign: "center", marginTop: 24, fontSize: 13.5, color: "var(--txt3)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--txt)", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid var(--border2)" }}>
                Sign in
              </Link>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

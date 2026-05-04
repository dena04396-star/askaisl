"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router  = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [token,   setToken]   = useState("");
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (res.ok) {
        router.replace("/admin");
      } else {
        const { error: msg } = await res.json().catch(() => ({ error: "Invalid token" }));
        setError(msg || "Invalid token");
        setToken("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "24px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        padding: "40px 36px", borderRadius: 20,
        border: "1px solid var(--border)", background: "var(--bg2)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14, marginBottom: 24,
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ShieldCheck size={24} color="#6366f1" />
        </div>

        <h1 style={{
          fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400,
          color: "var(--txt)", marginBottom: 6, letterSpacing: "-0.02em",
        }}>
          Admin Access
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--txt3)", marginBottom: 32, lineHeight: 1.5 }}>
          Enter your admin secret token to continue.
        </p>

        <form onSubmit={submit}>
          <label style={{
            display: "block", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em",
            color: "var(--txt2)", marginBottom: 8,
          }}>
            Secret Token
          </label>

          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Enter your admin token"
              autoFocus
              autoComplete="current-password"
              style={{
                width: "100%", padding: "12px 44px 12px 14px",
                borderRadius: 10, fontSize: 14, outline: "none",
                border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "var(--border)"}`,
                background: "var(--bg)", color: "var(--txt)",
                fontFamily: "inherit", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e  => { if (!error) e.currentTarget.style.borderColor = "var(--txt)"; }}
              onBlur={e   => { if (!error) e.currentTarget.style.borderColor = "var(--border)"; }}
            />
            <button
              type="button" onClick={() => setShow(v => !v)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--txt3)", padding: 0, display: "flex",
              }}
              tabIndex={-1}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p style={{
              fontSize: 12.5, color: "#ef4444", marginBottom: 16,
              padding: "8px 12px", borderRadius: 8,
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)",
            }}>
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading || !token.trim()}
            style={{
              width: "100%", padding: "12px", borderRadius: 10,
              fontSize: 14.5, fontWeight: 600, border: "none",
              background: loading || !token.trim() ? "var(--bg3)" : "var(--inv)",
              color:      loading || !token.trim() ? "var(--txt3)" : "var(--inv-txt)",
              cursor:     loading || !token.trim() ? "default" : "pointer",
              fontFamily: "inherit", transition: "background 0.15s, color 0.15s",
            }}
          >
            {loading ? "Verifying…" : "Access Admin Panel"}
          </button>
        </form>

        <p style={{ fontSize: 11.5, color: "var(--txt3)", textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
          The admin token is set in your server environment.<br />
          Contact your system administrator if you need access.
        </p>
      </div>
    </div>
  );
}

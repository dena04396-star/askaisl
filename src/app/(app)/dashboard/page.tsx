"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Plus, X, ExternalLink } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/auth/client";
import { formatDate } from "@/lib/utils/helpers";
import type { TranscriptEntry, SessionRow, StudyType, Locale } from "@/types";

const STUDY_OPTIONS: { id: StudyType; label: string }[] = [
  { id: "behavioral",       label: "Behavioral"      },
  { id: "decision_journey", label: "Decision Journey" },
  { id: "pain_points",      label: "Pain Points"      },
  { id: "perception",       label: "Perception"       },
  { id: "concept_testing",  label: "Concept Testing"  },
];

const LOCALES: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "si", label: "සිංහල"  },
  { id: "ta", label: "தமிழ்"  },
];

function generateToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  }
  return Math.random().toString(36).slice(2, 22);
}

function LogoMark() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--inv)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Dots() {
  return (
    <div style={{ padding: "60px 0", display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <span className="td" /><span className="td td-2" /><span className="td td-3" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  /* ── Sessions state ── */
  const [sessions,        setSessions]        = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showCreate,      setShowCreate]      = useState(false);
  const [copiedToken,     setCopiedToken]     = useState<string | null>(null);

  /* ── Create-form state ── */
  const [title,       setTitle]       = useState("");
  const [product,     setProduct]     = useState("");
  const [studyType,   setStudyType]   = useState<StudyType>("behavioral");
  const [language,    setLanguage]    = useState<Locale>("en");
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState("");

  /* ── Transcripts state ── */
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [txLoading,   setTxLoading]   = useState(true);
  const [selected,    setSelected]    = useState<TranscriptEntry | null>(null);

  useEffect(() => {
    if (!user) return;
    getBrowserClient()
      .from("interview_sessions")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSessions((data ?? []) as SessionRow[]);
        setSessionsLoading(false);
      });
  }, [user]);

  useEffect(() => {
    fetch("/api/transcript")
      .then((r) => r.json())
      .then(({ transcripts }) => setTranscripts(transcripts ?? []))
      .catch(console.error)
      .finally(() => setTxLoading(false));
  }, []);

  function resetCreate() {
    setTitle(""); setProduct(""); setStudyType("behavioral");
    setLanguage("en"); setCreateError(""); setShowCreate(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !product.trim()) return;
    setCreating(true); setCreateError("");
    const token = generateToken();
    const { data, error } = await getBrowserClient()
      .from("interview_sessions")
      .insert({
        token,
        title:            title.trim() || `${product.trim()} Study`,
        study_type:       studyType,
        language,
        product_category: product.trim(),
        created_by:       user.id,
        status:           "active",
      })
      .select()
      .single();
    setCreating(false);
    if (error) { setCreateError(error.message); return; }
    setSessions((prev) => [data as SessionRow, ...prev]);
    resetCreate();
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/session/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const inputSm: React.CSSProperties = {
    width: "100%", padding: "10px 13px", background: "var(--bg)", color: "var(--txt)",
    border: "1px solid var(--border)", borderRadius: 9, fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--txt)" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 52px", height: 62 }}>
        <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--txt)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark /> vinterview
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--txt3)" }}>{user?.email}</span>
          <button onClick={signOut} className="vt-btn-ghost" style={{ padding: "7px 16px", fontSize: 13 }}>
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 52px" }}>

        {/* ── Sessions ── */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, color: "var(--txt)" }}>
                Interview Sessions
              </h1>
              <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, marginTop: 8 }}>
                Create a session and send the link to your respondent — no sign-up required for them.
              </p>
            </div>
            <button onClick={() => setShowCreate((v) => !v)} className="vt-btn-solid"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}
            >
              {showCreate ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Session</>}
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div style={{ marginBottom: 28, padding: 32, border: "1px solid var(--border2)", borderRadius: 16, background: "var(--bg2)", animation: "msgIn 0.2s ease-out" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, color: "var(--txt)", marginBottom: 24 }}>
                New Interview Session
              </h2>
              <form onSubmit={handleCreate}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--txt2)", marginBottom: 8 }}>
                      Title <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.5 }}>(optional)</span>
                    </label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q2 Shampoo Research" style={inputSm} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--txt2)", marginBottom: 8 }}>
                      Product Category <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input type="text" value={product} onChange={(e) => setProduct(e.target.value)} required placeholder="e.g. shampoo, biscuits…" style={inputSm} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--txt2)", marginBottom: 10 }}>Framework</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {STUDY_OPTIONS.map(({ id, label }) => (
                        <button key={id} type="button" onClick={() => setStudyType(id)}
                          style={{ padding: "7px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", border: studyType === id ? "1px solid transparent" : "1px solid var(--border)", background: studyType === id ? "var(--inv)" : "var(--bg)", color: studyType === id ? "var(--inv-txt)" : "var(--txt2)" }}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--txt2)", marginBottom: 10 }}>Language</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {LOCALES.map(({ id, label }) => (
                        <button key={id} type="button" onClick={() => setLanguage(id)}
                          style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", border: language === id ? "1px solid transparent" : "1px solid var(--border)", background: language === id ? "var(--inv)" : "var(--bg)", color: language === id ? "var(--inv-txt)" : "var(--txt2)" }}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {createError && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13.5, color: "#ef4444", marginBottom: 16 }}>
                    {createError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={creating || !product.trim()} className="vt-btn-solid"
                    style={{ opacity: creating || !product.trim() ? 0.6 : 1, cursor: creating || !product.trim() ? "not-allowed" : "pointer" }}
                  >
                    {creating ? "Creating…" : "Create Session"}
                  </button>
                  <button type="button" onClick={resetCreate} className="vt-btn-ghost">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Sessions list */}
          {sessionsLoading ? <Dots /> : sessions.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", border: "1px dashed var(--border2)", borderRadius: 16 }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, color: "var(--txt2)", marginBottom: 8 }}>
                No sessions yet
              </div>
              <p style={{ fontSize: 14, color: "var(--txt3)", fontWeight: 300 }}>Create your first session and share the link with a respondent.</p>
            </div>
          ) : (
            <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {sessions.map((s, i) => (
                <div key={s.id}
                  style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 20, padding: "20px 24px", borderBottom: i < sessions.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "";          }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--txt)" }}>{s.title}</span>
                      <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 99, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", background: s.status === "active" ? "rgba(22,163,74,0.1)" : "var(--bg3)", border: `1px solid ${s.status === "active" ? "rgba(22,163,74,0.22)" : "var(--border)"}`, color: s.status === "active" ? "#16a34a" : "var(--txt3)" }}>
                        {s.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--txt3)", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span>{s.product_category}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border2)", display: "inline-block" }} />
                      <span>{STUDY_OPTIONS.find((o) => o.id === s.study_type)?.label}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border2)", display: "inline-block" }} />
                      <span>{LOCALES.find((l) => l.id === s.language)?.label}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border2)", display: "inline-block" }} />
                      <span>{formatDate(s.created_at)}</span>
                    </div>
                    <code style={{ fontSize: 11.5, color: "var(--txt3)", background: "var(--bg3)", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>
                      {typeof window !== "undefined" ? window.location.origin : ""}/session/{s.token}
                    </code>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => copyLink(s.token)} className="vt-btn-ghost" style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      {copiedToken === s.token ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
                    </button>
                    <a href={`/session/${s.token}`} target="_blank" rel="noreferrer" className="vt-btn-ghost" style={{ padding: "8px 14px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <ExternalLink size={13} /> Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: 80 }} />

        {/* ── Transcripts ── */}
        <section>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px, 2.5vw, 36px)", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--txt)" }}>
              Transcripts
            </h2>
            <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, marginTop: 6 }}>
              Completed interview transcripts and summaries.
            </p>
          </div>

          {txLoading ? <Dots /> : transcripts.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", border: "1px dashed var(--border2)", borderRadius: 16 }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, color: "var(--txt2)", marginBottom: 8 }}>No transcripts yet</div>
              <p style={{ fontSize: 14, color: "var(--txt3)", fontWeight: 300 }}>Completed interviews will appear here.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
              {/* Session list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {transcripts.map((t, i) => {
                  const turns    = t.messages.filter((m) => m.role === "user").length;
                  const isActive = selected?.sessionId === t.sessionId;
                  return (
                    <button key={t.sessionId} onClick={() => setSelected(t)}
                      style={{ width: "100%", padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", border: "1px solid", background: isActive ? "var(--inv)" : "var(--bg2)", color: isActive ? "var(--inv-txt)" : "var(--txt)", borderColor: isActive ? "transparent" : "var(--border)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.55 }}>Session {i + 1}</span>
                        <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 99, background: isActive ? "rgba(255,255,255,0.15)" : "var(--bg3)", color: isActive ? "inherit" : "var(--txt3)" }}>{turns} turns</span>
                      </div>
                      <p style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                        {t.messages.find((m) => m.role === "user")?.content.slice(0, 40) ?? "Interview session"}…
                      </p>
                      <p style={{ fontSize: 12, opacity: 0.5 }}>{formatDate(t.createdAt)}</p>
                    </button>
                  );
                })}
              </div>

              {/* Transcript viewer */}
              <div>
                {selected ? (
                  <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--txt)" }}>Transcript — {formatDate(selected.createdAt)}</span>
                      <button onClick={() => setSelected(null)} style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}>
                        Close ✕
                      </button>
                    </div>
                    <div style={{ maxHeight: 520, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                      {selected.messages.filter((m) => m.role !== "system").map((m, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: m.role === "assistant" ? "var(--inv)" : "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: m.role === "assistant" ? "var(--inv-txt)" : "var(--txt2)" }}>
                            {m.role === "assistant" ? "D" : "R"}
                          </div>
                          <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.6, fontWeight: 300, background: m.role === "assistant" ? "var(--bg2)" : "var(--inv)", color: m.role === "assistant" ? "var(--txt)" : "var(--inv-txt)", border: m.role === "assistant" ? "1px solid var(--border)" : "none" }}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: 16 }}>
                    <p style={{ fontSize: 14, color: "var(--txt3)" }}>Select a session to view the transcript</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

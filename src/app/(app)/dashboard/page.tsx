"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Plus, X, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
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

const DEFAULT_GUIDE_PLACEHOLDER = `Paste your custom discussion guide here (optional).

If left blank, Mrs Dissanayake will use the default questions for the selected study framework.

Example:
1. Tell me about your morning routine with [product]...
2. How often do you use it?
3. What made you choose this brand?`;

function generateToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  return Math.random().toString(36).slice(2, 22);
}

function LogoMark() {
  return (
    <div className="w-5.5 h-5.5 rounded-md flex items-center justify-center shrink-0"
      style={{ background: "var(--inv)" }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Dots() {
  return (
    <div className="py-16 flex justify-center">
      <div className="flex gap-1.5">
        <span className="td" /><span className="td td-2" /><span className="td td-3" />
      </div>
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="py-16 text-center rounded-2xl border border-dashed"
      style={{ borderColor: "var(--border2)" }}>
      <p className="text-lg mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--txt2)" }}>{title}</p>
      <p className="text-sm font-light" style={{ color: "var(--txt3)" }}>{desc}</p>
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none border transition-colors font-[inherit]";
const inputStyle = { background: "var(--bg)", color: "var(--txt)", borderColor: "var(--border)" };

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"sessions" | "transcripts">("sessions");

  /* ── Sessions ── */
  const [sessions,        setSessions]        = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showCreate,      setShowCreate]      = useState(false);
  const [copiedToken,     setCopiedToken]     = useState<string | null>(null);

  /* ── Create form ── */
  const [title,       setTitle]       = useState("");
  const [product,     setProduct]     = useState("");
  const [studyType,   setStudyType]   = useState<StudyType>("behavioral");
  const [language,    setLanguage]    = useState<Locale>("en");
  const [guide,       setGuide]       = useState("");
  const [guideOpen,   setGuideOpen]   = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState("");

  /* ── Transcripts ── */
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
    setLanguage("en"); setGuide(""); setGuideOpen(false);
    setCreateError(""); setShowCreate(false);
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
        discussion_guide: guide.trim() || null,
        created_by:       user.id,
        status:           "active",
      })
      .select()
      .single();
    setCreating(false);
    if (error) { setCreateError(error.message); return; }
    setSessions((prev) => {
      const created = data as SessionRow;
      return [created, ...prev.filter((s) => s.id !== created.id)];
    });
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
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--txt)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-4 md:px-10 h-15.5 max-w-300 mx-auto">
          <Link href="/" className="flex items-center gap-2 no-underline"
            style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--txt)" }}>
            <LogoMark /> vinterview
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm" style={{ color: "var(--txt3)" }}>{user?.email}</span>
            <button onClick={signOut} className="vt-btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-300 mx-auto px-4 md:px-10 py-8 md:py-12">

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
              <div className="mb-6 p-5 md:p-8 rounded-2xl border"
                style={{ background: "var(--bg2)", borderColor: "var(--border2)", animation: "msgIn 0.2s ease-out" }}>
                <h2 className="text-xl font-normal mb-6"
                  style={{ fontFamily: "var(--font-serif)", color: "var(--txt)" }}>New Interview Session</h2>
                <form onSubmit={handleCreate}>
                  {/* Row 1: title + product */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                        style={{ color: "var(--txt2)" }}>
                        Title <span className="normal-case font-normal opacity-50">(optional)</span>
                      </label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Q2 Shampoo Research" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                        style={{ color: "var(--txt2)" }}>
                        Product Category <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input type="text" value={product} onChange={(e) => setProduct(e.target.value)}
                        required placeholder="e.g. shampoo, biscuits…" className={inputCls} style={inputStyle} />
                    </div>
                  </div>

                  {/* Row 2: framework + language */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest mb-2.5"
                        style={{ color: "var(--txt2)" }}>Framework</label>
                      <div className="flex flex-wrap gap-1.5">
                        {STUDY_OPTIONS.map(({ id, label }) => (
                          <button key={id} type="button" onClick={() => setStudyType(id)}
                            className="px-3 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer font-[inherit] border"
                            style={{
                              background: studyType === id ? "var(--inv)" : "var(--bg)",
                              color:      studyType === id ? "var(--inv-txt)" : "var(--txt2)",
                              borderColor: studyType === id ? "transparent" : "var(--border)",
                            }}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest mb-2.5"
                        style={{ color: "var(--txt2)" }}>Language</label>
                      <div className="flex gap-1.5">
                        {LOCALES.map(({ id, label }) => (
                          <button key={id} type="button" onClick={() => setLanguage(id)}
                            className="px-3.5 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer font-[inherit] border"
                            style={{
                              background: language === id ? "var(--inv)" : "var(--bg)",
                              color:      language === id ? "var(--inv-txt)" : "var(--txt2)",
                              borderColor: language === id ? "transparent" : "var(--border)",
                            }}>{label}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Discussion guide collapsible */}
                  <div className="mb-5">
                    <button type="button"
                      onClick={() => setGuideOpen((v) => !v)}
                      className="flex items-center gap-2 text-sm font-medium mb-2 cursor-pointer"
                      style={{ background: "none", border: "none", color: "var(--txt2)", fontFamily: "inherit", padding: 0 }}>
                      {guideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      Custom Discussion Guide
                      <span className="text-xs font-normal opacity-60">(optional — overrides default questions)</span>
                    </button>
                    {guideOpen && (
                      <textarea
                        value={guide}
                        onChange={(e) => setGuide(e.target.value)}
                        placeholder={DEFAULT_GUIDE_PLACEHOLDER}
                        rows={8}
                        className={inputCls + " resize-y"}
                        style={{ ...inputStyle, lineHeight: 1.6, fontSize: 13 }}
                      />
                    )}
                  </div>

                  {createError && (
                    <div className="px-3.5 py-2.5 rounded-lg text-sm mb-4"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                      {createError}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2.5">
                    <button type="submit" disabled={creating || !product.trim()} className="vt-btn-solid"
                      style={{ opacity: creating || !product.trim() ? 0.6 : 1, cursor: creating || !product.trim() ? "not-allowed" : "pointer" }}>
                      {creating ? "Creating…" : "Create Session"}
                    </button>
                    <button type="button" onClick={resetCreate} className="vt-btn-ghost">Cancel</button>
                  </div>
                </form>
              </div>
            )}

          {/* Sessions list */}
          {sessionsLoading ? <Dots /> : sessions.filter((s, i, a) => a.findIndex(x => x.id === s.id) === i).length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", border: "1px dashed var(--border2)", borderRadius: 16 }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, color: "var(--txt2)", marginBottom: 8 }}>
                No sessions yet
              </div>
              <p style={{ fontSize: 14, color: "var(--txt3)", fontWeight: 300 }}>Create your first session and share the link with a respondent.</p>
            </div>
          ) : (
            <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {sessions.filter((s, i, a) => a.findIndex(x => x.id === s.id) === i).map((s, i, arr) => (
                <div key={s.id}
                  style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 20, padding: "20px 24px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
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
                {transcripts.filter((t, i, a) => a.findIndex(x => x.sessionId === t.sessionId) === i).map((t, i) => {
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
                <div className="flex-1 min-w-0">
                  {selected ? (
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between px-5 py-3.5 border-b"
                        style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
                        <span className="text-sm font-medium" style={{ color: "var(--txt)" }}>
                          Transcript — {formatDate(selected.createdAt)}
                        </span>
                        <button onClick={() => setSelected(null)}
                          className="text-xs cursor-pointer"
                          style={{ color: "var(--txt3)", background: "none", border: "none", fontFamily: "inherit" }}>
                          Close ✕
                        </button>
                      </div>
                      <div className="overflow-y-auto p-5 flex flex-col gap-3" style={{ maxHeight: 560 }}>
                        {selected.messages.filter((m) => m.role !== "system").map((m, i) => (
                          <div key={i}
                            className="flex gap-2.5"
                            style={{ flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold border"
                              style={{
                                background: m.role === "assistant" ? "var(--inv)" : "var(--bg3)",
                                borderColor: "var(--border)",
                                color: m.role === "assistant" ? "var(--inv-txt)" : "var(--txt2)",
                              }}>
                              {m.role === "assistant" ? "D" : "R"}
                            </div>
                            <div className="max-w-[80%] px-3.5 py-2.5 rounded-xl text-[13.5px] leading-relaxed font-light border"
                              style={{
                                background: m.role === "assistant" ? "var(--bg2)" : "var(--inv)",
                                color: m.role === "assistant" ? "var(--txt)" : "var(--inv-txt)",
                                borderColor: m.role === "assistant" ? "var(--border)" : "transparent",
                              }}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center rounded-2xl border border-dashed"
                      style={{ borderColor: "var(--border)" }}>
                      <p className="text-sm" style={{ color: "var(--txt3)" }}>
                        Select a session to view the transcript
                      </p>
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

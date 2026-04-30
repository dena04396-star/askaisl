"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Plus, X, ExternalLink, FileText, LayoutList, ChevronDown, ChevronUp } from "lucide-react";
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

  const deduped = sessions.filter((s, i, a) => a.findIndex(x => x.id === s.id) === i);
  const dedupedTx = transcripts.filter((t, i, a) => a.findIndex(x => x.sessionId === t.sessionId) === i);

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

        {/* ── Page title ── */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight mb-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--txt)" }}>
            Dashboard
          </h1>
          <p className="text-sm font-light" style={{ color: "var(--txt2)" }}>
            Manage your interview sessions and view transcripts.
          </p>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: "var(--border)" }}>
          {([
            { id: "sessions",    label: "Sessions",    icon: LayoutList },
            { id: "transcripts", label: "Transcripts", icon: FileText   },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative"
              style={{
                color: activeTab === id ? "var(--txt)" : "var(--txt3)",
                borderBottom: activeTab === id ? "2px solid var(--txt)" : "2px solid transparent",
                marginBottom: -1,
                background: "none", border: "none",
                borderBottomWidth: 2,
                borderBottomStyle: "solid",
                borderBottomColor: activeTab === id ? "var(--txt)" : "transparent",
                cursor: "pointer", fontFamily: "inherit",
              }}>
              <Icon size={14} /> {label}
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--bg3)", color: "var(--txt3)" }}>
                {id === "sessions" ? deduped.length : dedupedTx.length}
              </span>
            </button>
          ))}
        </div>

        {/* ══════════════ SESSIONS TAB ══════════════ */}
        {activeTab === "sessions" && (
          <div>
            {/* Section header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-sm font-light" style={{ color: "var(--txt2)" }}>
                Create a session and share the link — respondents need no account.
              </p>
              <button onClick={() => setShowCreate((v) => !v)} className="vt-btn-solid shrink-0"
                style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
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
            {sessionsLoading ? <Dots /> : deduped.length === 0 ? (
              <EmptyState title="No sessions yet"
                desc="Create your first session and share the link with a respondent." />
            ) : (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {deduped.map((s, i, arr) => (
                  <div key={s.id}
                    className="transition-colors"
                    style={{
                      borderBottom: i < arr.length - 1 ? `1px solid var(--border)` : "none",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ""; }}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 md:p-5">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium" style={{ color: "var(--txt)" }}>{s.title}</span>
                          <span className="text-[10.5px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border"
                            style={{
                              background: s.status === "active" ? "rgba(22,163,74,0.1)" : "var(--bg3)",
                              borderColor: s.status === "active" ? "rgba(22,163,74,0.22)" : "var(--border)",
                              color: s.status === "active" ? "#16a34a" : "var(--txt3)",
                            }}>
                            {s.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-2" style={{ color: "var(--txt3)" }}>
                          <span>{s.product_category}</span>
                          <span className="w-1 h-1 rounded-full inline-block" style={{ background: "var(--border2)" }} />
                          <span>{STUDY_OPTIONS.find((o) => o.id === s.study_type)?.label}</span>
                          <span className="w-1 h-1 rounded-full inline-block" style={{ background: "var(--border2)" }} />
                          <span>{LOCALES.find((l) => l.id === s.language)?.label}</span>
                          <span className="w-1 h-1 rounded-full inline-block" style={{ background: "var(--border2)" }} />
                          <span>{formatDate(s.created_at)}</span>
                        </div>
                        <code className="text-[11px] px-2 py-0.5 rounded font-mono truncate max-w-full inline-block"
                          style={{ color: "var(--txt3)", background: "var(--bg3)" }}>
                          {typeof window !== "undefined" ? window.location.origin : ""}/session/{s.token}
                        </code>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => copyLink(s.token)} className="vt-btn-ghost"
                          style={{ padding: "7px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                          {copiedToken === s.token ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                        </button>
                        <a href={`/session/${s.token}`} target="_blank" rel="noreferrer" className="vt-btn-ghost"
                          style={{ padding: "7px 12px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <ExternalLink size={13} /> Open
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TRANSCRIPTS TAB ══════════════ */}
        {activeTab === "transcripts" && (
          <div>
            <p className="text-sm font-light mb-6" style={{ color: "var(--txt2)" }}>
              Completed interview transcripts — click a session to view the full conversation.
            </p>

            {txLoading ? <Dots /> : dedupedTx.length === 0 ? (
              <EmptyState title="No transcripts yet" desc="Completed interviews will appear here." />
            ) : (
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Session list */}
                <div className="flex flex-col gap-2 lg:w-72 shrink-0">
                  {dedupedTx.map((t, i) => {
                    const turns = t.messages.filter((m) => m.role === "user").length;
                    const active = selected?.sessionId === t.sessionId;
                    return (
                      <button key={t.sessionId} onClick={() => setSelected(active ? null : t)}
                        className="w-full p-3.5 rounded-xl text-left cursor-pointer transition-all border font-[inherit]"
                        style={{
                          background: active ? "var(--inv)" : "var(--bg2)",
                          color:      active ? "var(--inv-txt)" : "var(--txt)",
                          borderColor: active ? "transparent" : "var(--border)",
                        }}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wider opacity-55">
                            Session {i + 1}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                            style={{ background: active ? "rgba(255,255,255,0.15)" : "var(--bg3)", color: active ? "inherit" : "var(--txt3)" }}>
                            {turns} turns
                          </span>
                        </div>
                        <p className="text-[13.5px] font-medium truncate mb-1">
                          {t.messages.find((m) => m.role === "user")?.content.slice(0, 42) ?? "Interview session"}…
                        </p>
                        <p className="text-xs opacity-50">{formatDate(t.createdAt)}</p>
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
          </div>
        )}

      </main>
    </div>
  );
}

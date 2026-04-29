"use client";

import { useEffect, useRef, useState, useCallback, startTransition } from "react";
import { Mic, MicOff, Send, PhoneOff, Copy, Check, Download, Plus, ChevronRight, Globe, User } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { Button } from "@/components/ui/Button";
import { useInterviewStore } from "@/features/interview/interview.store";
import type { Locale, StudyType, StudyContext, RespondentDetails } from "@/types";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

const LOCALE_LABELS: Record<Locale, string> = { en: "English", si: "සිංහල", ta: "தமிழ்" };
const LOCALE_BCP47: Record<Locale, string>  = { en: "en-US",   si: "si-LK", ta: "ta-IN"  };

const STUDY_OPTIONS: { id: StudyType; label: string; description: string }[] = [
  { id: "behavioral",       label: "Behavioral",       description: "Habits & usage patterns"      },
  { id: "decision_journey", label: "Decision Journey", description: "Choice drivers & brand switch" },
  { id: "pain_points",      label: "Pain Points",       description: "Frustrations & unmet needs"   },
  { id: "perception",       label: "Perception",        description: "Brand image & trust scores"    },
  { id: "concept_testing",  label: "Concept Test",      description: "Reactions to new products"     },
];

const FEMALE_VOICE_PREFS = [
  "samantha","google uk english female","google us english female",
  "female","woman","fiona","victoria","karen","moira","veena","zira","hazel",
];

function pickFemaleVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefix = lang.split("-")[0];
  for (const p of FEMALE_VOICE_PREFS) {
    const v = voices.find((v) => v.lang.startsWith(prefix) && v.name.toLowerCase().includes(p));
    if (v) return v;
  }
  for (const p of FEMALE_VOICE_PREFS) {
    const v = voices.find((v) => v.name.toLowerCase().includes(p));
    if (v) return v;
  }
  return voices.find((v) => !v.name.toLowerCase().includes("male") && !v.name.toLowerCase().includes(" man")) ?? null;
}

async function playTTS(
  text: string,
  onStart: () => void,
  onEnd: () => void,
  lang: string,
  onWordChange?: (count: number) => void,
): Promise<() => void> {
  const total = text.split(/\s+/).filter(Boolean).length;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onplay = onStart;
    audio.ontimeupdate = () => {
      if (!onWordChange || !isFinite(audio.duration) || audio.duration === 0) return;
      onWordChange(Math.min(Math.ceil((audio.currentTime / audio.duration) * total), total));
    };
    audio.onended = () => { onWordChange?.(total); onEnd(); URL.revokeObjectURL(url); };
    audio.onerror = () => { onWordChange?.(total); onEnd(); URL.revokeObjectURL(url); };
    audio.play().catch(() => { onWordChange?.(total); onEnd(); });
    return () => { audio.pause(); onEnd(); URL.revokeObjectURL(url); };
  } catch {
    if (typeof window === "undefined") return () => {};
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = lang;
    utter.rate  = 0.90;
    utter.pitch = 1.10;
    const go = () => {
      const voice = pickFemaleVoice(lang);
      if (voice) utter.voice = voice;
      utter.onstart = onStart;
      utter.onend   = () => { onWordChange?.(total); (onEnd as () => void)(); };
      utter.onerror = () => { onWordChange?.(total); (onEnd as () => void)(); };
      utter.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name === "word" && onWordChange)
          onWordChange(text.slice(0, e.charIndex).split(/\s+/).filter(Boolean).length + 1);
      };
      window.speechSynthesis.speak(utter);
    };
    window.speechSynthesis.getVoices().length === 0
      ? (window.speechSynthesis.onvoiceschanged = go)
      : go();
    return () => { window.speechSynthesis.cancel(); onWordChange?.(total); onEnd(); };
  }
}

/* ─── Avatar SVG face ── */
function AvatarFace() {
  return (
    <svg width="108" height="108" viewBox="0 0 54 54" fill="none">
      <ellipse cx="27" cy="52" rx="16" ry="7" fill="var(--bg3)" opacity="0.6"/>
      <rect x="22.5" y="42" width="7" height="7" rx="1.5" fill="var(--txt3)" opacity="0.4"/>
      <ellipse cx="27" cy="30" rx="14" ry="15" fill="var(--txt3)" opacity="0.5"/>
      <ellipse cx="27" cy="16" rx="14" ry="7" fill="var(--border2)" opacity="0.9"/>
      <ellipse cx="14" cy="26" rx="3" ry="8" fill="var(--border2)" opacity="0.8"/>
      <ellipse cx="40" cy="26" rx="3" ry="8" fill="var(--border2)" opacity="0.8"/>
      <ellipse cx="20" cy="29" rx="3" ry="3.2" fill="var(--txt)"/>
      <ellipse cx="34" cy="29" rx="3" ry="3.2" fill="var(--txt)"/>
      <circle cx="21" cy="28" r="1" fill="var(--bg)" opacity="0.5"/>
      <circle cx="35" cy="28" r="1" fill="var(--bg)" opacity="0.5"/>
      <path d="M17 25 Q20 23 23 25" stroke="var(--border2)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M31 25 Q34 23 37 25" stroke="var(--border2)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M23 40 Q27 43 31 40" stroke="var(--border2)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── SETUP ── */
function SetupScreen({ onStart }: {
  onStart: (lang: Locale, study: StudyContext, respondent?: RespondentDetails) => void;
}) {
  const [lang, setLang]           = useState<Locale>("en");
  const [product, setProduct]     = useState("");
  const [studyType, setStudyType] = useState<StudyType>("behavioral");
  const [name, setName]           = useState("");
  const [age, setAge]             = useState("");
  const [gender, setGender]       = useState("");
  const [district, setDistrict]   = useState("");

  const canStart = product.trim().length > 0;
  const handleStart = () => {
    const r: RespondentDetails = {};
    if (name.trim())     r.name     = name.trim();
    if (age.trim())      r.age      = age.trim();
    if (gender.trim())   r.gender   = gender.trim();
    if (district.trim()) r.district = district.trim();
    onStart(lang, { productCategory: product.trim(), studyType }, r);
  };

  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em",
    textTransform: "uppercase", color: "var(--txt3)", marginBottom: 9,
  };
  const field: React.CSSProperties = {
    width: "100%", padding: "10px 13px", background: "var(--bg2)", color: "var(--txt)",
    border: "1px solid var(--border)", borderRadius: 9, fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };
  const focusField = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--border2)";
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(0,0,0,0.06)";
  };
  const blurField = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--border)";
    e.currentTarget.style.boxShadow   = "none";
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg2)", padding: "40px 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-lg)", maxWidth: 840, width: "100%" }}>

        {/* ── Left panel — branded ── */}
        <div style={{ background: "var(--inv)", color: "var(--inv-txt)", padding: "52px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 56, fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 500 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: "var(--inv-txt)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 12 12" fill="none" width={10} height={10}>
                  <path d="M2 10L6 2l4 8" stroke="var(--inv)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              vinterview
            </div>

            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 40, fontWeight: 400, letterSpacing: "-0.025em", lineHeight: 1.06, marginBottom: 18 }}>
              Begin a<br />research<br /><em style={{ fontStyle: "italic" }}>session</em>
            </h1>
            <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.75, opacity: 0.6, maxWidth: 250 }}>
              Configure your study below. Mrs Dissanayake will adapt her approach and conduct the interview.
            </p>
          </div>

          {/* Feature list */}
          <div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 24 }} />
            {["Adaptive AI interviewer", "Tri-lingual support", "Auto-generated report"].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13, opacity: 0.55 }}>
                <div style={{ width: 16, height: 16, borderRadius: 99, border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0 }}>✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div style={{ background: "var(--bg)", padding: "52px 44px", overflowY: "auto", maxHeight: "92vh" }}>

          {/* Language */}
          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>Language</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([code, label]) => (
                <button key={code} onClick={() => setLang(code)} style={{
                  padding: "10px 0", borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.15s", textAlign: "center", fontFamily: "inherit",
                  background: lang === code ? "var(--inv)" : "var(--bg2)",
                  color:      lang === code ? "var(--inv-txt)" : "var(--txt2)",
                  border:     lang === code ? "1px solid transparent" : "1px solid var(--border)",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>Product Category</label>
            <input
              type="text" value={product} onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. shampoo, biscuits, mobile plans…"
              autoFocus
              style={field} onFocus={focusField} onBlur={blurField}
            />
          </div>

          {/* Study framework — flex-wrap handles 5 items cleanly */}
          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>Study Framework</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {STUDY_OPTIONS.map(({ id, label }) => (
                <button key={id} onClick={() => setStudyType(id)} style={{
                  padding: "9px 16px", borderRadius: 9, fontSize: 13.5, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                  background: studyType === id ? "var(--inv)" : "var(--bg2)",
                  color:      studyType === id ? "var(--inv-txt)" : "var(--txt2)",
                  border:     studyType === id ? "1px solid transparent" : "1px solid var(--border)",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Respondent — flat 2×2 grid, no nested box */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
              <User size={11} style={{ color: "var(--txt3)" }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--txt3)" }}>
                Respondent
              </span>
              <span style={{ fontSize: 12, color: "var(--txt3)", fontWeight: 300, opacity: 0.6 }}>— optional</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 6 }}>Name</div>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={field} onFocus={focusField} onBlur={blurField} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 6 }}>Age</div>
                <input type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 28" style={field} onFocus={focusField} onBlur={blurField} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 6 }}>Gender</div>
                <select value={gender} onChange={(e) => setGender(e.target.value)} onFocus={focusField} onBlur={blurField}
                  style={{ ...field, color: gender ? "var(--txt)" : "var(--txt3)", cursor: "pointer" }}
                >
                  <option value="">Select…</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 6 }}>District</div>
                <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Colombo" style={field} onFocus={focusField} onBlur={blurField} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleStart} disabled={!canStart} style={{
            width: "100%", padding: "14px 20px", borderRadius: 10, fontSize: 15, fontWeight: 500,
            cursor: canStart ? "pointer" : "not-allowed", border: "none",
            background: canStart ? "var(--inv)" : "var(--bg3)",
            color:      canStart ? "var(--inv-txt)" : "var(--txt3)",
            opacity: canStart ? 1 : 0.55, transition: "all 0.15s", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            Begin Interview Session <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─── SUMMARY ── */
function renderSummary(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## "))  return <h3 key={i} style={{ marginTop: 24, marginBottom: 8, fontSize: 15, fontWeight: 600, color: "var(--txt)" }}>{line.slice(3)}</h3>;
    if (line.startsWith("### ")) return <h4 key={i} style={{ marginTop: 12, marginBottom: 4, fontWeight: 600, color: "var(--txt)" }}>{line.slice(4)}</h4>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} style={{ marginLeft: 20, color: "var(--txt2)", marginBottom: 4 }}>{line.slice(2)}</li>;
    if (line.startsWith('"') && line.endsWith('"')) return <blockquote key={i} style={{ margin: "8px 0", borderLeft: "3px solid var(--border2)", paddingLeft: 12, fontStyle: "italic", color: "var(--txt2)" }}>{line}</blockquote>;
    if (line.trim() === "") return <div key={i} style={{ height: 4 }} />;
    const parts = line.split(/\*\*(.*?)\*\*/g);
    if (parts.length > 1) return <p key={i} style={{ color: "var(--txt2)", marginBottom: 4 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
    return <p key={i} style={{ color: "var(--txt2)", marginBottom: 4 }}>{line}</p>;
  });
}

function SummaryScreen({ summary, isSummarizing, study, respondent, messages, onReset }: {
  summary: string | null;
  isSummarizing: boolean;
  study?: StudyContext;
  respondent?: RespondentDetails;
  messages: import("@/types").ChatMessage[];
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const exportCSV = () => {
    const header = "Role,Message\n";
    const rows = messages
      .filter((m) => m.role !== "system")
      .map((m) => `"${m.role === "assistant" ? "Mrs Dissanayake" : "Respondent"}","${m.content.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `interview-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const studyLabel = STUDY_OPTIONS.find((s) => s.id === study?.studyType)?.label;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", gridTemplateColumns: "220px 1fr" }}>
      {/* Sidebar */}
      <div style={{ background: "var(--bg2)", borderRight: "1px solid var(--border)", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, padding: "0 8px", marginBottom: 28, display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: "var(--inv)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 12 12" fill="none" width={10} height={10}><path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          vinterview
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--txt3)", padding: "16px 10px 8px" }}>Session</div>
        <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, fontSize: 13.5, cursor: "pointer", transition: "all 0.15s", border: "none", background: "var(--inv)", color: "var(--inv-txt)", fontFamily: "inherit", width: "100%", textAlign: "left" }}>
          <Download size={14} /> Report
        </button>
        <button onClick={onReset} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, fontSize: 13.5, cursor: "pointer", transition: "all 0.15s", border: "none", background: "none", color: "var(--txt2)", fontFamily: "inherit", width: "100%", textAlign: "left" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.color = "var(--txt)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--txt2)"; }}
        >
          <Plus size={14} /> New Interview
        </button>
      </div>

      {/* Main */}
      <div style={{ padding: 40, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--txt)" }}>Research Report</h1>
            {study && <p style={{ fontSize: 13, color: "var(--txt3)", marginTop: 4 }}>{study.productCategory} · {studyLabel}{respondent?.name ? ` · ${respondent.name}` : ""}</p>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {summary && (
              <button onClick={copySummary} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid var(--border2)", background: "var(--bg2)", color: "var(--txt2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                {copied ? <><Check size={13}/> Copied</> : <><Copy size={13}/> Copy</>}
              </button>
            )}
            <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid var(--border2)", background: "var(--bg2)", color: "var(--txt2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              <Download size={13}/> Export CSV
            </button>
          </div>
        </div>

        {/* Respondent chips */}
        {respondent && (respondent.name || respondent.age || respondent.gender || respondent.district) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 36 }}>
            {[
              { label: "Name",     val: respondent.name     },
              { label: "Age",      val: respondent.age      },
              { label: "Gender",   val: respondent.gender   },
              { label: "District", val: respondent.district },
            ].filter(c => c.val).map(({ label, val }) => (
              <div key={label} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px" }}>
                <div style={{ fontSize: 12, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, color: "var(--txt)" }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {isSummarizing ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "80px 0", textAlign: "center" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="td" /><span className="td td-2" /><span className="td td-3" />
            </div>
            <p style={{ fontSize: 14, color: "var(--txt3)" }}>Generating research summary…</p>
          </div>
        ) : summary ? (
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: 32 }}>
            {renderSummary(summary)}
          </div>
        ) : (
          <p style={{ padding: "80px 0", textAlign: "center", fontSize: 14, color: "var(--txt3)" }}>Summary unavailable.</p>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN CHAT (Room) ── */
export interface PreConfig {
  studyType: StudyType;
  language: Locale;
  productCategory: string;
  respondentName?: string;
}

export default function ChatInterface({ preConfig }: { preConfig?: PreConfig }) {
  const [input, setInput]             = useState("");
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [revealedWords, setRevealedWords] = useState(-1);
  const [seconds, setSeconds]         = useState(0);

  const bottomRef      = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const stopAudioRef   = useRef<(() => void) | null>(null);
  const taRef          = useRef<HTMLTextAreaElement>(null);
  const autoStarted    = useRef(false);

  const {
    messages, status, isLoading, isSummarizing,
    language, study, respondent, summary,
    showClosingBanner, startInterview, sendUserMessage,
    endInterview, reset,
  } = useInterviewStore();

  useEffect(() => {
    if (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition))
      startTransition(() => setMicSupported(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  /* Auto-start when preConfig is provided (respondent session link flow) */
  useEffect(() => {
    if (!preConfig || status !== "idle" || autoStarted.current) return;
    autoStarted.current = true;
    const respondentDetails: RespondentDetails = {};
    if (preConfig.respondentName) respondentDetails.name = preConfig.respondentName;
    startInterview(
      preConfig.language,
      { productCategory: preConfig.productCategory, studyType: preConfig.studyType },
      respondentDetails,
    );
  }, [preConfig, status, startInterview]);

  const timerStr = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const speak = useCallback(async (text: string) => {
    stopAudioRef.current?.();
    stopAudioRef.current = null;
    setRevealedWords(0);
    const cleanup = await playTTS(
      text,
      () => setIsSpeaking(true),
      () => { setIsSpeaking(false); setRevealedWords(-1); },
      LOCALE_BCP47[language],
      (count) => setRevealedWords(count),
    );
    stopAudioRef.current = cleanup;
  }, [language]);

  const lastAssistantMsg = messages.filter((m) => m.role === "assistant").at(-1);
  const spokenRef = useRef<number>(-1);

  useEffect(() => {
    if (!lastAssistantMsg?.content || isLoading) return;
    const idx = messages.length - 1;
    if (spokenRef.current !== idx) {
      spokenRef.current = idx;
      speak(lastAssistantMsg.content);
    }
  }, [lastAssistantMsg, isLoading, messages.length, speak]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendUserMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleMic = () => {
    if (isListening) { recognitionRef.current?.stop(); return; }
    if (isLoading) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = LOCALE_BCP47[language];
    rec.continuous = false;
    rec.interimResults = false;
    let captured = "";
    rec.onstart  = () => setIsListening(true);
    rec.onresult = (e: { results: { [x: number]: { [x: number]: { transcript: string } } } }) => {
      captured = e.results[0]?.[0]?.transcript ?? "";
      setInput(captured);
    };
    rec.onerror  = () => { setIsListening(false); captured = ""; };
    rec.onend    = () => {
      setIsListening(false);
      if (captured.trim()) { setInput(""); sendUserMessage(captured.trim()); }
    };
    recognitionRef.current = rec;
    rec.start();
  };

  /* Status state */
  const statusLabel = isSpeaking ? "Speaking" : isLoading ? "Thinking" : isListening ? "Listening" : "Ready";
  const statusDotStyle: React.CSSProperties = {
    width: 6, height: 6, borderRadius: "50%", transition: "all 0.3s",
    background: isSpeaking ? "var(--txt)" : isLoading ? "#d97706" : isListening ? "#16a34a" : "var(--txt3)",
    animation: isSpeaking ? "blink 0.7s infinite" : isLoading ? "blink 1.1s infinite" : "none",
  };

  if (status === "idle" && !preConfig) return <SetupScreen onStart={startInterview} />;
  if (status === "idle") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <span className="td" /><span className="td td-2" /><span className="td td-3" />
      </div>
    </div>
  );
  if (status === "finished") return <SummaryScreen summary={summary} isSummarizing={isSummarizing} study={study} respondent={respondent} messages={messages} onReset={reset} />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", height: "100vh", overflow: "hidden" }}>

      {/* ── LEFT: av-side ── */}
      <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", position: "relative", overflow: "hidden", background: "var(--bg2)" }}>
        {/* radial bg */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 60% at 50% 55%, var(--bg3) 0%, transparent 70%)" }} />

        {/* Topbar */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 26px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 99, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", fontSize: 11, fontWeight: 600, color: "#16a34a", letterSpacing: "0.05em" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a", animation: "blink 1.6s infinite", display: "inline-block" }} />
              LIVE
            </div>
            <span style={{ fontSize: 13, color: "var(--txt2)" }}>{timerStr}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* settings icon btn */}
            <button
              title="Settings"
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--txt2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.color = "var(--txt)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--txt2)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
            {/* leave (danger) */}
            <button
              title="End session"
              onClick={endInterview}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--txt2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--txt2)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <PhoneOff size={13} />
            </button>
          </div>
        </div>

        {/* Stage */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
            {/* Avatar circle + rings */}
            <div style={{ position: "relative" }}>
              <div className={`av-ring${isSpeaking ? " speaking" : ""}`} />
              <div className={`av-ring-2${isSpeaking ? " speaking" : ""}`} />
              <div style={{ width: 192, height: 192, borderRadius: "50%", background: "var(--bg)", border: "1.5px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-lg)", overflow: "hidden", position: "relative" }}>
                <AvatarFace />
                <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 20%, var(--bg3) 0%, transparent 55%)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Name & role */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", marginBottom: 4, color: "var(--txt)" }}>Mrs Dissanayake</div>
              <div style={{ fontSize: 13, color: "var(--txt2)", fontWeight: 300 }}>Market Research Interviewer</div>
            </div>

            {/* Waveform */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, height: 22, opacity: isSpeaking ? 1 : 0.3, transition: "opacity 0.3s" }}>
              <span className="wb wb-1" /><span className="wb wb-2" /><span className="wb wb-3" />
              <span className="wb wb-4" /><span className="wb wb-5" /><span className="wb wb-6" /><span className="wb wb-7" />
            </div>

            {/* Status pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 99, background: "var(--bg)", border: "1px solid var(--border)", fontSize: 12.5, color: "var(--txt2)" }}>
              <span style={statusDotStyle} />
              {statusLabel}
            </div>

            {/* Study info */}
            {study && (
              <div style={{ padding: "10px 16px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", maxWidth: 220, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--txt3)", marginBottom: 4 }}>Active Study</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--txt)" }}>{study.productCategory}</div>
                <div style={{ fontSize: 11.5, color: "var(--txt3)", marginTop: 2 }}>{STUDY_OPTIONS.find((s) => s.id === study.studyType)?.label}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: chat-side ── */}
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>
        {/* Chat header */}
        <div style={{ padding: "17px 22px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--txt)" }}>Transcript</div>
          <div style={{ fontSize: 12, color: "var(--txt3)", marginTop: 2 }}>
            {LOCALE_LABELS[language]} · {STUDY_OPTIONS.find((s) => s.id === study?.studyType)?.label ?? "Interview"}
          </div>
        </div>

        {/* Closing banner */}
        {showClosingBanner && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "10px 18px" }}>
            <p style={{ fontSize: 13, color: "var(--txt2)", fontWeight: 300 }}>Interview concluded — view your research summary.</p>
            <button onClick={endInterview}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--inv)", color: "var(--inv-txt)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            >
              View Summary <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 4, scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}>
          {messages.map((msg, i) => {
            const isLastAssistant = msg.role === "assistant" && i === messages.length - 1;
            return (
              <MessageBubble
                key={i}
                message={msg}
                revealedWords={isLastAssistant && revealedWords >= 0 ? revealedWords : undefined}
              />
            );
          })}

          {isLoading && (
            <div style={{ alignSelf: "flex-start" }}>
              <span style={{ fontSize: 11, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 12px", display: "block", margin: "12px 0 6px" }}>Mrs Dissanayake</span>
              <div className="typing-indicator show" style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 14px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, borderBottomLeftRadius: 4, width: "fit-content" }}>
                <span className="td" /><span className="td td-2" /><span className="td td-3" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: 14, borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <div
            style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 8px 8px 14px", transition: "border-color 0.18s" }}
            onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--txt2)"; }}
            onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
          >
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response…"
              rows={1}
              disabled={isLoading}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--txt)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 300, lineHeight: 1.5, resize: "none", maxHeight: 100, paddingTop: 3, opacity: isLoading ? 0.5 : 1 }}
            />
            {micSupported && (
              <button onClick={handleMic} aria-label={isListening ? "Stop" : "Speak"}
                style={{ width: 34, height: 34, borderRadius: 9, border: isListening ? "none" : "1px solid var(--border)", background: isListening ? "var(--inv)" : "var(--bg3)", color: isListening ? "var(--inv-txt)" : "var(--txt2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0, animation: isListening ? "blink 1s infinite" : "none" }}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            )}
            <button onClick={handleSend} disabled={isLoading || !input.trim()} aria-label="Send"
              style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "var(--inv)", color: "var(--inv-txt)", cursor: isLoading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0, opacity: isLoading || !input.trim() ? 0.4 : 1 }}
              onMouseEnter={(e) => { if (!isLoading && input.trim()) e.currentTarget.style.opacity = "0.8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = isLoading || !input.trim() ? "0.4" : "1"; }}
            >
              <Send size={14} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--txt3)", textAlign: "center", marginTop: 7 }}>Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  );
}

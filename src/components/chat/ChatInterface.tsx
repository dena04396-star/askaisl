"use client";

import { useEffect, useRef, useState, useCallback, startTransition } from "react";
import { Mic, MicOff, Send, PhoneOff, Copy, Check, Download, Plus, ChevronRight, User } from "lucide-react";
import * as XLSX from "xlsx";
import MessageBubble from "./MessageBubble";
import { Button } from "@/components/ui/Button";
import { useInterviewStore } from "@/features/interview/interview.store";
import type { Locale, StudyType, StudyContext, RespondentDetails } from "@/types";
import dynamic from "next/dynamic";
const InterviewAvatar = dynamic(() => import("@/components/avatar/InterviewAvatar"), { ssr: false });

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


/* ─── TTS: ElevenLabs primary, Web Speech fallback ── */
const FEMALE_KEYS = ["female","woman","samantha","google uk english female","google us english female","fiona","victoria","karen","moira","veena","zira","hazel","nora","aria","jenny","sonia","natasha","leah","raveena","latha","alva","eva","cortana","elsa","amelie","ioana","mariam","kyoko","sin-ji","mei-jia","zosia","milena","paulina","laura","alice"];
const MALE_KEYS   = ["male","man","david","james","daniel","richard","mark","thomas","george","alex","fred","paul","tom","jorge","oliver","wayne","henry","luca","xander","bruce","lee","carlos","diego","reed"];

function isFemaleVoice(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase();
  if (FEMALE_KEYS.some(f => n.includes(f))) return true;
  if (MALE_KEYS.some(m => n.includes(m))) return false;
  return true; // unknown → assume female rather than default-to-male
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefix = lang.split("-")[0];

  /* 1 – exact locale, female */
  const exactF = voices.find(v => v.lang === lang && isFemaleVoice(v));
  if (exactF) return exactF;

  /* 2 – lang prefix, female */
  const preF = voices.find(v => v.lang.startsWith(prefix) && isFemaleVoice(v));
  if (preF) return preF;

  /* 3 – si/ta: native voice only — do NOT fall back to English (English voice skips Sinhala/Tamil glyphs and speaks only numbers) */
  if (prefix === "si" || prefix === "ta") {
    return voices.find(v => v.lang.startsWith(prefix)) ?? null;
  }

  /* 4 – any voice for the language (last resort) */
  return voices.find(v => v.lang.startsWith(prefix)) ?? null;
}

async function playTTS(
  text: string, onStart: () => void, onEnd: () => void, lang: string,
  onWord?: (n: number) => void,
  analyserRef?: { current: AnalyserNode | null },
): Promise<() => void> {
  const total = text.split(/\s+/).filter(Boolean).length;
  try {
    const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, language: lang }) });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (data.fallback && data.chunks && data.chunks.length > 0) {
        let currentIdx = 0;
        let currentAudio: HTMLAudioElement | null = null;
        let isCancelled = false;

        let audioCtx: AudioContext | null = null;
        if (analyserRef && typeof AudioContext !== "undefined") {
          try { audioCtx = new AudioContext(); } catch { /* ignore */ }
        }

        const urls = data.chunks.map((b64: string) => `data:audio/mpeg;base64,${b64}`);

        const playNext = () => {
          if (isCancelled) return;
          if (currentIdx >= urls.length) {
            if (analyserRef) analyserRef.current = null;
            audioCtx?.close().catch(() => {});
            onWord?.(total);
            onEnd();
            return;
          }

          currentAudio = new Audio(urls[currentIdx]);
          
          if (audioCtx && analyserRef) {
            try {
              const src = audioCtx.createMediaElementSource(currentAudio);
              const node = audioCtx.createAnalyser(); 
              node.fftSize = 256;
              src.connect(node); 
              node.connect(audioCtx.destination);
              analyserRef.current = node;
            } catch { /* ignore */ }
          }

          if (currentIdx === 0) onStart();

          currentAudio.onended = () => { currentIdx++; playNext(); };
          currentAudio.onerror = () => { currentIdx++; playNext(); };
          currentAudio.play().catch(() => { currentIdx++; playNext(); });
        };

        playNext();

        return () => {
          isCancelled = true;
          if (currentAudio) currentAudio.pause();
          if (analyserRef) analyserRef.current = null;
          audioCtx?.close().catch(() => {});
          onWord?.(total);
          onEnd();
        };
      }
    }

    const url = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);

    let audioCtx: AudioContext | null = null;
    if (analyserRef && typeof AudioContext !== "undefined") {
      try {
        audioCtx = new AudioContext();
        const src = audioCtx.createMediaElementSource(audio);
        const node = audioCtx.createAnalyser(); node.fftSize = 256;
        src.connect(node); node.connect(audioCtx.destination);
        analyserRef.current = node;
      } catch { /* no analyser, still plays */ }
    }
    const teardown = () => { if (analyserRef) analyserRef.current = null; audioCtx?.close().catch(() => {}); URL.revokeObjectURL(url); };

    audio.onplay = onStart;
    audio.ontimeupdate = () => { if (!onWord || !isFinite(audio.duration) || !audio.duration) return; onWord(Math.min(Math.ceil((audio.currentTime / audio.duration) * total), total)); };
    audio.onended = () => { onWord?.(total); teardown(); onEnd(); };
    audio.onerror = () => { onWord?.(total); teardown(); onEnd(); };
    audio.play().catch(() => { onWord?.(total); teardown(); onEnd(); });
    return () => { audio.pause(); teardown(); onEnd(); };
  } catch {
    if (analyserRef) analyserRef.current = null;
    if (typeof window === "undefined") return () => {};
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.88; utter.pitch = 1.25;
    const go = () => {
      const v = pickVoice(lang);
      /* No voice found for this language (common for si/ta on desktop) — skip TTS, just show text */
      if (!v) { onStart(); onWord?.(total); onEnd(); return; }
      utter.voice = v; utter.lang = v.lang;
      utter.onstart = onStart;
      utter.onend   = () => { onWord?.(total); onEnd(); };
      utter.onerror = () => { onWord?.(total); onEnd(); };
      utter.onboundary = (e: SpeechSynthesisEvent) => { if (e.name === "word" && onWord) onWord(text.slice(0, e.charIndex).split(/\s+/).filter(Boolean).length + 1); };
      window.speechSynthesis.speak(utter);
    };
    window.speechSynthesis.getVoices().length === 0 ? (window.speechSynthesis.onvoiceschanged = go) : go();
    return () => { window.speechSynthesis.cancel(); onWord?.(total); onEnd(); };
  }
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
  const [occupation, setOccupation] = useState("");

  const canStart = product.trim().length > 0;
  const handleStart = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await navigator.mediaDevices.getDisplayMedia({ 
        video: { displaySurface: "monitor" },
        audio: false 
      });
    } catch (err) {
      alert("You must allow both microphone and screen sharing to begin the interview.");
      return;
    }
    const r: RespondentDetails = {};
    if (name.trim())       r.name       = name.trim();
    if (age.trim())        r.age        = age.trim();
    if (gender.trim())     r.gender     = gender.trim();
    if (district.trim())   r.district   = district.trim();
    if (occupation.trim()) r.occupation = occupation.trim();
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg2)", padding: "24px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "min(320px, 35%) 1fr", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-lg)", maxWidth: 840, width: "100%" }}
        className="setup-grid">

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
                <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Colombo, Kandy…" style={field} onFocus={focusField} onBlur={blurField} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 6 }}>Occupation</div>
                <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Teacher, Homemaker, Entrepreneur…" style={field} onFocus={focusField} onBlur={blurField} />
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

function SummaryScreen({ summary, isSummarizing, study, respondent, messages, onReset, isRespondentMode }: {
  summary: string | null;
  isSummarizing: boolean;
  study?: StudyContext;
  respondent?: RespondentDetails;
  messages: import("@/types").ChatMessage[];
  onReset: () => void;
  isRespondentMode?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    /* Sheet 1: Transcript */
    const txRows = [
      ["Speaker", "Message"],
      ...messages
        .filter((m) => m.role !== "system")
        .map((m) => [m.role === "assistant" ? "Mrs Dissanayake" : "Respondent", m.content]),
    ];
    const txSheet = XLSX.utils.aoa_to_sheet(txRows);
    txSheet["!cols"] = [{ wch: 20 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, txSheet, "Transcript");

    /* Sheet 2: Summary */
    if (summary) {
      const sumRows = summary.split("\n").map((line) => [line]);
      const sumSheet = XLSX.utils.aoa_to_sheet(sumRows);
      sumSheet["!cols"] = [{ wch: 100 }];
      XLSX.utils.book_append_sheet(wb, sumSheet, "Summary");
    }

    /* Sheet 3: Respondent details */
    if (respondent) {
      const rRows = [
        ["Field", "Value"],
        ["Name",       respondent.name       ?? ""],
        ["Age",        respondent.age        ?? ""],
        ["Gender",     respondent.gender     ?? ""],
        ["District",   respondent.district   ?? ""],
        ["Occupation", respondent.occupation ?? ""],
      ];
      const rSheet = XLSX.utils.aoa_to_sheet(rRows);
      rSheet["!cols"] = [{ wch: 15 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, rSheet, "Respondent");
    }

    XLSX.writeFile(wb, `interview-report-${Date.now()}.xlsx`);
  };

  const copySummary = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const studyLabel = STUDY_OPTIONS.find((s) => s.id === study?.studyType)?.label;

  if (isRespondentMode) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--inv)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg viewBox="0 0 12 12" fill="none" width={24} height={24}><path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 400, color: "var(--txt)", marginBottom: 16 }}>Interview Complete</h1>
          <p style={{ fontSize: 15, color: "var(--txt2)", lineHeight: 1.6, fontWeight: 300 }}>
            Thank you for participating! You have finished the interview. You can safely close this screen now. Your results will be processed and sent via mail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", gridTemplateColumns: "220px 1fr" }} className="summary-grid">
      {/* Sidebar */}
      <div style={{ background: "var(--bg2)", borderRight: "1px solid var(--border)", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }} className="summary-sidebar">
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
            <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid var(--border2)", background: "var(--bg2)", color: "var(--txt2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              <Download size={13}/> Export Excel
            </button>
          </div>
        </div>

        {/* Respondent chips */}
        {respondent && (respondent.name || respondent.age || respondent.gender || respondent.district || respondent.occupation) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 36 }}>
            {[
              { label: "Name",       val: respondent.name       },
              { label: "Age",        val: respondent.age        },
              { label: "Gender",     val: respondent.gender     },
              { label: "District",   val: respondent.district   },
              { label: "Occupation", val: respondent.occupation },
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
  customGuide?: string | null;
  sessionToken?: string;

}

export default function ChatInterface({ preConfig }: { preConfig?: PreConfig }) {
  const [input, setInput]             = useState("");
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [revealedWords, setRevealedWords] = useState(-1);
  const [seconds, setSeconds]         = useState(0);
  const [isMobile, setIsMobile]       = useState(false);

  const bottomRef      = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const stopAudioRef   = useRef<(() => void) | null>(null);
  const taRef          = useRef<HTMLTextAreaElement>(null);
  const autoStarted    = useRef(false);
  const analyserRef    = useRef<AnalyserNode | null>(null);

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
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
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
      preConfig.customGuide,
      preConfig.sessionToken

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
      (n) => setRevealedWords(n),
      analyserRef,
    );
    stopAudioRef.current = cleanup;
  }, [language]);

  const lastAssistantMsg = messages.filter((m) => m.role === "assistant").at(-1);
  const spokenRef = useRef<number>(-1);

  useEffect(() => {
    if (!lastAssistantMsg?.content || isLoading) return;
    const idx = messages.length - 1;
    if (spokenRef.current !== idx) { spokenRef.current = idx; speak(lastAssistantMsg.content); }
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
  if (status === "finished") return <SummaryScreen summary={summary} isSummarizing={isSummarizing} study={study} respondent={respondent} messages={messages} onReset={reset} isRespondentMode={!!preConfig} />;

  return (
    <div style={{
      display: isMobile ? "flex" : "grid",
      flexDirection: isMobile ? "column" : undefined,
      gridTemplateColumns: isMobile ? undefined : "1fr 400px",
      height: "100vh", overflow: "hidden",
    }}>

      {/* ── LEFT: avatar side ── */}
      <div style={{
        display: "flex", flexDirection: "column",
        height: isMobile ? "42vh" : "100%",
        minHeight: isMobile ? 220 : undefined,
        flexShrink: 0,
        borderRight: isMobile ? "none" : "1px solid var(--border)",
        borderBottom: isMobile ? "1px solid rgba(255,255,255,0.08)" : "none",
        overflow: "hidden", background: "#0d0d0f",
      }}>

        {/* Topbar */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(13,13,15,0.85)", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 99, background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.30)", fontSize: 11, fontWeight: 600, color: "#4ade80", letterSpacing: "0.05em" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", animation: "blink 1.6s infinite", display: "inline-block" }} />
              LIVE
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{timerStr}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>

            <button
              title="End session"
              onClick={endInterview}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.18)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; }}
            >
              <PhoneOff size={13} />
            </button>
          </div>
        </div>

        {/* Avatar portrait */}
        <div style={{ flex: 1, position: "relative", minHeight: 0, overflow: "hidden" }}>
          <InterviewAvatar
            isSpeaking={isSpeaking}
            isListening={isListening}
            language={LOCALE_BCP47[language]}
            speakText={isSpeaking ? (messages.filter(m => m.role === "assistant").at(-1)?.content ?? null) : null}
            analyserRef={analyserRef}
          />

          {/* Bottom gradient overlay */}
          <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 220, pointerEvents: "none", background: "linear-gradient(to top, rgba(13,13,15,0.95) 0%, transparent 100%)" }} />

          {/* Name / status / waveform overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5, padding: "0 28px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 500, color: "#ffffff", letterSpacing: "-0.01em" }}>Mrs Dissanayake</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", fontWeight: 300, marginTop: 3 }}>Market Research Interviewer</div>
            </div>

            {/* Waveform */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, height: 20, opacity: isSpeaking ? 1 : 0.25, transition: "opacity 0.35s" }}>
              <span className="wb wb-1" /><span className="wb wb-2" /><span className="wb wb-3" />
              <span className="wb wb-4" /><span className="wb wb-5" /><span className="wb wb-6" /><span className="wb wb-7" />
            </div>

            {/* Status pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              <span style={{ ...statusDotStyle, background: isSpeaking ? "#4ade80" : isLoading ? "#fbbf24" : isListening ? "#60a5fa" : "rgba(255,255,255,0.25)" }} />
              {statusLabel}
            </div>

            {/* Study chip */}
            {study && (
              <div style={{ padding: "6px 14px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11.5, color: "rgba(255,255,255,0.40)", letterSpacing: "0.02em" }}>
                {study.productCategory} · {STUDY_OPTIONS.find((s) => s.id === study.studyType)?.label}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: chat-side ── */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, height: isMobile ? "auto" : "100vh", minHeight: 0, background: "var(--bg)" }}>
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

"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  startTransition,
} from "react";
import MessageBubble from "./MessageBubble";
import { useInterviewStore } from "@/features/interview/interview.store";
import type { Locale, StudyType, StudyContext, RespondentDetails } from "@/types";

const Avatar3D = dynamic(() => import("@/components/avatar/Avatar3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-20 w-20 animate-pulse rounded-full bg-teal-700/40" />
    </div>
  ),
});

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
};

const LOCALE_BCP47: Record<Locale, string> = {
  en: "en-US",
  si: "si-LK",
  ta: "ta-IN",
};

const STUDY_OPTIONS: { id: StudyType; label: string; description: string; icon: string }[] = [
  {
    id: "behavioral",
    label: "Behavioral Insights",
    description: "Habits, usage occasions & routines",
    icon: "🔄",
  },
  {
    id: "decision_journey",
    label: "Decision Journey",
    description: "Why they choose Brand A vs B",
    icon: "🧭",
  },
  {
    id: "pain_points",
    label: "Pain Points",
    description: "Frustrations & unmet needs",
    icon: "⚡",
  },
  {
    id: "perception",
    label: "Perception Tracking",
    description: "Brand image, trust & quality",
    icon: "🎯",
  },
  {
    id: "concept_testing",
    label: "Concept Testing",
    description: "Reactions to new products",
    icon: "💡",
  },
];

async function playTTS(
  text: string,
  onStart: () => void,
  onEnd: () => void,
  lang: string
): Promise<() => void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onplay = onStart;
    audio.onended = () => { onEnd(); URL.revokeObjectURL(url); };
    audio.onerror = () => { onEnd(); URL.revokeObjectURL(url); };
    audio.play().catch(() => onEnd());
    return () => { audio.pause(); onEnd(); URL.revokeObjectURL(url); };
  } catch {
    if (typeof window === "undefined") return () => {};
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.onstart = onStart;
    utter.onend = onEnd;
    utter.onerror = onEnd;
    window.speechSynthesis.speak(utter);
    return () => { window.speechSynthesis.cancel(); onEnd(); };
  }
}

function renderSummary(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="mt-6 mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h4 key={i} className="mt-3 mb-1 font-semibold text-slate-800 dark:text-slate-200">
          {line.slice(4)}
        </h4>
      );
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="ml-5 list-disc text-slate-700 dark:text-slate-300">
          {line.slice(2)}
        </li>
      );
    }
    if (line.startsWith('"') && line.endsWith('"')) {
      return (
        <blockquote key={i} className="my-2 border-l-4 border-teal-500 pl-3 italic text-slate-600 dark:text-slate-400">
          {line}
        </blockquote>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    const boldParts = line.split(/\*\*(.*?)\*\*/g);
    if (boldParts.length > 1) {
      return (
        <p key={i} className="text-slate-700 dark:text-slate-300">
          {boldParts.map((p, j) =>
            j % 2 === 1 ? <strong key={j}>{p}</strong> : p
          )}
        </p>
      );
    }
    return <p key={i} className="text-slate-700 dark:text-slate-300">{line}</p>;
  });
}

/* ─────────────────────────────────────────────────────────── */
/* SETUP SCREEN                                                */
/* ─────────────────────────────────────────────────────────── */
function SetupScreen({
  onStart,
}: {
  onStart: (lang: Locale, study: StudyContext, respondent?: RespondentDetails) => void;
}) {
  const [lang, setLang] = useState<Locale>("en");
  const [product, setProduct] = useState("");
  const [studyType, setStudyType] = useState<StudyType>("behavioral");
  const [respondentName, setRespondentName] = useState("");
  const [respondentAge, setRespondentAge] = useState("");
  const [respondentGender, setRespondentGender] = useState("");
  const [respondentDistrict, setRespondentDistrict] = useState("");

  const canStart = product.trim().length > 0;

  const handleStart = () => {
    const respondent: RespondentDetails = {};
    if (respondentName.trim())     respondent.name     = respondentName.trim();
    if (respondentAge.trim())      respondent.age      = respondentAge.trim();
    if (respondentGender.trim())   respondent.gender   = respondentGender.trim();
    if (respondentDistrict.trim()) respondent.district = respondentDistrict.trim();
    onStart(lang, { productCategory: product.trim(), studyType }, respondent);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-linear-to-br from-teal-950 via-teal-900 to-slate-900 px-4 py-12">
      {/* Header branding */}
      <div className="mb-8 text-center">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-800/60 px-4 py-1.5 text-xs font-medium text-teal-200 ring-1 ring-teal-700/50">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" />
          AI Consumer Research
        </span>
        <h1 className="text-3xl font-bold text-white">Ready to begin?</h1>
        <p className="mt-2 text-sm text-teal-200/70">
          Configure your research session below
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm">
        {/* Avatar preview */}
        <div className="mb-6 flex items-center gap-4 rounded-xl bg-teal-900/40 px-4 py-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white shadow">
            D
          </div>
          <div>
            <p className="font-semibold text-white">Mrs Dissanayake</p>
            <p className="text-xs text-teal-300">
              Professional Market Researcher · Sri Lanka
            </p>
          </div>
          <div className="ml-auto flex gap-1">
            <span className="wave-bar-1 inline-block w-1 rounded-full bg-teal-400" style={{ height: 6 }} />
            <span className="wave-bar-2 inline-block w-1 rounded-full bg-teal-400" style={{ height: 10 }} />
            <span className="wave-bar-3 inline-block w-1 rounded-full bg-teal-400" style={{ height: 4 }} />
            <span className="wave-bar-4 inline-block w-1 rounded-full bg-teal-400" style={{ height: 10 }} />
            <span className="wave-bar-5 inline-block w-1 rounded-full bg-teal-400" style={{ height: 6 }} />
          </div>
        </div>

        {/* Language */}
        <div className="mb-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-teal-300">
            Interview Language
          </label>
          <div className="flex gap-2">
            {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(
              ([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    lang === code
                      ? "bg-teal-600 text-white shadow"
                      : "bg-white/10 text-teal-100 hover:bg-white/20"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Product category */}
        <div className="mb-5">
          <label
            htmlFor="product-input"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-teal-300"
          >
            Product Category
          </label>
          <input
            id="product-input"
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g. shampoo, biscuits, mobile data plans…"
            className="w-full rounded-lg bg-white/10 px-4 py-2.5 text-sm text-white placeholder-teal-300/50 outline-none ring-1 ring-white/20 focus:ring-teal-400 transition-all"
          />
        </div>

        {/* Study type */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-teal-300">
            Study Type
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STUDY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStudyType(opt.id)}
                className={`rounded-lg px-3 py-2.5 text-left transition-all ${
                  studyType === opt.id
                    ? "bg-teal-600 text-white ring-2 ring-teal-400 shadow-md"
                    : "bg-white/10 text-teal-100 hover:bg-white/20"
                }`}
              >
                <span className="text-base">{opt.icon}</span>
                <p className="mt-1 text-xs font-semibold">{opt.label}</p>
                <p className="text-[11px] opacity-70">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Respondent details */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-teal-300">
            Respondent Details <span className="font-normal normal-case text-teal-400/60">(optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] text-teal-300/70">Name</label>
              <input
                type="text"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Respondent name"
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs text-white placeholder-teal-300/40 outline-none ring-1 ring-white/15 focus:ring-teal-400 transition-all"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-teal-300/70">Age</label>
              <input
                type="text"
                value={respondentAge}
                onChange={(e) => setRespondentAge(e.target.value)}
                placeholder="e.g. 28"
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs text-white placeholder-teal-300/40 outline-none ring-1 ring-white/15 focus:ring-teal-400 transition-all"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-teal-300/70">Gender</label>
              <select
                value={respondentGender}
                onChange={(e) => setRespondentGender(e.target.value)}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs text-white outline-none ring-1 ring-white/15 focus:ring-teal-400 transition-all"
              >
                <option value="" className="bg-slate-900">Select…</option>
                <option value="Female" className="bg-slate-900">Female</option>
                <option value="Male" className="bg-slate-900">Male</option>
                <option value="Other" className="bg-slate-900">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-teal-300/70">District</label>
              <input
                type="text"
                value={respondentDistrict}
                onChange={(e) => setRespondentDistrict(e.target.value)}
                placeholder="e.g. Colombo"
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs text-white placeholder-teal-300/40 outline-none ring-1 ring-white/15 focus:ring-teal-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          disabled={!canStart}
          onClick={handleStart}
          className="w-full rounded-xl bg-teal-500 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Begin Interview Session →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* SUMMARY SCREEN                                              */
/* ─────────────────────────────────────────────────────────── */
function SummaryScreen({
  summary,
  isSummarizing,
  study,
  respondent,
  messages,
  onReset,
}: {
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
    a.href     = url;
    a.download = `interview-transcript-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            Interview Complete
          </p>
          {study && (
            <p className="text-xs text-slate-500">
              {study.productCategory} ·{" "}
              {STUDY_OPTIONS.find((s) => s.id === study.studyType)?.label}
              {respondent?.name && ` · ${respondent.name}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <button
              onClick={copySummary}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {copied ? "✓ Copied" : "Copy Summary"}
            </button>
          )}
          <button
            onClick={exportCSV}
            className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300"
          >
            Export CSV
          </button>
          <button
            onClick={onReset}
            className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
          >
            + New Interview
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {/* Respondent card */}
        {respondent && (respondent.name || respondent.age || respondent.gender || respondent.district) && (
          <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="w-full text-xs font-semibold uppercase tracking-wider text-slate-400">Respondent</p>
            {respondent.name     && <Chip label="Name"     value={respondent.name} />}
            {respondent.age      && <Chip label="Age"      value={respondent.age} />}
            {respondent.gender   && <Chip label="Gender"   value={respondent.gender} />}
            {respondent.district && <Chip label="District" value={respondent.district} />}
          </div>
        )}

        {isSummarizing ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-teal-500" />
            </div>
            <p className="text-sm text-slate-500">
              Generating research summary…
            </p>
          </div>
        ) : summary ? (
          <div>
            <div className="mb-6 rounded-xl bg-teal-50 px-5 py-4 ring-1 ring-teal-200 dark:bg-teal-950/30 dark:ring-teal-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Research Report
              </p>
              <p className="mt-0.5 text-sm text-teal-800 dark:text-teal-300">
                {study?.productCategory} — {STUDY_OPTIONS.find((s) => s.id === study?.studyType)?.label}
              </p>
            </div>
            <div className="prose-sm max-w-none rounded-xl bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              {renderSummary(summary)}
            </div>
          </div>
        ) : (
          <div className="py-24 text-center text-slate-500">
            Summary unavailable. The interview data may not have been processed.
          </div>
        )}
      </main>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">
      <span className="text-slate-400">{label}:</span>
      <span className="font-medium text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* MAIN COMPONENT                                              */
/* ─────────────────────────────────────────────────────────── */
export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const stopAudioRef = useRef<(() => void) | null>(null);

  const {
    messages,
    status,
    isLoading,
    isSummarizing,
    language,
    study,
    respondent,
    summary,
    showClosingBanner,
    startInterview,
    sendUserMessage,
    endInterview,
    reset,
  } = useInterviewStore();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      startTransition(() => setMicSupported(true));
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const speak = useCallback(
    async (text: string) => {
      stopAudioRef.current?.();
      stopAudioRef.current = null;
      const cleanup = await playTTS(
        text,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        LOCALE_BCP47[language]
      );
      stopAudioRef.current = cleanup;
    },
    [language]
  );

  const lastAssistantMsg = messages.filter((m) => m.role === "assistant").at(-1);
  const spokenRef = useRef<string>("");
  useEffect(() => {
    if (lastAssistantMsg && lastAssistantMsg.content !== spokenRef.current) {
      spokenRef.current = lastAssistantMsg.content;
      speak(lastAssistantMsg.content);
    }
  }, [lastAssistantMsg, speak]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendUserMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    if (isLoading) return; // don't start while AI is responding
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = LOCALE_BCP47[language];
    recognition.continuous = false;
    recognition.interimResults = false;

    /* Capture transcript in closure so onend sees the latest value */
    let captured = "";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: { results: { [x: number]: { [x: number]: { transcript: string } } } }) => {
      captured = event.results[0]?.[0]?.transcript ?? "";
      setInput(captured); /* show briefly in input */
    };
    recognition.onerror = () => {
      setIsListening(false);
      captured = "";
    };
    recognition.onend = () => {
      setIsListening(false);
      if (captured.trim()) {
        setInput(""); /* clear field */
        sendUserMessage(captured.trim()); /* auto-send */
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const messageCount = messages.length;
  const progressPct = Math.min(100, Math.round((messageCount / 20) * 100));
  const progressLabel =
    messageCount <= 2
      ? "Introduction"
      : messageCount <= 6
      ? "Background"
      : messageCount <= 12
      ? "Deep Dive"
      : "Insights Capture";

  /* ── Render states ── */
  if (status === "idle") {
    return <SetupScreen onStart={startInterview} />;
  }

  if (status === "finished") {
    return (
      <SummaryScreen
        summary={summary}
        isSummarizing={isSummarizing}
        study={study}
        respondent={respondent}
        messages={messages}
        onReset={reset}
      />
    );
  }

  /* ── Active interview ── */
  return (
    <div className="flex h-screen flex-col bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
            D
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Mrs Dissanayake
            </p>
            <p className="text-xs text-slate-400">
              {isSpeaking ? "Speaking…" : isLoading ? "Thinking…" : "Consumer Research Interview"}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="hidden sm:flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{progressLabel}</span>
            <span className="text-slate-300">·</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-400 sm:block">
            {LOCALE_LABELS[language]}
          </span>
          {isSpeaking && (
            <span className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-xs text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
              Speaking
            </span>
          )}
          <button
            onClick={endInterview}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          >
            End & Get Summary
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Avatar sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col items-center justify-between border-r border-slate-200 bg-linear-to-b from-teal-900 to-slate-900 p-5 dark:border-slate-800 lg:flex">
          <div className="w-full flex-1">
            <div className="relative h-56 w-full overflow-hidden rounded-2xl">
              {isSpeaking && (
                <div className="speak-ring pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-teal-400/60 z-10" />
              )}
              <Avatar3D isSpeaking={isSpeaking} />
            </div>

            {/* Waveform */}
            <div className="mt-3 flex items-end justify-center gap-1 h-6">
              {isSpeaking ? (
                <>
                  <span className="wave-bar-1 inline-block w-1.5 rounded-full bg-teal-400" style={{ height: 6 }} />
                  <span className="wave-bar-2 inline-block w-1.5 rounded-full bg-teal-400" style={{ height: 10 }} />
                  <span className="wave-bar-3 inline-block w-1.5 rounded-full bg-teal-400" style={{ height: 4 }} />
                  <span className="wave-bar-4 inline-block w-1.5 rounded-full bg-teal-400" style={{ height: 10 }} />
                  <span className="wave-bar-5 inline-block w-1.5 rounded-full bg-teal-400" style={{ height: 6 }} />
                </>
              ) : isLoading ? (
                <span className="text-xs text-teal-400/60 animate-pulse">processing…</span>
              ) : (
                <span className="text-xs text-teal-500/40">listening</span>
              )}
            </div>
          </div>

          <div className="w-full text-center">
            <p className="font-semibold text-white text-sm">Mrs Dissanayake</p>
            <p className="text-xs text-teal-300/70 mt-0.5">Market Research Interviewer</p>
            {study && (
              <div className="mt-3 rounded-lg bg-teal-800/40 px-3 py-2 text-left ring-1 ring-teal-700/30">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                  Study
                </p>
                <p className="text-xs text-teal-100 mt-0.5 font-medium">
                  {study.productCategory}
                </p>
                <p className="text-[11px] text-teal-300/70 mt-0.5">
                  {STUDY_OPTIONS.find((s) => s.id === study.studyType)?.label}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Closing banner */}
          {showClosingBanner && (
            <div className="shrink-0 flex items-center justify-between bg-teal-50 border-b border-teal-200 px-5 py-3 dark:bg-teal-950/40 dark:border-teal-800">
              <p className="text-sm text-teal-800 dark:text-teal-300">
                ✓ Interview concluded — ready for your research summary.
              </p>
              <button
                onClick={endInterview}
                className="ml-4 rounded-full bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 transition-colors"
              >
                View Summary →
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {isLoading && (
                <div className="flex items-end gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                    D
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input bar */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
            <div className="mx-auto flex max-w-2xl items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer… (Enter to send)"
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
              />
              {micSupported && (
                <button
                  onClick={handleMic}
                  aria-label={isListening ? "Stop recording" : "Start recording"}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all ${
                    isListening
                      ? "animate-pulse border-red-400 bg-red-50 text-red-500"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <MicIcon />
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

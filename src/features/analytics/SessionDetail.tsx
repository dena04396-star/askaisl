"use client";

import { useState } from "react";
import type { SessionRow, TranscriptEntry } from "@/types";
import { formatDate } from "@/lib/utils/helpers";
import { ArrowLeft, Download, Users, MessageCircle, Copy, Check, Link } from "lucide-react";
import * as XLSX from "xlsx";

const STUDY_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  decision_journey: "Decision Journey",
  pain_points: "Pain Points",
  perception: "Perception",
  concept_testing: "Concept Testing",
};

const LANG_LABELS: Record<string, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
};

interface Props {
  session: SessionRow;
  transcripts: TranscriptEntry[];
  onBack: () => void;
}

/** Full drill-down view for a single session — shows metadata, stats, and every respondent's conversation. */
export function SessionDetail({ session, transcripts, onBack }: Props) {
  const [copied, setCopied] = useState(false);

  const totalMessages = transcripts.reduce(
    (n, t) => n + t.messages.filter((m) => m.role !== "system").length,
    0
  );

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/session/${session.token}`
      : `/session/${session.token}`;

  function copyShareLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function exportToExcel() {
    const wb = XLSX.utils.book_new();
    transcripts.forEach((t, i) => {
      const rows = [
        ["Speaker", "Message"],
        ...t.messages
          .filter((m) => m.role !== "system")
          .map((m) => [
            m.role === "assistant" ? "Interviewer" : "Respondent",
            m.content,
          ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 15 }, { wch: 90 }];
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        transcripts.length > 1 ? `Respondent ${i + 1}` : "Transcript"
      );
    });
    XLSX.writeFile(wb, `${session.title.replace(/[^a-zA-Z0-9]/g, "-")}-data.xlsx`);
  }

  function exportAllAsJSON() {
    const data = {
      session: {
        title: session.title,
        category: session.product_category,
        studyType: STUDY_LABELS[session.study_type] ?? session.study_type,
        language: LANG_LABELS[session.language] ?? session.language,
        status: session.status,
        createdAt: session.created_at,
      },
      respondents: transcripts.map((t, i) => ({
        respondent: i + 1,
        date: t.createdAt,
        messages: t.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            speaker: m.role === "assistant" ? "Interviewer" : "Respondent",
            text: m.content,
          })),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title.replace(/[^a-zA-Z0-9]/g, "-")}-full.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium cursor-pointer"
          style={{ background: "none", border: "none", color: "var(--txt2)", fontFamily: "inherit" }}
        >
          <ArrowLeft size={15} /> Back to all sessions
        </button>
        <div className="flex items-center gap-3">
          <button onClick={copyShareLink} className="vt-btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13 }}>
            {copied ? <><Check size={13} /> Copied!</> : <><Link size={13} /> Copy Link</>}
          </button>
          {transcripts.length > 0 && (
            <>
              <button onClick={exportToExcel} className="vt-btn-ghost"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13 }}>
                <Download size={13} /> Export Excel
              </button>
              <button onClick={exportAllAsJSON} className="vt-btn-ghost"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13 }}>
                <Download size={13} /> Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Share link card ── */}
      <div className="flex items-center gap-3 p-4 rounded-xl border"
        style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <Copy size={14} style={{ color: "var(--txt3)", flexShrink: 0 }} />
        <code className="text-xs flex-1 truncate" style={{ color: "var(--txt2)", fontFamily: "monospace" }}>
          {shareUrl}
        </code>
        <button onClick={copyShareLink} className="text-xs font-medium cursor-pointer shrink-0"
          style={{ background: "none", border: "none", color: "var(--txt)", fontFamily: "inherit" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* ── Session info card ── */}
      <div className="p-6 rounded-2xl border"
        style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <h2 className="text-xl font-normal mb-4"
          style={{ fontFamily: "var(--font-serif)", color: "var(--txt)" }}>
          {session.title}
        </h2>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm" style={{ color: "var(--txt2)" }}>
          <InfoPill label="Category" value={session.product_category} />
          <InfoPill label="Study" value={STUDY_LABELS[session.study_type] ?? session.study_type} />
          <InfoPill label="Language" value={LANG_LABELS[session.language] ?? session.language} />
          <InfoPill label="Status" value={session.status} />
          <InfoPill label="Created" value={formatDate(session.created_at)} />
        </div>
        <div className="flex gap-6 mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <StatChip icon={Users} label="Respondents" value={transcripts.length} />
          <StatChip icon={MessageCircle} label="Messages" value={totalMessages} />
        </div>
      </div>

      {/* ── Respondent conversations ── */}
      {transcripts.length === 0 ? (
        <div className="py-14 text-center rounded-2xl border border-dashed"
          style={{ borderColor: "var(--border2)" }}>
          <p className="text-sm" style={{ color: "var(--txt3)" }}>
            No respondents have completed this session yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {transcripts.map((t, idx) => (
            <RespondentCard key={idx} transcript={t} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Small helper components ── */

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5"
        style={{ color: "var(--txt3)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--txt)" }}>{value}</span>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} style={{ color: "var(--txt3)" }} />
      <span className="text-sm" style={{ color: "var(--txt2)" }}>
        <strong className="font-semibold" style={{ color: "var(--txt)" }}>{value}</strong> {label}
      </span>
    </div>
  );
}

function RespondentCard({ transcript, index }: { transcript: TranscriptEntry; index: number }) {
  const messages = transcript.messages.filter((m) => m.role !== "system");
  const userMsgs = messages.filter((m) => m.role === "user").length;

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
      {/* Card header */}
      <div className="px-5 py-3.5 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <span className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--txt2)" }}>
          Respondent {index + 1}
        </span>
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--txt3)" }}>
          <span>{userMsgs} answers</span>
          <span>{formatDate(transcript.createdAt)}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 400 }}>
        {messages.map((m, j) => (
          <div key={j} className="flex gap-2.5"
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
                background: m.role === "assistant" ? "var(--bg)" : "var(--inv)",
                color: m.role === "assistant" ? "var(--txt)" : "var(--inv-txt)",
                borderColor: m.role === "assistant" ? "var(--border)" : "transparent",
              }}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

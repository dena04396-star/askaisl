"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Plus, X, ChevronDown, ChevronUp, Trash2, Download, FileText, Archive } from "lucide-react";
import * as XLSX from "xlsx-js-style";
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

const HDR = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1A1A2E" } }, alignment: { wrapText: true } };
const IV  = { fill: { fgColor: { rgb: "EEF2FF" } }, alignment: { wrapText: true, vertical: "top" } };
const RES = { fill: { fgColor: { rgb: "F0FDF4" } }, alignment: { wrapText: true, vertical: "top" } };

function generateToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  return Math.random().toString(36).slice(2, 22);
}

/* Keep only complete (non-prefix) conversations — removes incremental partial saves */
function deduplicateTranscripts(raw: TranscriptEntry[]): TranscriptEntry[] {
  const bySession = new Map<string, TranscriptEntry[]>();
  for (const t of raw) {
    if (!bySession.has(t.sessionId)) bySession.set(t.sessionId, []);
    bySession.get(t.sessionId)!.push(t);
  }
  const result: TranscriptEntry[] = [];
  for (const entries of bySession.values()) {
    entries.sort((a, b) => b.messages.length - a.messages.length);
    const kept: TranscriptEntry[] = [];
    for (const entry of entries) {
      const isPrefix = kept.some(k =>
        entry.messages.length <= k.messages.length &&
        entry.messages.every((m, i) =>
          k.messages[i]?.role === m.role && k.messages[i]?.content === m.content
        )
      );
      if (!isPrefix) kept.push(entry);
    }
    result.push(...kept);
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function styleSheet(sheet: any, rows: string[][]) {
  rows.forEach((row, ri) => {
    ["A","B","C"].forEach(col => {
      const ref = `${col}${ri + 1}`;
      if (!sheet[ref]) return;
      sheet[ref].s = ri === 0 ? HDR : row[1] === "Mrs Dissanayake" ? IV : RES;
    });
  });
}

function xlsxDownload(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

function buildExcelWorkbook(session: SessionRow, sessionTranscripts: TranscriptEntry[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const infoRows = [
    ["Field", "Value"],
    ["Title",            session.title],
    ["Product Category", session.product_category],
    ["Study Type",       session.study_type],
    ["Language",         session.language],
    ["Status",           session.status],
    ["Created",          new Date(session.created_at).toLocaleString()],
    ["Respondents",      String(sessionTranscripts.length)],
  ];
  const infoSheet = XLSX.utils.aoa_to_sheet(infoRows);
  infoSheet["!cols"] = [{ wch: 22 }, { wch: 42 }];
  ["A1","B1"].forEach(ref => { if (infoSheet[ref]) infoSheet[ref].s = HDR; });
  XLSX.utils.book_append_sheet(wb, infoSheet, "Session Info");

  sessionTranscripts.forEach((t, i) => {
    const rows: string[][] = [["#", "Speaker", "Message"]];
    t.messages.filter(m => m.role !== "system").forEach((m, j) => {
      rows.push([String(j + 1), m.role === "assistant" ? "Mrs Dissanayake" : "Respondent", m.content ?? ""]);
    });
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = [{ wch: 4 }, { wch: 20 }, { wch: 90 }];
    styleSheet(sheet, rows);
    const name = `Respondent ${i + 1}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, sheet, name);
  });

  return wb;
}

async function buildWordDoc(session: SessionRow, sessionTranscripts: TranscriptEntry[]) {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle,
  } = await import("docx");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [];

  /* ── Cover block ── */
  children.push(new Paragraph({
    children: [new TextRun({ text: session.title, bold: true, size: 52, color: "0F0F1A", font: "Calibri Light" })],
    spacing: { before: 0, after: 200 },
  }));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: session.product_category, size: 24, color: "5B5BD6", font: "Calibri" }),
      new TextRun({ text: `  ·  ${session.study_type.replace(/_/g, " ")}  ·  ${session.language.toUpperCase()}`, size: 24, color: "888888", font: "Calibri" }),
    ],
    spacing: { after: 120 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `${sessionTranscripts.length} respondent${sessionTranscripts.length !== 1 ? "s" : ""}  ·  Generated ${new Date().toLocaleDateString()}`, size: 20, color: "AAAAAA", font: "Calibri" })],
    spacing: { after: 600 },
  }));

  /* ── One section per respondent ── */
  sessionTranscripts.forEach((t, i) => {
    children.push(new Paragraph({
      children: [new TextRun({ text: `Respondent ${i + 1}`, bold: true, size: 32, color: "FFFFFF", font: "Calibri" })],
      shading: { type: ShadingType.SOLID, color: "1A1A2E" },
      spacing: { before: i === 0 ? 0 : 600, after: 0 },
      indent: { left: 200, right: 200 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: new Date(t.createdAt).toLocaleString(), size: 18, color: "AAAAAA", font: "Calibri" })],
      spacing: { before: 80, after: 240 },
    }));

    /* Transcript table */
    const msgs = t.messages.filter(m => m.role !== "system");
    const tableRows = msgs.map(m => {
      const isAI = m.role === "assistant";
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: isAI ? "Mrs Dissanayake" : "Respondent", bold: true, size: 20, color: isAI ? "4444CC" : "2E7D32", font: "Calibri" })] })],
            width: { size: 22, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: isAI ? "EEF2FF" : "F0FDF4" },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            borders: {
              top:    { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              left:   { style: BorderStyle.NONE },
              right:  { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: m.content ?? "", size: 20, font: "Calibri", color: "1A1A2E" })] })],
            width: { size: 78, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: isAI ? "F8F9FF" : "FAFFFE" },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            borders: {
              top:    { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              left:   { style: BorderStyle.NONE },
              right:  { style: BorderStyle.NONE },
            },
          }),
        ],
      });
    });

    if (tableRows.length > 0) {
      children.push(new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 2, color: "1A1A2E" },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: "1A1A2E" },
          left:   { style: BorderStyle.NONE },
          right:  { style: BorderStyle.NONE },
        },
      }));
    }
    children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  });

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [{ properties: {}, children }],
  });
  return Packer.toBlob(doc);
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
  const [activeTab, setActiveTab] = useState<"sessions" | "analytics">("sessions");

  const [sessions,        setSessions]        = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [copiedToken,     setCopiedToken]     = useState<string | null>(null);
  const [showCreate,      setShowCreate]      = useState(false);

  const [title,       setTitle]       = useState("");
  const [product,     setProduct]     = useState("");
  const [studyType,   setStudyType]   = useState<StudyType>("behavioral");
  const [language,    setLanguage]    = useState<Locale>("en");
  const [guide,       setGuide]       = useState("");
  const [guideOpen,   setGuideOpen]   = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState("");

  const [transcripts,     setTranscripts]     = useState<TranscriptEntry[]>([]);
  const [txLoading,       setTxLoading]       = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getBrowserClient()
      .from("interview_sessions")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const unique = (data ?? []).reduce((acc: SessionRow[], curr: SessionRow) => {
          if (!acc.find(s => s.token === curr.token)) acc.push(curr);
          return acc;
        }, []);
        setSessions(unique);
        setSessionsLoading(false);
      });
  }, [user]);

  useEffect(() => {
    fetch("/api/transcript")
      .then(r => r.json())
      .then(({ transcripts }) => setTranscripts(deduplicateTranscripts(transcripts ?? [])))
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
    setSessions(prev => [data as SessionRow, ...prev]);
    resetCreate();
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/session/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  async function deleteSession(id: string, token: string) {
    if (!confirm("Permanently delete this session and its data?")) return;
    const { error } = await getBrowserClient().from("interview_sessions").delete().eq("id", id);
    if (!error) {
      setSessions(s => s.filter(x => x.id !== id));
      setTranscripts(t => t.filter(x => x.sessionId !== token));
    }
  }

  function downloadExcel(s: SessionRow) {
    const st = transcripts.filter(t => t.sessionId === s.token);
    if (!st.length) return;
    xlsxDownload(buildExcelWorkbook(s, st), `${s.title.replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`);
  }

  async function downloadWord(s: SessionRow) {
    const st = transcripts.filter(t => t.sessionId === s.token);
    if (!st.length) return;
    const blob = await buildWordDoc(s, st);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${s.title.replace(/[^a-zA-Z0-9]/g, "-")}.docx`; a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadBulkExcel() {
    setBulkDownloading(true);
    try {
      const wb = XLSX.utils.book_new();
      const summaryRows: string[][] = [["Session", "Product", "Study Type", "Language", "Respondents", "Created"]];
      const sessionsWithData = sessions.filter(s => transcripts.some(t => t.sessionId === s.token));

      sessionsWithData.forEach(s => {
        const st = transcripts.filter(t => t.sessionId === s.token);
        summaryRows.push([s.title, s.product_category, s.study_type, s.language, String(st.length), new Date(s.created_at).toLocaleDateString()]);

        st.forEach((t, i) => {
          const rows: string[][] = [["#", "Speaker", "Message"]];
          t.messages.filter(m => m.role !== "system").forEach((m, j) => {
            rows.push([String(j + 1), m.role === "assistant" ? "Mrs Dissanayake" : "Respondent", m.content ?? ""]);
          });
          const sheet = XLSX.utils.aoa_to_sheet(rows);
          sheet["!cols"] = [{ wch: 4 }, { wch: 20 }, { wch: 90 }];
          styleSheet(sheet, rows);
          const base = s.title.slice(0, 18).replace(/[^a-zA-Z0-9]/g, " ").trim();
          const sheetName = `${base} R${i + 1}`.slice(0, 31);
          XLSX.utils.book_append_sheet(wb, sheet, sheetName || `Sheet${wb.SheetNames.length + 1}`);
        });
      });

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      summarySheet["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 16 }];
      summaryRows.forEach((_, ri) => {
        ["A","B","C","D","E","F"].forEach(col => {
          const ref = `${col}${ri + 1}`;
          if (summarySheet[ref]) summarySheet[ref].s = ri === 0 ? HDR : { alignment: { wrapText: true } };
        });
      });
      // Insert summary as first sheet by prepending
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, summarySheet, "All Sessions");
      (wb.SheetNames ?? []).forEach(name => {
        XLSX.utils.book_append_sheet(newWb, wb.Sheets[name], name);
      });

      xlsxDownload(newWb, `askaisl-all-sessions-${new Date().toISOString().slice(0,10)}.xlsx`);
    } finally {
      setBulkDownloading(false);
    }
  }

  async function downloadBulkWord() {
    setBulkDownloading(true);
    try {
      const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, WidthType, ShadingType, BorderStyle, PageBreak,
      } = await import("docx");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any[] = [];

      /* Cover page */
      children.push(new Paragraph({
        children: [new TextRun({ text: "Askaisl", bold: true, size: 72, color: "0F0F1A", font: "Calibri Light" })],
        spacing: { before: 2000, after: 200 },
        alignment: AlignmentType.CENTER,
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: "Research Report", size: 36, color: "5B5BD6", font: "Calibri Light" })],
        spacing: { after: 200 }, alignment: AlignmentType.CENTER,
      }));
      const swd = sessions.filter(s => transcripts.some(t => t.sessionId === s.token));
      children.push(new Paragraph({
        children: [new TextRun({ text: `Generated ${new Date().toLocaleDateString()}  ·  ${swd.length} session${swd.length !== 1 ? "s" : ""}`, size: 22, color: "AAAAAA", font: "Calibri" })],
        alignment: AlignmentType.CENTER, spacing: { after: 2000 },
      }));
      swd.forEach((s, si) => {
        if (si > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
        const st = transcripts.filter(t => t.sessionId === s.token);

        children.push(new Paragraph({
          children: [new TextRun({ text: s.title, bold: true, size: 48, color: "0F0F1A", font: "Calibri Light" })],
          spacing: { before: si === 0 ? 0 : 400, after: 160 },
        }));
        children.push(new Paragraph({
          children: [
            new TextRun({ text: s.product_category, size: 24, color: "5B5BD6", font: "Calibri" }),
            new TextRun({ text: `  ·  ${s.study_type.replace(/_/g, " ")}  ·  ${s.language.toUpperCase()}  ·  ${st.length} respondent${st.length !== 1 ? "s" : ""}`, size: 24, color: "888888", font: "Calibri" }),
          ],
          spacing: { after: 400 },
        }));

        st.forEach((t, i) => {
          children.push(new Paragraph({
            children: [new TextRun({ text: `Respondent ${i + 1}`, bold: true, size: 28, color: "FFFFFF", font: "Calibri" })],
            shading: { type: ShadingType.SOLID, color: "1A1A2E" },
            spacing: { before: 300, after: 0 },
            indent: { left: 160, right: 160 },
          }));
          children.push(new Paragraph({
            children: [new TextRun({ text: new Date(t.createdAt).toLocaleString(), size: 18, color: "AAAAAA", font: "Calibri" })],
            spacing: { before: 60, after: 200 },
          }));

          const msgs = t.messages.filter(m => m.role !== "system");
          if (msgs.length > 0) {
            children.push(new Table({
              rows: msgs.map(m => {
                const isAI = m.role === "assistant";
                return new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: isAI ? "Mrs Dissanayake" : "Respondent", bold: true, size: 20, color: isAI ? "4444CC" : "2E7D32", font: "Calibri" })] })],
                      width: { size: 22, type: WidthType.PERCENTAGE },
                      shading: { type: ShadingType.SOLID, color: isAI ? "EEF2FF" : "F0FDF4" },
                      margins: { top: 80, bottom: 80, left: 120, right: 120 },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: m.content ?? "", size: 20, font: "Calibri", color: "1A1A2E" })] })],
                      width: { size: 78, type: WidthType.PERCENTAGE },
                      shading: { type: ShadingType.SOLID, color: isAI ? "F8F9FF" : "FAFFFE" },
                      margins: { top: 80, bottom: 80, left: 120, right: 120 },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                  ],
                });
              }),
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 2, color: "1A1A2E" }, bottom: { style: BorderStyle.SINGLE, size: 2, color: "1A1A2E" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }));
          }
          children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        });
      });

      const doc = new Document({
        styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
        sections: [{ children }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `askaisl-all-sessions-${new Date().toISOString().slice(0,10)}.docx`; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBulkDownloading(false);
    }
  }

  const sessionsWithData = sessions.filter(s => transcripts.some(t => t.sessionId === s.token));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--txt)" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-4 md:px-10 h-15.5 max-w-300 mx-auto">
          <Link href="/" className="flex items-center gap-2 no-underline"
            style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--txt)" }}>
            <LogoMark /> askaisl
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex gap-4">
              {(["sessions","analytics"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14,
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? "var(--txt)" : "var(--txt2)",
                    borderBottom: activeTab === tab ? "2px solid var(--inv)" : "2px solid transparent",
                    padding: "4px 0", textTransform: "capitalize" }}>
                  {tab}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm" style={{ color: "var(--txt3)" }}>{user?.email}</span>
              <button onClick={signOut} className="vt-btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}>Sign out</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-300 mx-auto px-4 md:px-10 py-8 md:py-12">

        {/* ── Sessions tab ── */}
        {activeTab === "sessions" && (
          <section>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px,3vw,40px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, color: "var(--txt)" }}>
                  Interview Sessions
                </h1>
                <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, marginTop: 6 }}>Create a session and share the link with your respondent.</p>
              </div>
              <button onClick={() => setShowCreate(v => !v)} className="vt-btn-solid"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                {showCreate ? <><X size={14}/> Cancel</> : <><Plus size={14}/> New Session</>}
              </button>
            </div>

            {showCreate && (
              <div className="mb-8 p-6 md:p-8 rounded-2xl border"
                style={{ background: "var(--bg2)", borderColor: "var(--border2)" }}>
                <h2 className="text-xl font-normal mb-6" style={{ fontFamily: "var(--font-serif)" }}>New Interview Session</h2>
                <form onSubmit={handleCreate}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--txt2)" }}>Title</label>
                      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q2 Shampoo Research" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--txt2)" }}>Product Category *</label>
                      <input type="text" value={product} onChange={e => setProduct(e.target.value)} required placeholder="e.g. shampoo, biscuits…" className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--txt2)" }}>Study Type</label>
                    <div className="flex flex-wrap gap-2">
                      {STUDY_OPTIONS.map(o => (
                        <button type="button" key={o.id} onClick={() => setStudyType(o.id)}
                          style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                            background: studyType === o.id ? "var(--inv)" : "var(--bg3)",
                            color: studyType === o.id ? "var(--inv-txt)" : "var(--txt)",
                            border: `1px solid ${studyType === o.id ? "transparent" : "var(--border)"}` }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--txt2)" }}>Language</label>
                    <div className="flex gap-2">
                      {LOCALES.map(l => (
                        <button type="button" key={l.id} onClick={() => setLanguage(l.id)}
                          style={{ padding: "7px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                            background: language === l.id ? "var(--inv)" : "var(--bg3)",
                            color: language === l.id ? "var(--inv-txt)" : "var(--txt)",
                            border: `1px solid ${language === l.id ? "transparent" : "var(--border)"}` }}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-5">
                    <button type="button" onClick={() => setGuideOpen(v => !v)}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--txt2)", padding: 0, marginBottom: guideOpen ? 8 : 0 }}>
                      {guideOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} Custom Discussion Guide (optional)
                    </button>
                    {guideOpen && (
                      <textarea value={guide} onChange={e => setGuide(e.target.value)}
                        placeholder={DEFAULT_GUIDE_PLACEHOLDER} rows={6} className={inputCls}
                        style={{ ...inputStyle, fontFamily: "inherit", fontSize: 13, lineHeight: 1.6, resize: "vertical" }} />
                    )}
                  </div>
                  {createError && <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{createError}</p>}
                  <div className="flex flex-wrap gap-2.5">
                    <button type="submit" disabled={creating || !product.trim()} className="vt-btn-solid">{creating ? "Creating…" : "Create Session"}</button>
                    <button type="button" onClick={resetCreate} className="vt-btn-ghost">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {sessionsLoading ? <Dots /> : sessions.length === 0 ? (
              <EmptyState title="No sessions yet" desc="Create your first session to start collecting data." />
            ) : (
              <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                {sessions.map((s, i) => {
                  const sessionTxs = transcripts.filter(t => t.sessionId === s.token);
                  const isExpanded = expandedSession === s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr auto", alignItems: "start",
                        gap: 16, padding: "20px 24px",
                        borderBottom: (i < sessions.length - 1 || isExpanded) ? "1px solid var(--border)" : "none",
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--txt)" }}>{s.title}</span>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap",
                              background: s.status === "active" ? "rgba(22,163,74,0.1)" : "var(--bg3)",
                              color: s.status === "active" ? "#16a34a" : "var(--txt3)",
                              border: "1px solid currentColor" }}>{s.status}</span>
                            {sessionTxs.length > 0 && (
                              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.25)" }}>
                                {sessionTxs.length} response{sessionTxs.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 8 }}>
                            {s.product_category} · {s.study_type} · {s.language.toUpperCase()} · {formatDate(s.created_at)}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <code style={{ fontSize: 11, color: "var(--txt3)", background: "var(--bg3)", padding: "3px 7px", borderRadius: 5, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                              {typeof window !== "undefined" ? window.location.origin : ""}/session/{s.token}
                            </code>
                            <button onClick={() => copyLink(s.token)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--txt2)", flexShrink: 0 }}>
                              {copiedToken === s.token ? <Check size={13}/> : <Copy size={13}/>}
                            </button>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                              className="vt-btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
                              {isExpanded ? <><ChevronUp size={12}/> Hide</> : <><ChevronDown size={12}/> View</>}
                            </button>
                            <button onClick={() => deleteSession(s.id, s.token)}
                              className="vt-btn-ghost" style={{ padding: "6px 10px", color: "#ef4444" }}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                          {sessionTxs.length > 0 && (
                            <div style={{ display: "flex", gap: 5 }}>
                              <button onClick={() => downloadExcel(s)}
                                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, fontSize: 11, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--txt2)", cursor: "pointer" }}>
                                <Download size={11}/> xlsx
                              </button>
                              <button onClick={() => downloadWord(s)}
                                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, fontSize: 11, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--txt2)", cursor: "pointer" }}>
                                <FileText size={11}/> docx
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "0 24px 20px", background: "var(--bg2)", borderBottom: i < sessions.length - 1 ? "1px solid var(--border)" : "none" }}>
                          {sessionTxs.length === 0 ? (
                            <p style={{ fontSize: 13, color: "var(--txt3)", paddingTop: 16 }}>No responses yet.</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16 }}>
                              {sessionTxs.map((t, idx) => {
                                const userMsgs = t.messages.filter(m => m.role === "user");
                                const aiMsgs   = t.messages.filter(m => m.role === "assistant");
                                return (
                                  <details key={idx} style={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", overflow: "hidden" }}>
                                    <summary style={{ padding: "12px 16px", cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none", userSelect: "none" }}>
                                      <span style={{ color: "var(--txt)" }}>Respondent {idx + 1}</span>
                                      <span style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 400 }}>
                                        {aiMsgs.length + userMsgs.length} turns · {formatDate(t.createdAt)}
                                      </span>
                                    </summary>
                                    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--border)" }}>
                                      {t.messages.filter(m => m.role !== "system").map((m, j) => (
                                        <div key={j} style={{ paddingTop: j === 0 ? 12 : 0, display: "flex", gap: 8 }}>
                                          <span style={{ fontSize: 11, fontWeight: 600, color: m.role === "assistant" ? "#6366f1" : "var(--txt3)", whiteSpace: "nowrap", minWidth: 110, paddingTop: 2 }}>
                                            {m.role === "assistant" ? "Mrs Dissanayake" : "Respondent"}
                                          </span>
                                          <span style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.55 }}>{m.content}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Analytics tab ── */}
        {activeTab === "analytics" && (
          <section>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px,3vw,40px)", fontWeight: 400, color: "var(--txt)" }}>Data & Analytics</h1>
                <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, marginTop: 6 }}>Download reports for all sessions at once.</p>
              </div>
              {sessionsWithData.length > 0 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={downloadBulkExcel} disabled={bulkDownloading}
                    className="vt-btn-solid" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Archive size={14}/> {bulkDownloading ? "Preparing…" : "Bulk Excel"}
                  </button>
                  <button onClick={downloadBulkWord} disabled={bulkDownloading}
                    className="vt-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <FileText size={14}/> Bulk Word
                  </button>
                </div>
              )}
            </div>

            {/* Summary stats */}
            {sessionsWithData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-8">
                {[
                  { label: "Sessions",    value: String(sessions.length) },
                  { label: "Responses",   value: String(transcripts.length) },
                  { label: "Total Turns", value: String(transcripts.reduce((a, t) => a + t.messages.filter(m => m.role === "user").length, 0)) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "20px 22px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg2)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--txt3)", marginBottom: 8 }}>{label}</div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 400, color: "var(--txt)" }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {txLoading ? <Dots /> : sessionsWithData.length === 0 ? (
              <EmptyState title="No data yet" desc="Data will appear here once interviews are completed." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sessionsWithData.map(s => {
                  const st = transcripts.filter(t => t.sessionId === s.token);
                  return (
                    <div key={s.id} style={{ padding: "20px 24px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg2)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--txt)", marginBottom: 4 }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: "var(--txt3)" }}>
                          {st.length} respondent{st.length !== 1 ? "s" : ""} · {s.product_category} · {s.study_type} · {s.language.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => downloadExcel(s)} className="vt-btn-solid" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                          <Download size={13}/> Excel
                        </button>
                        <button onClick={() => downloadWord(s)} className="vt-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                          <FileText size={13}/> Word
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

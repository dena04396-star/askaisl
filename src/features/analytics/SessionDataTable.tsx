import type { SessionRow, TranscriptEntry } from "@/types";
import { formatDate } from "@/lib/utils/helpers";
import { ChevronRight } from "lucide-react";

const STUDY_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  decision_journey: "Decision Journey",
  pain_points: "Pain Points",
  perception: "Perception",
  concept_testing: "Concept Testing",
};

interface Props {
  sessions: SessionRow[];
  transcripts: TranscriptEntry[];
  onSelect: (id: string) => void;
}

export function SessionDataTable({ sessions, transcripts, onSelect }: Props) {
  return (
    <div className="rounded-2xl border flex flex-col"
      style={{ background: "var(--bg2)", borderColor: "var(--border)", maxHeight: 520 }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--txt2)" }}>All Sessions</h3>
      </div>
      <div className="overflow-y-auto flex-1">
        {sessions.length === 0 ? (
          <div className="py-14 text-center text-sm" style={{ color: "var(--txt3)" }}>
            No sessions created yet.
          </div>
        ) : (
          sessions.map((s, i) => {
            const resCount = transcripts.filter((t) => t.sessionId === s.token).length;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className="w-full text-left block cursor-pointer font-[inherit]"
                style={{
                  padding: "16px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: i < sessions.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--txt)" }}>
                        {s.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0"
                        style={{
                          background: s.status === "active" ? "rgba(22,163,74,0.1)" : "var(--bg3)",
                          border: `1px solid ${s.status === "active" ? "rgba(22,163,74,0.22)" : "var(--border)"}`,
                          color: s.status === "active" ? "#16a34a" : "var(--txt3)",
                        }}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--txt3)" }}>
                      <span>{s.product_category}</span>
                      <span style={{ opacity: 0.3 }}>·</span>
                      <span>{STUDY_LABELS[s.study_type] ?? s.study_type}</span>
                      <span style={{ opacity: 0.3 }}>·</span>
                      <span>{formatDate(s.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: "var(--bg3)", color: "var(--txt2)" }}>
                      {resCount} {resCount === 1 ? "resp" : "resps"}
                    </span>
                    <ChevronRight size={14} style={{ color: "var(--txt3)" }} />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

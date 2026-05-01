import type { SessionRow, TranscriptEntry } from "@/types";
import { Users, FileText, Activity, MessageCircle } from "lucide-react";

interface Props {
  sessions: SessionRow[];
  transcripts: TranscriptEntry[];
}

export function OverviewCards({ sessions, transcripts }: Props) {
  const totalRespondents = transcripts.length;
  const activeSessions   = sessions.filter((s) => s.status === "active").length;
  const totalSessions    = sessions.length;
  const totalMessages    = transcripts.reduce(
    (acc, t) => acc + t.messages.filter((m) => m.role !== "system").length,
    0
  );
  const avgTurns =
    totalRespondents > 0
      ? Math.round(totalMessages / totalRespondents)
      : 0;

  const cards = [
    { title: "Total Sessions",    val: totalSessions,    icon: FileText,       color: "#6366f1" },
    { title: "Active Sessions",   val: activeSessions,   icon: Activity,       color: "#10b981" },
    { title: "Respondents",       val: totalRespondents, icon: Users,          color: "#3b82f6" },
    { title: "Avg Messages/Resp", val: avgTurns,         icon: MessageCircle,  color: "#f59e0b" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {cards.map((c) => (
        <div key={c.title} className="p-5 rounded-2xl border"
          style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `${c.color}15`, color: c.color }}>
              <c.icon size={18} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--txt3)" }}>{c.title}</span>
          </div>
          <div className="text-3xl font-light" style={{ fontFamily: "var(--font-serif)", color: "var(--txt)" }}>
            {c.val}
          </div>
        </div>
      ))}
    </div>
  );
}

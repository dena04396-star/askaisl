import type { TranscriptEntry } from "@/types";
import { formatDate } from "@/lib/utils/helpers";

interface Props {
  transcripts: TranscriptEntry[];
}

/** Shows the latest respondent quotes across all sessions. */
export function TranscriptFeed({ transcripts }: Props) {
  const feed = transcripts
    .flatMap((t) =>
      t.messages
        .filter((m) => m.role === "user")
        .slice(0, 3)                           // first 3 user turns per session
        .map((m) => ({
          content: m.content,
          date: t.createdAt,
          sessionId: t.sessionId,
        }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  return (
    <div className="rounded-2xl border flex flex-col"
      style={{ background: "var(--bg2)", borderColor: "var(--border)", maxHeight: 520 }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--txt2)" }}>Recent Respondent Quotes</h3>
      </div>
      <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
        {feed.length === 0 ? (
          <div className="py-14 text-center text-sm" style={{ color: "var(--txt3)" }}>
            No respondent messages yet.
          </div>
        ) : (
          feed.map((f, i) => (
            <div key={i} className="p-4 rounded-xl text-sm leading-relaxed"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--txt3)" }}>
                {formatDate(f.date)}
              </div>
              <p style={{ color: "var(--txt)" }}>&ldquo;{f.content}&rdquo;</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

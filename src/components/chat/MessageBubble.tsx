import type { ChatMessage } from "@/types";

interface Props {
  message: ChatMessage;
  /** ≥0 = karaoke mode (word N highlighted); undefined = show all */
  revealedWords?: number;
}

function renderKaraoke(content: string, revealedWords: number) {
  const tokens = content.split(/(\s+)/);
  let wi = 0;
  return tokens.map((t, i) => {
    if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
    const idx = wi++;
    const visible = idx < revealedWords;
    return (
      <span
        key={i}
        style={{
          opacity: visible ? 1 : 0.28,
          transition: visible ? "opacity 0.12s ease" : "none",
          display: "inline",
        }}
      >
        {t}
      </span>
    );
  });
}

export default function MessageBubble({ message, revealedWords }: Props) {
  const isUser   = message.role === "user";
  const isKaraoke = !isUser && revealedWords !== undefined && revealedWords >= 0;

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"} bubble-in`}>
      <span
        style={{ fontSize: 11, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.06em", paddingInline: 12 }}
      >
        {isUser ? "You" : "Mrs Dissanayake"}
      </span>
      <div
        style={{
          maxWidth: "88%",
          padding: "11px 14px",
          fontSize: 13.5,
          lineHeight: 1.65,
          fontWeight: 300,
          borderRadius: 14,
          ...(isUser
            ? { background: "var(--inv)", color: "var(--inv-txt)", borderBottomRightRadius: 4 }
            : { background: "var(--bg2)", border: "1px solid var(--border)", borderBottomLeftRadius: 4, color: "var(--txt)" }),
        }}
      >
        {isKaraoke ? <>{renderKaraoke(message.content, revealedWords)}</> : message.content}
      </div>
    </div>
  );
}

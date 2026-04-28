import type { ChatMessage, Locale, StudyContext } from "@/types";

export async function sendMessage(
  messages: ChatMessage[],
  language: Locale,
  sessionId?: string,
  study?: StudyContext
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, language, sessionId, study }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error ?? "Request failed");
  }

  const { reply } = await res.json();
  return reply as string;
}

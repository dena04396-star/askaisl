import type { ChatMessage, Locale } from "@/types";

/**
 * Send a message to the AI interviewer and get a reply.
 */
export async function sendMessage(
  messages: ChatMessage[],
  language: Locale
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, language }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error ?? "Request failed");
  }

  const { reply } = await res.json();
  return reply as string;
}

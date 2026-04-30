import type { ChatMessage, Locale, StudyContext } from "@/types";

export async function sendMessage(
  messages: ChatMessage[],
  language: Locale,
  sessionId?: string,
  study?: StudyContext,
  onChunk?: (chunk: string) => void,
  customGuide?: string | null
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, language, sessionId, study, customGuide }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error ?? "Request failed");
  }

  /* Handle streaming response */
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullReply = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const json = JSON.parse(line.slice(6));
          if (json.chunk) {
            fullReply += json.chunk;
            onChunk?.(json.chunk);
          }
          if (json.done) {
            return fullReply;
          }
          if (json.error) {
            throw new Error(json.error);
          }
        } catch (e) {
          /* Ignore parse errors for empty lines */
        }
      }
    }
  }

  return fullReply;
}

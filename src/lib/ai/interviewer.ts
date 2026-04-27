import { openai, getModelName } from "./openai";
import { buildSystemPrompt } from "./prompts";
import type { ChatMessage, Locale } from "@/types";

export async function runInterviewer(
  messages: ChatMessage[],
  language: Locale = "en"
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: getModelName(),
    messages: [
      { role: "system", content: buildSystemPrompt(language) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 512,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI model");
  }

  return content;
}

import { openai } from "./openai";
import { SYSTEM_PROMPT } from "./prompts";
import type { ChatMessage } from "@/types";

export async function runInterviewer(messages: ChatMessage[]): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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

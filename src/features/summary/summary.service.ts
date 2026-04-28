import { openai, getModelName } from "@/lib/ai/openai";
import { SUMMARY_PROMPT } from "@/lib/ai/prompts";

export async function generateSummary(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: getModelName(),
    messages: [
      {
        role: "user",
        content: SUMMARY_PROMPT + transcript,
      },
    ],
    temperature: 0.5,
    max_tokens: 800,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No summary generated");
  }
  return content;
}

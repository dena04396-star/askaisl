import { openai } from "@/lib/ai/openai";

type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

/**
 * Convert text to speech using OpenAI TTS.
 * Returns a Buffer containing the mp3 audio.
 */
export async function textToSpeech(
  text: string,
  voice: TTSVoice = "alloy"
): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

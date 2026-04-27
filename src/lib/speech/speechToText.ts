import { openai } from "@/lib/ai/openai";

/**
 * Transcribe audio using OpenAI Whisper.
 * @param audioBuffer  Raw audio bytes (e.g. from a browser MediaRecorder blob)
 * @param filename     Hint for the file type, e.g. "audio.webm"
 */
export async function speechToText(
  audioBuffer: Buffer,
  filename = "audio.webm"
): Promise<string> {
  const file = new File([audioBuffer], filename, { type: "audio/webm" });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return transcription.text;
}

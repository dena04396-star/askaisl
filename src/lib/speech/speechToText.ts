import { openai } from "@/lib/ai/openai";

/**
 * Transcribe audio using OpenAI Whisper.
 * @param audioBuffer  Raw audio bytes (e.g. from a browser MediaRecorder blob)
 * @param filename     Hint for the file type, e.g. "audio.webm"
 */
export async function speechToText(
  audioBuffer: Uint8Array,
  filename = "audio.webm"
): Promise<string> {
  const slice = audioBuffer.buffer.slice(
    audioBuffer.byteOffset,
    audioBuffer.byteOffset + audioBuffer.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([slice], { type: "audio/webm" });
  const file = new File([blob], filename, { type: "audio/webm" });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return transcription.text;
}

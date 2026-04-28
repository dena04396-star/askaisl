/**
 * ElevenLabs Text-to-Speech integration.
 *
 * Server-side: called from /api/tts route handler.
 * Returns a ReadableStream of audio bytes (mp3).
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// Default voice: Alice - Clear, Engaging Educator
const DEFAULT_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2";

// Voice IDs contain only alphanumeric characters and are typically 20 chars
const VOICE_ID_RE = /^[A-Za-z0-9]{10,30}$/;

interface TTSOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  /**
   * Speaking style intensity for ElevenLabs v2 models.
   * Range 0–1: 0 = neutral/default, 1 = maximum style exaggeration.
   */
  style?: number;
  useSpeakerBoost?: boolean;
}

/**
 * Stream TTS audio from ElevenLabs.
 * Returns the raw Response from the ElevenLabs API so the route handler can
 * pipe it directly to the client without buffering the entire file.
 */
export async function streamTTS(
  text: string,
  options: TTSOptions = {}
): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const rawVoiceId =
    options.voiceId ||
    process.env.ELEVENLABS_VOICE_ID ||
    DEFAULT_VOICE_ID;

  // Validate the voice ID to prevent SSRF via URL injection
  if (!VOICE_ID_RE.test(rawVoiceId)) {
    throw new Error(
      "Invalid ElevenLabs voice ID format. Voice IDs must be 10–30 alphanumeric characters."
    );
  }

  const url = `${ELEVENLABS_BASE}/text-to-speech/${rawVoiceId}/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
        style: options.style ?? 0.0,
        use_speaker_boost: options.useSpeakerBoost ?? true,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs API error ${response.status}: ${body}`
    );
  }

  return response;
}

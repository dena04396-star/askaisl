const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// Charlotte — warm, professional, mature female; works across all ElevenLabs languages
// including Sinhala (si) and Tamil (ta). Override with ELEVENLABS_VOICE_ID env var.
const DEFAULT_VOICE_ID = "XB0fDUnXU5powFXDhCwa";

const VOICE_ID_RE = /^[A-Za-z0-9]{10,30}$/;

/* ElevenLabs language codes for explicit language locking */
const ELEVEN_LANG: Record<string, string> = {
  en: "en",
  si: "si", // Sinhala — supported by eleven_multilingual_v2
  ta: "ta", // Tamil — supported by eleven_multilingual_v2
};

interface TTSOptions {
  voiceId?: string;
  language?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export async function streamTTS(
  text: string,
  options: TTSOptions = {}
): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");

  const rawVoiceId =
    options.voiceId ||
    process.env.ELEVENLABS_VOICE_ID ||
    DEFAULT_VOICE_ID;

  if (!VOICE_ID_RE.test(rawVoiceId)) {
    throw new Error("Invalid ElevenLabs voice ID format.");
  }

  /* Resolve language code — strip BCP-47 region suffix (e.g. "en-US" → "en") */
  const langPrefix = (options.language ?? "en").split(/[-_]/)[0].toLowerCase();
  const elevenLang = ELEVEN_LANG[langPrefix] ?? "en";

  const url = `${ELEVENLABS_BASE}/text-to-speech/${rawVoiceId}/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key":   apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      // eleven_multilingual_v2: highest quality, supports Sinhala + Tamil natively
      model_id: "eleven_multilingual_v2",
      language_code: elevenLang, // explicit language lock prevents accent bleed
      voice_settings: {
        // Tuned for a calm, warm 35-year-old Sri Lankan professional woman
        stability:         options.stability        ?? 0.72,
        similarity_boost:  options.similarityBoost  ?? 0.80,
        style:             options.style            ?? 0.35,
        use_speaker_boost: options.useSpeakerBoost  ?? true,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`ElevenLabs API error ${response.status}: ${body}`);
  }

  return response;
}

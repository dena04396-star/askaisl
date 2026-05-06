import { NextRequest, NextResponse } from "next/server";
import * as googleTTS from "google-tts-api";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { text, voiceId, language } = await req.json();
  if (!text || typeof text !== "string")
    return NextResponse.json({ error: "text string is required" }, { status: 400 });

  const prefix = (language || "en").split("-")[0];
  const token  = process.env.SPEECHGEN_TOKEN;
  const email  = process.env.SPEECHGEN_EMAIL;

  if (token && email) {
    try {
      const voiceMap: Record<string, string> = { si: "Thilini", ta: "Saranya", en: "Neerja" };
      const pitchMap: Record<string, string> = { si: "0", ta: "0", en: "5" };
      const data = new URLSearchParams({
        token, email,
        voice: voiceId || voiceMap[prefix] || "Neerja",
        text: text.slice(0, 2000),
        format: "mp3",
        speed: "1",
        pitch: pitchMap[prefix] ?? "5",
      });

      const res = await fetch("https://speechgen.io/index.php?r=api/text", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString(),
      });
      const result = await res.json();
      if (result.status === 1 && result.file) {
        const audioRes = await fetch(result.file);
        return new NextResponse(audioRes.body, {
          headers: { "Content-Type": "audio/mpeg", "Transfer-Encoding": "chunked" },
        });
      }
      throw new Error(result.error || "SpeechGen failed");
    } catch (e) {
      console.warn("[/api/tts] SpeechGen unavailable, falling back to Google TTS:", (e as Error).message);
    }
  }

  /* Google TTS fallback */
  try {
    const b64Parts = await googleTTS.getAllAudioBase64(text.slice(0, 5000), {
      lang: prefix, slow: false, host: "https://translate.google.com",
    });
    return NextResponse.json({ fallback: true, chunks: b64Parts.map((p: { base64: string }) => p.base64) });
  } catch (e) {
    console.error("[/api/tts]", e);
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}

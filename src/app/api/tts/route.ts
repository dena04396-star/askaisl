import { NextRequest, NextResponse } from "next/server";
import * as googleTTS from "google-tts-api";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId, language } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text string is required" },
        { status: 400 }
      );
    }

    try {
      const prefix = (language || "en").split("-")[0];

      const token = process.env.SPEECHGEN_TOKEN;
      const email = process.env.SPEECHGEN_EMAIL;

      if (!token || !email) {
        throw new Error("Missing SPEECHGEN_TOKEN or SPEECHGEN_EMAIL");
      }

      const voiceMap: Record<string, string> = { si: "Thilini", ta: "Saranya", en: "Neerja" };
      const defaultVoice = voiceId || voiceMap[prefix] || "Neerja";

      const pitchMap: Record<string, string> = { si: "0", ta: "0", en: "5" };

      const data = new URLSearchParams({
        token,
        email,
        voice: defaultVoice,
        text: text.slice(0, 2000),
        format: "mp3",
        speed: "1",
        pitch: pitchMap[prefix] ?? "5",
      });

      const response = await fetch("https://speechgen.io/index.php?r=api/text", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString(),
      });

      const result = await response.json();

      if (result.status === 1 && result.file) {
        // Fetch the generated MP3 file and stream it directly back to the client
        const audioRes = await fetch(result.file);
        
        return new NextResponse(audioRes.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Transfer-Encoding": "chunked",
          },
        });
      } else {
        throw new Error(result.error || "SpeechGen API failed");
      }
    } catch (apiError) {
      if ((apiError as Error).message !== "use-google-tts")
        console.warn("[/api/tts] SpeechGen unavailable, using Google TTS:", (apiError as Error).message);
      
      const prefix = (language || "en").split("-")[0];
      const b64Parts = await googleTTS.getAllAudioBase64(text.slice(0, 5000), {
        lang: prefix,
        slow: false,
        host: "https://translate.google.com",
      });

      return NextResponse.json({ fallback: true, chunks: b64Parts.map(p => p.base64) });
    }

  } catch (error) {
    console.error("[/api/tts]", error);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 }
    );
  }
}

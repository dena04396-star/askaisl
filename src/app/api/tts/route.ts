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
      const token = process.env.SPEECHGEN_TOKEN;
      const email = process.env.SPEECHGEN_EMAIL;

      if (!token || !email) {
        throw new Error("Missing SPEECHGEN_TOKEN or SPEECHGEN_EMAIL");
      }

      // Fallback voice selection for Sinhala and English
      let defaultVoice = "Matthew plus";
      if (language === "si") defaultVoice = "Amaya"; // Or whichever Sinhala voice SpeechGen provides
      if (language === "ta") defaultVoice = "Nila";  // Example Tamil voice

      const data = new URLSearchParams({
        token,
        email,
        voice: voiceId || defaultVoice,
        text: text.slice(0, 2000), // SpeechGen /text endpoint max limit is 2000
        format: "mp3",
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
      console.error("[/api/tts] SpeechGen failed, using google fallback:", apiError);
      
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

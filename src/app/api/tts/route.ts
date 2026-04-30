import { NextRequest, NextResponse } from "next/server";
import { streamTTS } from "@/lib/speech/elevenlabs";

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

    const elevenResp = await streamTTS(
      // Truncate to 5000 chars – ElevenLabs enforces a per-request text limit
      text.slice(0, 5000),
      { voiceId, language }
    );

    const stream = elevenResp.body;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[/api/tts]", error);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 }
    );
  }
}

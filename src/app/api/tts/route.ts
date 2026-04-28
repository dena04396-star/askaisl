import { NextRequest, NextResponse } from "next/server";
import { streamTTS } from "@/lib/speech/elevenlabs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text string is required" },
        { status: 400 }
      );
    }

    const elevenResp = await streamTTS(
      // Truncate to 5000 chars – ElevenLabs enforces a per-request text limit
      text.slice(0, 5000),
      { voiceId }
    );

    // Pipe the ElevenLabs audio stream directly to the client
    return new Response(elevenResp.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
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

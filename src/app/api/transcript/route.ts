import { NextRequest, NextResponse } from "next/server";
import { saveTranscript, getTranscripts } from "@/features/transcript/transcript.service";

export async function GET() {
  try {
    const transcripts = await getTranscripts();
    return NextResponse.json({ transcripts });
  } catch (error) {
    console.error("[/api/transcript GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, messages } = body;

    if (!sessionId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "sessionId and messages are required" },
        { status: 400 }
      );
    }

    const transcript = await saveTranscript({ sessionId, messages });
    return NextResponse.json({ transcript }, { status: 201 });
  } catch (error) {
    console.error("[/api/transcript POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateSummary } from "@/features/summary/summary.service";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "transcript string is required" },
        { status: 400 }
      );
    }

    const summary = await generateSummary(transcript);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[/api/summary]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

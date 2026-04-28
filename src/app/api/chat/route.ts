import { NextRequest, NextResponse } from "next/server";
import { runInterviewer } from "@/lib/ai/interviewer";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { messages, language } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const locale: Locale =
      typeof language === "string" && isValidLocale(language)
        ? language
        : "en";

    const reply = await runInterviewer(messages, locale);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[/api/chat]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

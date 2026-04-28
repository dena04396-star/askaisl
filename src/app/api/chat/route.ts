import { NextRequest, NextResponse } from "next/server";
import { runInterviewer } from "@/lib/ai/interviewer";
import { isValidLocale } from "@/lib/i18n/config";
import { saveTranscript } from "@/features/transcript/transcript.service";
import { generateId } from "@/lib/utils/helpers";
import type { Locale, StudyContext } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { messages, language, sessionId, study } = await req.json();

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

    const studyCtx: StudyContext | undefined =
      study &&
      typeof study.productCategory === "string" &&
      typeof study.studyType === "string"
        ? study
        : undefined;

    const reply = await runInterviewer(messages, locale, studyCtx);

    const sid: string =
      typeof sessionId === "string" && sessionId ? sessionId : generateId();
    const allMessages = [
      ...messages,
      { role: "assistant" as const, content: reply },
    ];
    saveTranscript({ sessionId: sid, messages: allMessages }).catch((err) =>
      console.error("[/api/chat] saveTranscript error:", err)
    );

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[/api/chat]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

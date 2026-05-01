import { NextRequest, NextResponse } from "next/server";
import { openai, getModelName } from "@/lib/ai/openai";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { isValidLocale } from "@/lib/i18n/config";
import { saveTranscript } from "@/features/transcript/transcript.service";
import { generateId } from "@/lib/utils/helpers";
import type { Locale, StudyContext, ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { messages, language, sessionId, study, customGuide } = await req.json();

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

    const messageCount = (messages as ChatMessage[]).filter((m) => m.role === "user").length;

    /* Keep last 10 turns only — shorter context = faster first-token time */
    const recentMessages: ChatMessage[] = (messages as ChatMessage[]).slice(-10);

    /* Stream the response */
    const stream = await openai.chat.completions.create({
      model: getModelName(),
      messages: [
        { role: "system", content: buildSystemPrompt(locale, studyCtx, messageCount, typeof customGuide === "string" ? customGuide : undefined) },
        ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.65,
      max_tokens: 200,        /* Short interview questions need ≤200 tokens */
      frequency_penalty: 0.3, /* Prevent repetitive filler phrases */
      stream: true,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        let fullReply = "";

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              fullReply += delta;
              /* Send chunk to client via SSE */
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: delta })}\n\n`)
              );
            }
          }

          /* Signal completion and save transcript */
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );

          /* Save transcript in background */
          const sid = typeof sessionId === "string" && sessionId ? sessionId : generateId();
          const allMessages = [
            ...messages,
            { role: "assistant" as const, content: fullReply },
          ];
          saveTranscript({ sessionId: sid, messages: allMessages }).catch((err) =>
            console.error("[/api/chat] saveTranscript error:", err)
          );
        } catch (error) {
          console.error("[/api/chat stream error]", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`)
          );
        }

        controller.close();
      },
    });

    return new NextResponse(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[/api/chat]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { openai, getModelName } from "@/lib/ai/openai";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { isValidLocale } from "@/lib/i18n/config";
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

    /* Keep last 14 turns — enough history for anti-repetition checks */
    const recentMessages: ChatMessage[] = (messages as ChatMessage[]).slice(-14);

    /* Stream the response */
    const stream = await openai.chat.completions.create({
      model: getModelName(),
      messages: [
        { role: "system", content: buildSystemPrompt(locale, studyCtx, messageCount, typeof customGuide === "string" ? customGuide : undefined) },
        ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: messageCount === 0 ? 0.90 : 0.55, /* higher on opening for natural variety */
      max_tokens: 180,
      frequency_penalty: 0.4,
      presence_penalty: 0.5,
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

          /* Signal completion */
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
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

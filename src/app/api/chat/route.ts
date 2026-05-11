import { NextRequest, NextResponse } from "next/server";
import { openai, getModelName } from "@/lib/ai/openai";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale, StudyContext, ChatMessage } from "@/types";

// In-memory cache for opening greetings (keyed by locale+studyType+product)
// Avoids a full LLM round-trip when many respondents start the same session
const greetingCache = new Map<string, { reply: string; ts: number }>();
const GREETING_TTL = 60 * 60 * 1000; // 1 hour

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

    /* Cache hit: first message (greeting) with 0 user turns */
    if (messageCount === 0 && studyCtx) {
      const cacheKey = `${locale}:${studyCtx.studyType}:${studyCtx.productCategory}`;
      const cached = greetingCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < GREETING_TTL) {
        const encoder = new TextEncoder();
        const cachedStream = new ReadableStream({
          start(controller) {
            // Stream cached reply word by word for natural feel
            const words = cached.reply.split(" ");
            words.forEach((word, i) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: (i === 0 ? "" : " ") + word })}\n\n`));
            });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
          },
        });
        return new NextResponse(cachedStream, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
        });
      }
    }

    /* Keep last 14 turns — enough history for anti-repetition checks */
    const recentMessages: ChatMessage[] = (messages as ChatMessage[]).slice(-14);

    /* Stream the response */
    const stream = await openai.chat.completions.create({
      model: getModelName(),
      messages: [
        { role: "system", content: buildSystemPrompt(locale, studyCtx, messageCount, typeof customGuide === "string" ? customGuide : undefined) },
        ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.65,
      max_tokens: 200,
      frequency_penalty: 0.4,
      presence_penalty: 0.5,  /* Penalise topics already mentioned — reduces question repetition */
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

          /* Cache the opening greeting for future respondents */
          if (messageCount === 0 && studyCtx && fullReply) {
            const cacheKey = `${locale}:${studyCtx.studyType}:${studyCtx.productCategory}`;
            greetingCache.set(cacheKey, { reply: fullReply, ts: Date.now() });
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

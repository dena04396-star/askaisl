"use client";

import { useState, useCallback } from "react";
import { generateId } from "@/lib/utils/helpers";
import { sendMessage } from "./interview.service";
import type { ChatMessage, Locale, StudyContext, RespondentDetails } from "@/types";
import type { InterviewStatus } from "./interview.types";

/* Strip any stage-direction artifacts the LLM might produce */
function sanitize(raw: string): string {
  return raw
    .replace(/\[.*?\]/g, "")           /* [brief pause], [laughs], [pause] … */
    .replace(/\*[a-zA-Z ,]+\*/g, "")   /* *smiles*, *pauses briefly* … */
    .replace(/\(pause[sd]?\)/gi, "")   /* (pause), (pauses) … */
    .replace(/  +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const CLOSING_SIGNALS = [
  "thank you so much for your time",
  "it was a pleasure speaking with you",
  "your insights are truly valuable",
  "ඔබේ කාලය ගැන ස්තූතියි",
  "உங்கள் நேரத்திற்கு மிக்க நன்றி",
];

function detectClosing(text: string): boolean {
  const lower = text.toLowerCase();
  return CLOSING_SIGNALS.some((sig) => lower.includes(sig));
}

export function useInterviewStore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [sessionId] = useState(() => generateId());
  const [language, setLanguage] = useState<Locale>("en");
  const [study, setStudy] = useState<StudyContext | undefined>();
  const [respondent, setRespondent] = useState<RespondentDetails | undefined>();
  const [summary, setSummary] = useState<string | null>(null);
  const [showClosingBanner, setShowClosingBanner] = useState(false);

  const startInterview = useCallback(
    async (lang: Locale, ctx: StudyContext, respondentDetails?: RespondentDetails) => {
      setLanguage(lang);
      setStudy(ctx);
      setRespondent(respondentDetails);
      setStatus("active");
      setIsLoading(true);
      setShowClosingBanner(false);
      try {
        /* Buffer silently — message reveals in sync with TTS */
        let streamedText = "";
        const raw = await sendMessage([], lang, sessionId, ctx, (chunk) => {
          streamedText += chunk;
        });

        const reply = sanitize(raw);
        setMessages([{ role: "assistant", content: reply }]);
        if (detectClosing(reply)) setShowClosingBanner(true);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const sendUserMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = { role: "user", content };
      const next = [...messages, userMsg];
      setMessages(next);
      setIsLoading(true);
      try {
        /* Buffer silently — message reveals in sync with TTS */
        let streamedText = "";
        const raw = await sendMessage(next, language, sessionId, study, (chunk) => {
          streamedText += chunk;
        });

        const reply = sanitize(raw);
        setMessages([...next, { role: "assistant", content: reply }]);

        if (detectClosing(reply)) setShowClosingBanner(true);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, language, sessionId, study]
  );

  const endInterview = useCallback(async () => {
    setStatus("finished");
    setIsSummarizing(true);
    const transcript = messages
      .map((m) =>
        m.role === "assistant"
          ? `Mrs Dissanayake: ${m.content}`
          : `Respondent: ${m.content}`
      )
      .join("\n\n");
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, respondent }),
      });
      if (res.ok) {
        const { summary: raw } = await res.json();
        setSummary(raw);
      }
    } catch (err) {
      console.error("[interview.store] endInterview summary error:", err);
    } finally {
      setIsSummarizing(false);
    }
  }, [messages, respondent]);

  const reset = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setIsLoading(false);
    setIsSummarizing(false);
    setSummary(null);
    setStudy(undefined);
    setRespondent(undefined);
    setShowClosingBanner(false);
  }, []);

  return {
    messages,
    status,
    isLoading,
    isSummarizing,
    sessionId,
    language,
    study,
    respondent,
    summary,
    showClosingBanner,
    startInterview,
    sendUserMessage,
    endInterview,
    reset,
  };
}

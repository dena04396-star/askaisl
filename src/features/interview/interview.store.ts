"use client";

import { useState, useCallback } from "react";
import { generateId } from "@/lib/utils/helpers";
import { sendMessage } from "./interview.service";
import type { ChatMessage, Locale } from "@/types";
import type { InterviewStatus } from "./interview.types";

export function useInterviewStore(language: Locale) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateId());

  const startInterview = useCallback(async () => {
    setStatus("active");
    setIsLoading(true);
    try {
      const reply = await sendMessage([], language);
      setMessages([{ role: "assistant", content: reply }]);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const sendUserMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = { role: "user", content };
      const next = [...messages, userMsg];
      setMessages(next);
      setIsLoading(true);
      try {
        const reply = await sendMessage(next, language);
        setMessages([...next, { role: "assistant", content: reply }]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, language]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setIsLoading(false);
  }, []);

  return { messages, status, isLoading, sessionId, startInterview, sendUserMessage, reset };
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback, startTransition } from "react";
import MessageBubble from "./MessageBubble";
import { useInterviewStore } from "@/features/interview/interview.store";
import type { Locale } from "@/types";

// Lazy-load the 3D avatar to avoid SSR issues with WebGL
const Avatar3D = dynamic(() => import("@/components/avatar/Avatar3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-16 w-16 animate-pulse rounded-full bg-indigo-200 dark:bg-indigo-800" />
    </div>
  ),
});

// ---------- types for browser speech APIs ----------
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
};

const LOCALE_BCP47: Record<Locale, string> = {
  en: "en-US",
  si: "si-LK",
  ta: "ta-IN",
};

/**
 * Play text via ElevenLabs /api/tts.
 * Falls back to Web Speech API if the TTS endpoint is unavailable.
 * Returns a cleanup function that stops audio.
 */
async function playTTS(
  text: string,
  onStart: () => void,
  onEnd: () => void,
  lang: string
): Promise<() => void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onplay = onStart;
    audio.onended = () => {
      onEnd();
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      onEnd();
      URL.revokeObjectURL(url);
    };

    audio.play().catch(() => onEnd());

    return () => {
      audio.pause();
      onEnd();
      URL.revokeObjectURL(url);
    };
  } catch {
    // Graceful fallback to browser TTS
    if (typeof window === "undefined") return () => {};
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.95;
    utter.pitch = 1.1;
    utter.onstart = onStart;
    utter.onend = onEnd;
    utter.onerror = onEnd;
    window.speechSynthesis.speak(utter);
    return () => {
      window.speechSynthesis.cancel();
      onEnd();
    };
  }
}

export default function ChatInterface() {
  const [language, setLanguage] = useState<Locale>("en");
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const stopAudioRef = useRef<(() => void) | null>(null);

  const { messages, status, isLoading, startInterview, sendUserMessage } =
    useInterviewStore(language);

  // Check browser support for SpeechRecognition
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      startTransition(() => setMicSupported(true));
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const speak = useCallback(
    async (text: string) => {
      // Stop any currently playing audio
      stopAudioRef.current?.();
      stopAudioRef.current = null;

      const cleanup = await playTTS(
        text,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        LOCALE_BCP47[language]
      );
      stopAudioRef.current = cleanup;
    },
    [language]
  );

  // Speak the latest assistant message whenever it changes
  const lastAssistantMsg = messages.filter((m) => m.role === "assistant").at(-1);
  const spokenRef = useRef<string>("");
  useEffect(() => {
    if (lastAssistantMsg && lastAssistantMsg.content !== spokenRef.current) {
      spokenRef.current = lastAssistantMsg.content;
      speak(lastAssistantMsg.content);
    }
  }, [lastAssistantMsg, speak]);

  // Stop speech when language changes
  useEffect(() => {
    stopAudioRef.current?.();
    stopAudioRef.current = null;
    startTransition(() => setIsSpeaking(false));
  }, [language]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendUserMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = LOCALE_BCP47[language];
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: { results: { [x: number]: { [x: number]: { transcript: string } } } }) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">
          AI Mock Interview
        </h1>
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <label className="sr-only" htmlFor="language-select">
            Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Locale)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(
              ([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              )
            )}
          </select>
          {/* Speaking indicator */}
          {isSpeaking && (
            <span className="flex items-center gap-1 text-xs text-indigo-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
              Speaking…
            </span>
          )}
        </div>
      </header>

      {/* Main content: avatar + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Avatar panel */}
        <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-gradient-to-b from-indigo-50 to-white dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 lg:flex lg:flex-col">
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="h-80 w-full overflow-hidden rounded-2xl">
              <Avatar3D isSpeaking={isSpeaking} />
            </div>
          </div>
          <div className="px-4 pb-6 text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Amara
            </p>
            <p className="text-xs text-zinc-400">
              {isSpeaking ? "Speaking…" : isLoading ? "Thinking…" : "Interviewer"}
            </p>
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            {status === "idle" ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                {/* Mobile avatar */}
                <div className="h-48 w-48 overflow-hidden rounded-2xl lg:hidden">
                  <Avatar3D isSpeaking={false} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Ready to practice?
                  </h2>
                  <p className="mt-2 text-zinc-500">
                    Amara will guide you through a mock interview in{" "}
                    <span className="font-medium text-indigo-600">
                      {LOCALE_LABELS[language]}
                    </span>
                    .
                  </p>
                </div>
                <button
                  onClick={startInterview}
                  className="rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white shadow transition-colors hover:bg-indigo-700"
                >
                  Start Interview
                </button>
              </div>
            ) : (
              <div className="mx-auto flex max-w-2xl flex-col gap-4">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-zinc-800">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          {status !== "idle" && (
            <div className="border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
              <div className="mx-auto flex max-w-2xl items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer… (Enter to send)"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  disabled={isLoading}
                />
                {micSupported && (
                  <button
                    onClick={handleMic}
                    aria-label={isListening ? "Stop recording" : "Start recording"}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                      isListening
                        ? "animate-pulse border-red-400 bg-red-50 text-red-500 dark:border-red-600 dark:bg-red-950"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <MicIcon />
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

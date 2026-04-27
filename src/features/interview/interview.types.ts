import type { ChatMessage, Locale } from "@/types";

export interface InterviewSession {
  id: string;
  messages: ChatMessage[];
  language: Locale;
  startedAt: string;
}

export type InterviewStatus = "idle" | "active" | "finished";

export interface InterviewState {
  session: InterviewSession | null;
  status: InterviewStatus;
}

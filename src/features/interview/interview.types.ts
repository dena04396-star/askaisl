import type { ChatMessage, Locale, StudyContext } from "@/types";

export interface InterviewSession {
  id: string;
  messages: ChatMessage[];
  language: Locale;
  startedAt: string;
  study?: StudyContext;
}

export type InterviewStatus = "idle" | "active" | "finished";

export interface InterviewState {
  session: InterviewSession | null;
  status: InterviewStatus;
}

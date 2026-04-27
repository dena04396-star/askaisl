export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  role: Role;
  content: string;
}

export type Locale = "en" | "si" | "ta";

export interface InterviewSession {
  id: string;
  messages: ChatMessage[];
  language: Locale;
  startedAt: string;
}

export interface TranscriptEntry {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface SummaryResult {
  strengths: string;
  improvements: string;
  score: number;
  justification: string;
  raw: string;
}

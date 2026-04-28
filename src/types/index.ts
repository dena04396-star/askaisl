export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  role: Role;
  content: string;
}

export type Locale = "en" | "si" | "ta";

export type StudyType =
  | "behavioral"
  | "decision_journey"
  | "pain_points"
  | "perception"
  | "concept_testing";

export interface StudyContext {
  productCategory: string;
  studyType: StudyType;
}

export interface InterviewSession {
  id: string;
  messages: ChatMessage[];
  language: Locale;
  startedAt: string;
  study?: StudyContext;
}

export interface TranscriptEntry {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface SummaryResult {
  raw: string;
}

export interface RespondentDetails {
  name?: string;
  age?: string;
  gender?: string;
  district?: string;
}

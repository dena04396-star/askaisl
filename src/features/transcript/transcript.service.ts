import type { TranscriptEntry } from "@/types";

// In-memory store – replace with a real DB adapter when ready.
const store: TranscriptEntry[] = [];

export async function saveTranscript(
  entry: Omit<TranscriptEntry, "createdAt">
): Promise<TranscriptEntry> {
  const record: TranscriptEntry = {
    ...entry,
    createdAt: new Date().toISOString(),
  };
  store.push(record);
  return record;
}

export async function getTranscripts(): Promise<TranscriptEntry[]> {
  return [...store];
}

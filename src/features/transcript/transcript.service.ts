import { getDbClient } from "@/lib/db/client";
import type { TranscriptEntry } from "@/types";

// In-memory fallback when Supabase is not configured
const memoryStore: TranscriptEntry[] = [];

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export async function saveTranscript(
  entry: Omit<TranscriptEntry, "createdAt">
): Promise<TranscriptEntry> {
  const record: TranscriptEntry = {
    ...entry,
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    memoryStore.push(record);
    return record;
  }

  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("transcripts")
    .insert({
      session_id: record.sessionId,
      messages: record.messages,
      created_at: record.createdAt,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("[transcript.service] saveTranscript error:", error.message);
    // Fall back to memory so the app keeps working
    memoryStore.push(record);
    return record;
  }

  return {
    sessionId: data.session_id as string,
    messages: data.messages as TranscriptEntry["messages"],
    createdAt: data.created_at as string,
  };
}

export async function getTranscripts(): Promise<TranscriptEntry[]> {
  if (!isSupabaseConfigured()) {
    return [...memoryStore];
  }

  const supabase = getDbClient();
  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[transcript.service] getTranscripts error:", error.message);
    return [...memoryStore];
  }

  return (data ?? []).map((row) => ({
    sessionId: row.session_id as string,
    messages: row.messages as TranscriptEntry["messages"],
    createdAt: row.created_at as string,
  }));
}

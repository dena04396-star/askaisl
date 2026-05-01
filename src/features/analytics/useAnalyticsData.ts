"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/auth/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { TranscriptEntry, SessionRow } from "@/types";

/** Shared hook — fetches sessions + transcripts for the current user. */
export function useAnalyticsData() {
  const { user } = useAuth();
  const [sessions, setSessions]       = useState<SessionRow[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getBrowserClient()
        .from("interview_sessions")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false }),
      fetch("/api/transcript").then((r) => r.json()),
    ]).then(([sessionsRes, txRes]) => {
      if (sessionsRes.data) setSessions(sessionsRes.data as SessionRow[]);
      if (txRes.transcripts) setTranscripts(txRes.transcripts);
      setLoading(false);
    });
  }, [user]);

  return { sessions, transcripts, loading };
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useAnalyticsData } from "./useAnalyticsData";
import { OverviewCards } from "./OverviewCards";
import { SessionDataTable } from "./SessionDataTable";
import { SessionDetail } from "./SessionDetail";
import { TranscriptFeed } from "./TranscriptFeed";
import { useAuth } from "@/components/auth/AuthProvider";

function LogoMark() {
  return (
    <div className="w-5.5 h-5.5 rounded-md flex items-center justify-center shrink-0"
      style={{ background: "var(--inv)" }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Dots() {
  return (
    <div className="py-20 flex justify-center">
      <div className="flex gap-1.5">
        <span className="td" /><span className="td td-2" /><span className="td td-3" />
      </div>
    </div>
  );
}

export function AnalyticsContainer() {
  const { user, signOut } = useAuth();
  const { sessions, transcripts, loading } = useAnalyticsData();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const selected = sessions.find((s) => s.id === selectedSession) ?? null;
  const selectedTranscripts = selected
    ? transcripts.filter((t) => t.sessionId === selected.token)
    : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--txt)" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-4 md:px-10 h-15.5 max-w-300 mx-auto">
          <Link href="/" className="flex items-center gap-2 no-underline"
            style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--txt)" }}>
            <LogoMark /> vinterview
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="text-sm font-medium no-underline" style={{ color: "var(--txt2)" }}>Dashboard</Link>
            <span className="text-sm font-semibold" style={{ color: "var(--txt)" }}>Analytics</span>
            <span className="hidden sm:block text-sm" style={{ color: "var(--txt3)" }}>{user?.email}</span>
            <button onClick={signOut} className="vt-btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-300 mx-auto px-4 md:px-10 py-8 md:py-14">
        {/* ── Page heading ── */}
        <div className="mb-10">
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--txt)" }}>
            Session Data &amp; Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, marginTop: 8 }}>
            View collected data, respondent messages, and summaries per interview session.
          </p>
        </div>

        {loading ? <Dots /> : (
          <div className="flex flex-col gap-10">
            {/* Row 1: stats cards */}
            <OverviewCards sessions={sessions} transcripts={transcripts} />

            {/* Row 2: session table + detail or feed */}
            {selected ? (
              <SessionDetail
                session={selected}
                transcripts={selectedTranscripts}
                onBack={() => setSelectedSession(null)}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                  <SessionDataTable
                    sessions={sessions}
                    transcripts={transcripts}
                    onSelect={(id) => setSelectedSession(id)}
                  />
                </div>
                <div className="lg:col-span-2">
                  <TranscriptFeed transcripts={transcripts} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

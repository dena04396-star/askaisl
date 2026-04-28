"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TranscriptEntry } from "@/types";
import { formatDate } from "@/lib/utils/helpers";

export default function DashboardPage() {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TranscriptEntry | null>(null);

  useEffect(() => {
    fetch("/api/transcript")
      .then((r) => r.json())
      .then(({ transcripts }) => setTranscripts(transcripts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Research Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Past interview sessions and transcripts
            </p>
          </div>
          <Link
            href="/chat"
            className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-teal-500"
          >
            + New Interview
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-teal-500" />
            </div>
          </div>
        ) : transcripts.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950">
              <span className="text-3xl">🎙️</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                No interviews yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Start your first research session to see results here.
              </p>
            </div>
            <Link
              href="/chat"
              className="rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
            >
              Begin Interview →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Session list */}
            <div className="lg:col-span-1">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sessions ({transcripts.length})
              </h2>
              <div className="flex flex-col gap-2">
                {transcripts.map((t, i) => {
                  const userTurns = t.messages.filter(
                    (m) => m.role === "user"
                  ).length;
                  const isActive = selected?.sessionId === t.sessionId;
                  return (
                    <button
                      key={t.sessionId}
                      onClick={() => setSelected(t)}
                      className={`w-full rounded-xl p-4 text-left transition-all ${
                        isActive
                          ? "bg-teal-600 text-white shadow-md"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-teal-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${
                            isActive ? "text-teal-200" : "text-slate-400"
                          }`}
                        >
                          Session {i + 1}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isActive
                              ? "bg-teal-500 text-white"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                          }`}
                        >
                          {userTurns} turns
                        </span>
                      </div>
                      <p
                        className={`mt-1.5 text-sm font-medium truncate ${
                          isActive ? "text-white" : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {t.messages.find((m) => m.role === "user")?.content.slice(0, 50) ??
                          "Interview session"}
                        …
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          isActive ? "text-teal-200" : "text-slate-400"
                        }`}
                      >
                        {formatDate(t.createdAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transcript viewer */}
            <div className="lg:col-span-2">
              {selected ? (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Transcript — {formatDate(selected.createdAt)}
                    </h2>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="flex max-h-150 flex-col gap-3 overflow-y-auto rounded-xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    {selected.messages
                      .filter((m) => m.role !== "system")
                      .map((m, i) => (
                        <div
                          key={i}
                          className={`flex gap-2.5 ${
                            m.role === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              m.role === "assistant"
                                ? "bg-teal-700 text-white"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {m.role === "assistant" ? "D" : "R"}
                          </div>
                          <div
                            className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                              m.role === "assistant"
                                ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                                : "bg-teal-600 text-white"
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-center dark:border-slate-800">
                  <p className="text-sm text-slate-400">
                    Select a session to view the transcript
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

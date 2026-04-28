import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Vinterview
      </h1>
      <p className="max-w-xl text-xl text-zinc-600 dark:text-zinc-400">
        Practice job interviews with an AI-powered interviewer. Get real-time
        feedback, transcripts, and summaries.
      </p>
      <div className="flex gap-4">
        <Link
          href="/chat"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Start Interview
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}

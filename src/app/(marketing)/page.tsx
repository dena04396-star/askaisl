import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vinterview – AI Interview Practice",
  description:
    "Ace your next interview with Vinterview, the AI-powered interview coach.",
};

export default function MarketingPage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-32 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Land your dream job
      </h1>
      <p className="max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
        Vinterview uses AI to simulate realistic job interviews, provide instant
        feedback, and help you improve with every session.
      </p>
    </section>
  );
}

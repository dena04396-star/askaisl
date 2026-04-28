import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard – Vinterview",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-2 text-zinc-500">
        Your past interviews and progress will appear here.
      </p>
    </main>
  );
}

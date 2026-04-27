"use client";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-red-600 dark:text-red-400">
        Something went wrong: {error.message}
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Try again
      </button>
    </div>
  );
}

import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
          A
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-sm bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
            : "rounded-bl-sm bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="ml-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
          U
        </div>
      )}
    </div>
  );
}

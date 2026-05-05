import type { Metadata } from "next";
import ChatInterface from "@/components/chat/ChatInterface";

export const metadata: Metadata = {
  title: "Interview – Askaisl",
};

export default function ChatPage() {
  return (
    <div className="flex h-screen flex-col">
      <ChatInterface />
    </div>
  );
}

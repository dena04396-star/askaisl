import type { Metadata } from "next";
import ChatInterface from "@/components/chat/ChatInterface";

export const metadata: Metadata = {
  title: "Interview – Vinterview",
};

export default function ChatPage() {
  return (
    <div className="flex h-screen flex-col">
      <ChatInterface />
    </div>
  );
}

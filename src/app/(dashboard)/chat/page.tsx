import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-60px)] flex flex-col bg-white rounded-xl border border-surface-border overflow-hidden">
      <ChatInterface />
    </div>
  );
}

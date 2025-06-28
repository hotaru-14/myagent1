"use client";

import { ChatInterfaceWithStorage } from "@/components/features/chat/chat-interface-with-storage";

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* メインコンテンツエリア: 全画面を使用 */}
      <div className="flex-1 flex overflow-hidden">
        <ChatInterfaceWithStorage autoSave={true} />
      </div>
    </div>
  );
} 
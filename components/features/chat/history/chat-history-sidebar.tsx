"use client";

import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationList } from "./conversation-list";
import type { ConversationWithDetails } from "@/lib/types/chat";  

interface ChatHistorySidebarProps {
  conversations: ConversationWithDetails[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  onDeleteConversation: (conversationId: string) => void;
  onCreateConversation: (title: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ChatHistorySidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  onCreateConversation,
  isLoading = false,
  className = ""
}: ChatHistorySidebarProps) {
  const handleCreateConversation = () => {
    const now = new Date();
    const title = `新しい会話 ${now.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    onCreateConversation(title);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* 新しい会話作成ボタン */}
      <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm">
        <Button 
          onClick={handleCreateConversation}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
          variant="default"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          新しい会話
        </Button>
      </div>
      
      {/* 会話リスト */}
      <div className="flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          className="h-full"
        />
      </div>
      
      {/* フッター情報 */}
      <div className="p-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>{conversations.length}件の会話</p>
          {selectedConversationId && (
            <p className="text-blue-600">現在選択中の会話</p>
          )}
        </div>
      </div>
    </div>
  );
} 
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
    onCreateConversation("新しい会話");
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 新しい会話作成ボタン */}
      <div className="p-4 border-b border-gray-200">
        <Button 
          onClick={handleCreateConversation}
          disabled={isLoading}
          className="w-full"
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
    </div>
  );
} 
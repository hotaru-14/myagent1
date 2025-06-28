"use client";

import { memo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationItem } from './conversation-item';
import type { ConversationWithDetails } from '@/lib/types/chat';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedConversationId?: string | null;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  onDeleteConversation: (conversationId: string) => void;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  className = ""
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className={`flex items-center justify-center text-center text-gray-500 text-sm ${className}`}>
        <div>
          <p>まだ会話がありません</p>
          <p className="text-xs text-gray-400 mt-1">
            新しい会話を作成してチャットを始めましょう
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedConversationId === conversation.id}
            onSelect={onSelectConversation}
            onDelete={onDeleteConversation}
          />
        ))}
      </div>
    </div>
  );
} 
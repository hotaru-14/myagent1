"use client";

import { ConversationItem } from './conversation-item';
import { useChatScroll } from "@/lib/hooks/use-chat-scroll";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect } from "react";
import type { ConversationWithDetails } from '@/lib/types/chat';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedConversationId?: string;
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
  // 会話リストの自動スクロール機能
  // 新しい会話が追加された時に最新（一番上）にスクロール
  const scrollRef = useChatScroll(
    conversations.length, 
    { behavior: 'smooth', block: 'start' }
  );

  // 選択された会話が変更された時に、その会話項目にスクロール
  useEffect(() => {
    if (selectedConversationId && scrollRef.current) {
      // 少し遅延を入れてDOMの更新を待つ
      setTimeout(() => {
        const selectedElement = scrollRef.current?.querySelector(`[data-conversation-id="${selectedConversationId}"]`);
        if (selectedElement) {
          selectedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  }, [selectedConversationId, scrollRef]);

  if (conversations.length === 0) {
    return (
      <div className={`flex items-center justify-center text-center text-gray-500 text-sm h-full ${className}`}>
        <div className="p-8">
          <div className="text-4xl mb-4">💬</div>
          <p className="font-medium mb-2">まだ会話がありません</p>
          <p className="text-xs text-gray-400">
            新しい会話を作成してチャットを始めましょう
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollRef} className={`h-full ${className}`}>
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedConversationId === conversation.id}
            onSelect={onSelectConversation}
            onDelete={onDeleteConversation}
            data-conversation-id={conversation.id}
          />
        ))}
      </div>
    </ScrollArea>
  );
} 
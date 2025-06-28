"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { EmptyState } from "../ui/empty-state";
import { TypingIndicator } from "../ui/typing-indicator";
import { useChatScroll } from "@/lib/hooks/use-chat-scroll";
import type { Message } from "@/lib/types/chat";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  conversationId?: string;
  enableMarkdown?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  conversationId,
  enableMarkdown = true,
  emptyStateTitle,
  emptyStateDescription,
  className = ""
}: MessageListProps) {
  // 自動スクロール機能を設定
  // メッセージ配列とローディング状態を依存値とし、スムーズスクロールで下端に移動
  const scrollRef = useChatScroll(
    [messages, isLoading], 
    { behavior: 'smooth', block: 'end' }
  );

  // 表示用メッセージをフィルタリング
  const displayMessages = messages.filter(
    (message) => message.role === "user" || message.role === "assistant"
  );

  return (
    <ScrollArea ref={scrollRef} className={`flex-1 pr-4 ${className}`}>
      <div className="space-y-4">
        {/* 空の状態表示 */}
        {displayMessages.length === 0 && !isLoading && (
          <EmptyState className="py-8" />
        )}
        
        {/* メッセージ一覧 */}
        {displayMessages.map((message, index) => {
          // 最後のassistantメッセージがストリーミング中かどうかを判定
          const isStreaming = 
            isLoading && 
            index === displayMessages.length - 1 && 
            message.role === "assistant";
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={isStreaming}
              conversationId={conversationId}
              enableMarkdown={enableMarkdown}
            />
          );
        })}
        
        {/* TypingIndicatorはメッセージが全くない時のみ表示 */}
        {isLoading && displayMessages.length === 0 && <TypingIndicator />}
      </div>
    </ScrollArea>
  );
} 
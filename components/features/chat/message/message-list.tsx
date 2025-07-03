"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { EmptyState } from "../ui/empty-state";
import { TypingIndicator } from "../ui/typing-indicator";
import { useSmartChatScroll } from "@/lib/hooks/use-chat-scroll";
import { useEffect } from "react";
import type { Message } from "@/lib/types/chat";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  conversationId?: string;
  enableMarkdown?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  conversationId,
  enableMarkdown = true,
  className = ""
}: MessageListProps) {
  // より高度な自動スクロール機能を使用
  // ユーザーが手動スクロールしている時は自動スクロールを無効化
  const { ref: scrollRef, scrollToBottom, isNearBottom } = useSmartChatScroll(
    [messages, isLoading], 
    50 // 底部から50px以内の時のみ自動スクロール
  );

  // 表示用メッセージをフィルタリング
  const displayMessages = messages.filter(
    (message) => message.role === "user" || message.role === "assistant"
  );

  // 新しいメッセージが追加された時の処理
  useEffect(() => {
    // ユーザーが底部近くにいる場合のみ自動スクロール
    if (isNearBottom && displayMessages.length > 0) {
      // 少し遅延を入れてDOM更新を待つ
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [displayMessages.length, isNearBottom, scrollToBottom]);

  // ローディング状態が変化した時の処理
  useEffect(() => {
    if (!isLoading && isNearBottom) {
      // 応答完了時にスクロール
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isLoading, isNearBottom, scrollToBottom]);

  return (
    <div className={`flex-1 flex flex-col ${className}`}>
      <ScrollArea ref={scrollRef} className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
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
          {isLoading && displayMessages.length === 0 && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* 底部に戻るボタン（ユーザーが上にスクロールした時に表示） */}
      {!isNearBottom && (
        <div className="absolute bottom-4 right-6 z-10">
          <button
            onClick={scrollToBottom}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            aria-label="最新メッセージに移動"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 
"use client";

import { useChat } from "@ai-sdk/react";
import { Card, CardContent } from "@/components/ui/card";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message/message-list";
import { ChatInput } from "./chat-input";
import type { Message } from "@/lib/types/chat";

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  const handleInputValueChange = (value: string) => {
    handleInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
  };

  // UIMessage を Message 型に変換する関数  
  const convertToMessages = (uiMessages: ReturnType<typeof useChat>['messages']): Message[] => {
    return uiMessages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant') // 対応するロールのみフィルタ
      .map((msg, index) => ({
        id: msg.id || `temp-${index}`,
        conversation_id: 'temp-conversation', // 一時的な会話ID
        agent_id: msg.role === 'assistant' ? 'weatherAgent' : '', // デフォルトエージェント
        role: msg.role as 'user' | 'assistant', // 型アサーション
        content: msg.content,
        created_at: msg.createdAt?.toISOString() || new Date().toISOString()
      }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <ChatHeader />

      <CardContent className="flex-1 flex flex-col p-4">
        <MessageList 
          messages={convertToMessages(messages)}
          isLoading={isLoading}
        />

        <ChatInput
          value={input}
          onChange={handleInputValueChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
          placeholder="天気について聞いてみてください..."
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
} 
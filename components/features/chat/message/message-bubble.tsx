"use client";

import { MessageAvatar } from "./message-avatar";
import { MessageContent } from "./message-content";
import type { Message } from "@/lib/types/chat";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  conversationId?: string;
  enableMarkdown?: boolean;
  className?: string;
}

export function MessageBubble({ 
  message, 
  isStreaming = false,
  conversationId,
  enableMarkdown = true,
  className = "" 
}: MessageBubbleProps) {
  const { role, content, agent_id } = message;
  
  return (
    <div
      className={`flex ${
        role === "user" ? "justify-end" : "justify-start"
      } ${className}`}
    >
      <div
        className={`flex items-start gap-3 max-w-[80%] ${
          role === "user" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <MessageAvatar role={role} content={content} />
        <MessageContent 
          content={content} 
          role={role} 
          agentId={agent_id}
          isStreaming={isStreaming}
          conversationId={conversationId}
          enableMarkdown={enableMarkdown}
        />
      </div>
    </div>
  );
} 
"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationWithDetails } from "@/lib/types/chat";

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  isSelected?: boolean;
  onSelect: (conversation: ConversationWithDetails) => void;
  onDelete: (conversationId: string) => void;
  className?: string;
  "data-conversation-id"?: string;
}

export function ConversationItem({
  conversation,
  isSelected = false,
  onSelect,
  onDelete,
  className = "",
  "data-conversation-id": dataConversationId
}: ConversationItemProps) {
  const handleSelect = () => {
    onSelect(conversation);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`「${conversation.title}」を削除しますか？`)) {
      onDelete(conversation.id);
    }
  };

  return (
    <div
      className={cn(
        "group p-2 rounded-md cursor-pointer transition-all duration-200 border-l-2 hover:bg-gray-100",
        isSelected 
          ? "bg-blue-50 border-l-blue-500" 
          : "border-l-transparent hover:border-l-gray-300",
        className
      )}
      onClick={handleSelect}
      data-conversation-id={dataConversationId}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className={cn(
            "text-sm truncate font-medium",
            isSelected ? "text-blue-700" : "text-gray-700"
          )}>
            {conversation.title}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 flex-shrink-0"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      {/* 会話の詳細情報表示 */}
      <div className="mt-1 text-xs text-gray-500">
        {conversation.last_message && (
          <div className="truncate">
            最新: {conversation.last_message.slice(0, 50)}
            {conversation.last_message.length > 50 ? '...' : ''}
          </div>
        )}
        <div className="flex justify-between items-center mt-1">
          <span>{conversation.message_count || 0}件のメッセージ</span>
          <span>
            {conversation.last_message_at 
              ? new Date(conversation.last_message_at).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '未送信'
            }
          </span>
        </div>
      </div>
    </div>
  );
} 
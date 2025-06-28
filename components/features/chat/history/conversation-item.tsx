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
}

export function ConversationItem({
  conversation,
  isSelected = false,
  onSelect,
  onDelete,
  className = ""
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
    </div>
  );
} 
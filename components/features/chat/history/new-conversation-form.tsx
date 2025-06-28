"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewConversationFormProps {
  onCreateConversation: (title: string) => void;
  disabled?: boolean;
  className?: string;
}

export function NewConversationForm({
  onCreateConversation,
  disabled = false,
  className = ""
}: NewConversationFormProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const conversationTitle = title.trim() || `天気の相談 ${new Date().toLocaleDateString('ja-JP')}`;
    onCreateConversation(conversationTitle);
    setTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
      <Input
        placeholder="新しい会話のタイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="text-sm"
        aria-label="新しい会話のタイトルを入力"
      />
      <Button 
        type="submit"
        disabled={disabled}
        className="w-full text-sm"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        新しい会話
      </Button>
    </form>
  );
} 
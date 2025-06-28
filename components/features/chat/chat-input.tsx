"use client";

import { Send, Mic, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({ 
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "メッセージを入力してください...",
  className = ""
}: ChatInputProps) {
  const [rows, setRows] = useState(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // 行数を動的に調整（最大3行）
    const lineCount = Math.min(newValue.split('\n').length, 3);
    setRows(lineCount);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      if (value.trim()) {
        // フォーム送信イベントとして扱うため、適切な型変換
        const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
        onSubmit(formEvent);
        setRows(1); // 送信後に行数をリセット
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(e);
      setRows(1); // 送信後に行数をリセット
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-end gap-2 ${className}`}>
      {/* 添付ボタン（将来の拡張用） */}
      <Button 
        type="button" 
        variant="outline" 
        size="icon"
        className="shrink-0 h-10 w-10"
        disabled={disabled}
        title="ファイルを添付"
      >
        <Paperclip className="w-4 h-4" />
      </Button>

      {/* テキスト入力エリア */}
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className="w-full min-h-[40px] max-h-[120px] resize-none pr-12 py-3 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="メッセージを入力"
        />
        
        {/* 文字数カウンター（長いメッセージの場合のみ表示） */}
        {value.length > 100 && (
          <span className="absolute bottom-1 right-12 text-xs text-gray-400">
            {value.length}
          </span>
        )}
      </div>

      {/* 音声入力ボタン（将来の拡張用） */}
      <Button 
        type="button" 
        variant="outline" 
        size="icon"
        className="shrink-0 h-10 w-10"
        disabled={disabled}
        title="音声入力"
      >
        <Mic className="w-4 h-4" />
      </Button>

      {/* 送信ボタン */}
      <Button 
        type="submit" 
        disabled={disabled || !value.trim()} 
        size="icon"
        className="shrink-0 h-10 w-10 bg-blue-600 hover:bg-blue-700"
        aria-label="メッセージを送信"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
} 
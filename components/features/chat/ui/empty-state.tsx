"use client";

import { Bot } from "lucide-react";

interface EmptyStateProps {
  className?: string;
}

export function EmptyState({ className = "" }: EmptyStateProps) {
  return (
    <div className={`text-center text-gray-500 py-8 ${className}`}>
      <Bot className="w-12 h-12 mx-auto mb-4 text-blue-500" />
      <p className="text-lg font-medium">Weather Agentへようこそ！</p>
      <p className="text-sm">天気について何でも聞いてください</p>
      <div className="mt-4 space-y-2 text-xs text-gray-400">
        <p>例: &ldquo;東京の今日の天気は？&rdquo;</p>
        <p>例: &ldquo;ニューヨークの天気を教えて&rdquo;</p>
        <p>例: &ldquo;大阪の明日の天気予報は？&rdquo;</p>
      </div>
    </div>
  );
} 
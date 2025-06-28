"use client";

import { LoaderIcon } from "lucide-react";
import { MessageAvatar } from "../message/message-avatar";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className = "" }: TypingIndicatorProps) {
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="flex items-start gap-3 max-w-[80%]">
        <MessageAvatar role="assistant" />
        <div className="bg-gray-100 rounded-lg px-4 py-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div 
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
} 
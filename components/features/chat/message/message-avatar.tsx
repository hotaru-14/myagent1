"use client";

import { User } from "lucide-react";
import { WeatherIcon } from "./weather-icon";

interface MessageAvatarProps {
  role: "user" | "assistant";
  content?: string;
  className?: string;
}

export function MessageAvatar({ 
  role, 
  content = "", 
  className = "w-8 h-8" 
}: MessageAvatarProps) {
  const baseClasses = `${className} rounded-full flex items-center justify-center`;
  
  if (role === "user") {
    return (
      <div className={`${baseClasses} bg-green-500 text-white`}>
        <User className="w-4 h-4" />
      </div>
    );
  }
  
  return (
    <div className={`${baseClasses} bg-blue-500 text-white`}>
      <WeatherIcon content={content} />
    </div>
  );
} 
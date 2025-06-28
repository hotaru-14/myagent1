"use client";

import { Sun, Cloud, CloudRain, Bot } from "lucide-react";

interface WeatherIconProps {
  content: string;
  className?: string;
}

export function WeatherIcon({ content, className = "w-4 h-4" }: WeatherIconProps) {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("sunny") || lowerContent.includes("clear")) {
    return <Sun className={`${className} text-yellow-500`} />;
  } else if (lowerContent.includes("cloudy") || lowerContent.includes("overcast")) {
    return <Cloud className={`${className} text-gray-500`} />;
  } else if (lowerContent.includes("rain") || lowerContent.includes("drizzle")) {
    return <CloudRain className={`${className} text-blue-500`} />;
  }
  
  return <Bot className={`${className} text-blue-600`} />;
} 
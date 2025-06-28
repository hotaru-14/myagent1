"use client";

import { Save, Wifi, WifiOff, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StatusType = "autosave" | "online" | "offline" | "saved" | "saving";

interface ChatStatusBadgeProps {
  type: StatusType;
  text?: string;
  className?: string;
}

export function ChatStatusBadge({ 
  type, 
  text,
  className = "" 
}: ChatStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (type) {
      case "autosave":
        return {
          icon: <Save className="w-3 h-3 mr-1" />,
          text: text || "自動保存",
          variant: "secondary" as const
        };
      case "online":
        return {
          icon: <Wifi className="w-3 h-3 mr-1" />,
          text: text || "オンライン",
          variant: "default" as const
        };
      case "offline":
        return {
          icon: <WifiOff className="w-3 h-3 mr-1" />,
          text: text || "オフライン",
          variant: "destructive" as const
        };
      case "saved":
        return {
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
          text: text || "保存済み",
          variant: "default" as const
        };
      case "saving":
        return {
          icon: <Clock className="w-3 h-3 mr-1 animate-spin" />,
          text: text || "保存中",
          variant: "secondary" as const
        };
      default:
        return {
          icon: null,
          text: text || "",
          variant: "secondary" as const
        };
    }
  };

  const { icon, text: displayText, variant } = getStatusConfig();

  return (
    <Badge variant={variant} className={`text-xs ${className}`}>
      {icon}
      {displayText}
    </Badge>
  );
} 
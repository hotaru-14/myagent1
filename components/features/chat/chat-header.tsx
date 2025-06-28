"use client";

import { Bot, History, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { AgentDropdown } from "./agent-selector/agent-dropdown";
import { AgentDropdownCompact } from "./agent-selector/agent-dropdown-compact";
import { useAgentState } from "@/lib/hooks/use-agent-state";
import { getAgentById } from "@/lib/constants/agents";
import type { Agent } from "@/lib/types/agent";

interface ChatHeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;
  showHistoryButton?: boolean;
  onHistoryToggle?: () => void;
  currentConversationTitle?: string;
  currentAgentId?: string;
  onAgentChange?: (agentId: string) => void;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  className?: string;
}

export function ChatHeader({
  title,
  subtitle,
  description,
  showHistoryButton = false,
  onHistoryToggle,
  currentConversationTitle,
  currentAgentId,
  onAgentChange,
  showSettings = false,
  onSettingsClick,
  className = ""
}: ChatHeaderProps) {
  
  const {
    currentAgent,
    availableAgents,
    isChanging,
    changeAgent
  } = useAgentState({
    initialAgentId: currentAgentId
  });

  // エージェント変更時の処理
  const handleAgentChange = (agentId: string) => {
    changeAgent(agentId);
    onAgentChange?.(agentId);
  };

  // 現在のエージェント情報から動的なタイトルを生成
  const dynamicTitle = title || currentAgent?.name || "AI Chat";

  // エージェント色に基づくグラデーション
  const getGradientClass = (agent: Agent | null) => {
    if (!agent) return "from-blue-500 to-purple-600";
    
    switch (agent.color) {
      case 'blue': return "from-blue-500 to-blue-600";
      case 'green': return "from-green-500 to-green-600";
      case 'purple': return "from-purple-500 to-purple-600";
      case 'gray': return "from-gray-500 to-gray-600";
      default: return "from-blue-500 to-purple-600";
    }
  };

  return (
    <CardHeader className={`
      bg-gradient-to-r ${getGradientClass(currentAgent)} 
      text-white rounded-t-lg transition-all duration-300
      ${className}
    `}>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* エージェントアイコン */}
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            {currentAgent?.icon || <Bot className="w-5 h-5" />}
          </div>
          
          {/* タイトル部分 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{dynamicTitle}</span>
              {isChanging && (
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
              )}
            </div>
            {(subtitle || currentConversationTitle) && (
              <div className="text-sm text-white/80 font-normal truncate">
                {subtitle || currentConversationTitle}
              </div>
            )}
          </div>
        </div>
        
        {/* 右側のコントロール */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* デスクトップ用エージェント選択 */}
          <div className="hidden md:block">
            <AgentDropdown
              selectedAgent={currentAgent!}
              availableAgents={availableAgents}
              onAgentChange={handleAgentChange}
              isChanging={isChanging}
              className="text-gray-800"
            />
          </div>
          
          {/* モバイル用コンパクトエージェント選択 */}
          <div className="md:hidden">
            <AgentDropdownCompact
              selectedAgent={currentAgent!}
              availableAgents={availableAgents}
              onAgentChange={handleAgentChange}
              isChanging={isChanging}
              className="text-gray-800"
            />
          </div>
          
          {/* 設定ボタン */}
          {showSettings && onSettingsClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="text-white hover:bg-white/10"
              aria-label="設定"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
          
          {/* 履歴ボタン */}
          {showHistoryButton && onHistoryToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onHistoryToggle}
              className="text-white hover:bg-white/10"
              aria-label="会話履歴を表示"
            >
              <History className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardTitle>
    </CardHeader>
  );
} 
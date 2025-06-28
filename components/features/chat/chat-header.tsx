"use client";

import { Bot, History, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { AgentDropdown } from "./agent-selector/agent-dropdown";
import { AgentDropdownCompact } from "./agent-selector/agent-dropdown-compact";
import { useGlobalAgentState } from "@/lib/contexts/agent-context";
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
  } = useGlobalAgentState();

  // エージェント変更時の処理
  const handleAgentChange = (agentId: string) => {
    changeAgent(agentId);
    onAgentChange?.(agentId);
  };

  // 現在のエージェント情報から動的なタイトルを生成
  const dynamicTitle = title || currentAgent?.name || "AI Chat";

  // エージェント色に基づくグラデーション（視認性改善版）
  const getGradientClass = (agent: Agent | null) => {
    if (!agent) return "from-blue-600 to-purple-700";
    
    // 研究エージェントの場合は特別だが控えめなグラデーション
    if (agent.id === 'researchAgent') {
      return "from-purple-600 via-indigo-600 to-purple-800";
    }
    
    switch (agent.color) {
      case 'blue': return "from-blue-600 to-blue-700";
      case 'green': return "from-green-600 to-green-700";
      case 'purple': return "from-purple-600 to-purple-700";
      case 'gray': return "from-gray-600 to-gray-700";
      default: return "from-blue-600 to-purple-700";
    }
  };

  return (
    <CardHeader className={`
      bg-gradient-to-r ${getGradientClass(currentAgent)} 
      text-white rounded-t-lg transition-all duration-500
      shadow-lg border-b border-white/20
      ${className}
    `}>
      {/* 背景オーバーレイでコントラスト改善 */}
      <div className="absolute inset-0 bg-black/20 rounded-t-lg"></div>
      
      {/* 研究エージェント専用の控えめな背景エフェクト */}
      {currentAgent?.id === 'researchAgent' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50"></div>
      )}
      
      <CardTitle className="flex items-center justify-between relative z-10 py-1">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* エージェントアイコン - サイズ改善 */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            bg-white/25 backdrop-blur-sm border border-white/30
            shadow-lg transition-all duration-300
          `}>
            <span className="text-xl filter drop-shadow-sm">
              {currentAgent?.icon || <Bot className="w-6 h-6" />}
            </span>
          </div>
          
          {/* タイトル部分 - 可読性改善 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl truncate drop-shadow-sm">
                {dynamicTitle}
              </span>
              {currentAgent?.id === 'researchAgent' && (
                <Sparkles className="w-5 h-5 text-yellow-200 drop-shadow-sm animate-pulse" />
              )}
              {isChanging && (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin drop-shadow-sm"></div>
              )}
            </div>
            {(subtitle || currentConversationTitle) && (
              <div className="text-sm text-white/95 font-medium truncate mt-1 drop-shadow-sm">
                {subtitle || currentConversationTitle}
              </div>
            )}
          </div>
        </div>
        
        {/* 右側のコントロール - 視認性改善 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* デスクトップ用エージェント選択 */}
          <div className="hidden md:block">
            <AgentDropdown
              selectedAgent={currentAgent!}
              availableAgents={availableAgents}
              onAgentChange={handleAgentChange}
              isChanging={isChanging}
              className="text-gray-800 shadow-lg"
            />
          </div>
          
          {/* モバイル用コンパクトエージェント選択 */}
          <div className="md:hidden">
            <AgentDropdownCompact
              selectedAgent={currentAgent!}
              availableAgents={availableAgents}
              onAgentChange={handleAgentChange}
              isChanging={isChanging}
              className="text-gray-800 shadow-lg"
            />
          </div>
          
          {/* 設定ボタン - 改善版 */}
          {showSettings && onSettingsClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="
                text-white hover:bg-white/30 active:bg-white/40
                p-3 rounded-lg backdrop-blur-sm border border-white/40
                transition-all duration-200 shadow-md hover:shadow-lg
                hover:scale-105 drop-shadow-sm
              "
              aria-label="設定"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
          
          {/* 履歴ボタン - 改善版 */}
          {showHistoryButton && onHistoryToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onHistoryToggle}
              className="
                text-white hover:bg-white/30 active:bg-white/40
                p-3 rounded-lg backdrop-blur-sm border border-white/40
                transition-all duration-200 shadow-md hover:shadow-lg
                hover:scale-105 drop-shadow-sm
              "
              aria-label="会話履歴を表示"
            >
              <History className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardTitle>
    </CardHeader>
  );
} 
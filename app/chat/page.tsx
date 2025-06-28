"use client";

import React from 'react';
import { ChatInterfaceWithStorage } from "@/components/features/chat/chat-interface-with-storage";
import { AgentDebugPanel, useDebugPanel } from "@/lib/components/debug/agent-debug-panel";
import { AdvancedDebugPanel, useAdvancedDebug } from "@/lib/components/debug/advanced-debug-panel";
import { FallbackNotificationContainer } from "@/components/features/chat/ui/fallback-notification";
import { useAgentContext } from "@/lib/contexts/agent-context";

export default function ChatPage() {
  const { showDebug } = useDebugPanel();
  const { 
    showPanel: showAdvancedDebug, 
    setShowPanel: setShowAdvancedDebug,
    logDebug
  } = useAdvancedDebug();
  
  const { 
    state: { fallbackNotifications }, 
    dismissFallbackNotification, 
    undoAgentChange
  } = useAgentContext();

  // 初期ログメッセージ
  React.useEffect(() => {
    logDebug('Chat page loaded', { timestamp: new Date().toISOString() }, 'ChatPage');
  }, [logDebug]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* メインコンテンツエリア: 全画面を使用 */}
      <div className="flex-1 flex overflow-hidden">
        <ChatInterfaceWithStorage autoSave={true} />
      </div>
      
      {/* フォールバック通知コンテナ (Phase D.1) */}
      <FallbackNotificationContainer
        notifications={fallbackNotifications}
        onDismiss={dismissFallbackNotification}
        onUndoFallback={undoAgentChange}
        onViewDetails={(fallbackReason) => {
          console.group('🔍 Fallback Details');
          console.log('Reason:', fallbackReason);
          console.log('Code:', fallbackReason.code);
          console.log('Severity:', fallbackReason.severity);
          console.log('Context:', fallbackReason.context);
          console.groupEnd();
          
          logDebug('Fallback details viewed', {
            code: fallbackReason.code,
            severity: fallbackReason.severity,
            originalAgent: fallbackReason.originalAgentId,
            targetAgent: fallbackReason.targetAgentId
          }, 'FallbackNotification');
        }}
      />
      
      {/* Phase A.1テスト用デバッグパネル */}
      {/* Ctrl+Shift+D で表示切り替え */}
      {showDebug && <AgentDebugPanel />}
      
      {/* Phase D.3高度デバッグパネル */}
      {/* Ctrl+Alt+D で表示切り替え */}
      {showAdvancedDebug && (
        <AdvancedDebugPanel 
          onClose={() => setShowAdvancedDebug(false)}
          initialTab="logs"
        />
      )}
      
      {/* デバッグパネル使用方法の表示 */}
      <div className="fixed bottom-4 left-4 space-y-1">
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded p-2 text-xs text-yellow-800 dark:text-yellow-200">
          <kbd className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Ctrl+Shift+D</kbd> Basic Debug Panel
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded p-2 text-xs text-purple-800 dark:text-purple-200">
          <kbd className="bg-purple-200 dark:bg-purple-800 px-1 rounded">Ctrl+Alt+D</kbd> Advanced Debug Panel
        </div>
      </div>
    </div>
  );
} 
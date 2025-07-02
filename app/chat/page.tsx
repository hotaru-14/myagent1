"use client";

import React from 'react';
import { ChatInterfaceWithStorage } from "@/components/features/chat/chat-interface-with-storage";
import { FallbackNotificationContainer } from "@/components/features/chat/ui/fallback-notification";
import { useAgentContext } from "@/lib/contexts/agent-context";

export default function ChatPage() {
  const { 
    state: { fallbackNotifications }, 
    dismissFallbackNotification, 
    undoAgentChange
  } = useAgentContext();

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
        }}
      />
      

    </div>
  );
} 
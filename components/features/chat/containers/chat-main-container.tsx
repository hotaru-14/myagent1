"use client";

import { memo } from 'react';
import { useSidebarState } from '@/lib/hooks/use-sidebar-state';
import { useConversationManager } from '@/lib/hooks/use-conversation-manager';
import { useChatInputManager } from '@/lib/hooks/use-chat-input-manager';
import { useGlobalAgentState } from '@/lib/contexts/agent-context';
import { ChatHeader } from '../chat-header';
import { MessageList } from '../message/message-list';
import { ChatInput } from '../chat-input';
import { MobileMenuButton } from '../ui/mobile-menu-button';
import { ErrorMessage } from '../ui/error-message';

interface ChatMainContainerProps {
  // 新しい統合プロパティ（オプション）
  sidebarState?: ReturnType<typeof useSidebarState>;
  agentState?: ReturnType<typeof useGlobalAgentState>;
  conversationManager?: ReturnType<typeof useConversationManager>;
  chatInputManager?: ReturnType<typeof useChatInputManager>;
  selectedConversationId?: string;
  isConversationLoading?: boolean;
  
  // 既存のプロパティ
  conversationId?: string;
  autoSave?: boolean;
  className?: string;
}

export const ChatMainContainer = memo(({
  // 新しい統合プロパティ
  sidebarState: externalSidebarState,
  agentState: externalAgentState,
  conversationManager: externalConversationManager,
  chatInputManager: externalChatInputManager,
  selectedConversationId,
  isConversationLoading: externalIsConversationLoading,
  
  // 既存のプロパティ
  conversationId,
  autoSave = true,
  className = ""
}: ChatMainContainerProps) => {
  
  // 外部から状態が渡されている場合は使用、そうでなければ内部のhooksを使用
  const internalSidebarState = useSidebarState();
  const internalConversationManager = useConversationManager({ 
    initialConversationId: conversationId || selectedConversationId, 
    autoSave 
  });
  const internalAgentState = useGlobalAgentState();
  const internalChatInputManager = useChatInputManager({
    conversationId: conversationId || selectedConversationId,
    autoSave
  });
  
  const sidebarState = externalSidebarState || internalSidebarState;
  const conversationManager = externalConversationManager || internalConversationManager;
  const agentState = externalAgentState || internalAgentState;
  const chatInputManager = externalChatInputManager || internalChatInputManager;
  
  const { showSidebar, isMobile } = sidebarState;
  
  const {
    currentConversation,
    error: conversationError,
    isLoading: conversationLoading
  } = conversationManager;

  const {
    isChanging: agentChanging,
    changeAgent
  } = agentState;

  const {
    messages,
    input,
    isLoading: chatLoading,
    handleInputChange,
    handleSubmit
  } = chatInputManager;

  // エージェント変更ハンドラー
  const handleAgentChange = (agentId: string) => {
    changeAgent(agentId);
  };

  // AI応答待ち専用のローディング状態（TypingIndicator用）
  const isWaitingForAiResponse = chatLoading;
  
  // その他のローディング状態（UI無効化用）
  const isGeneralLoading = (externalIsConversationLoading ?? conversationLoading) || agentChanging;

  return (
    <div className={`
      flex-1 flex flex-col h-full
      transition-all duration-300 ease-in-out
      ${className}
    `}>
      {/* チャットヘッダー */}
      <div className="relative">
        {/* モバイル用ハンバーガーメニューボタン */}
        <MobileMenuButton
          onClick={showSidebar}
          isVisible={isMobile}
          disabled={isGeneralLoading}
        />

        <ChatHeader
          currentConversationTitle={currentConversation?.title}
          onAgentChange={handleAgentChange}
          showSettings={true}
          onSettingsClick={() => {/* 設定処理 */}}
          className="rounded-none md:rounded-t-lg"
        />
      </div>

      {/* チャットメッセージエリア */}
      <div className="flex-1 overflow-hidden bg-white relative">
        {conversationError && (
          <ErrorMessage 
            message={conversationError}
            className="absolute top-4 left-4 right-4 z-20"
          />
        )}

        <MessageList 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages={messages as unknown as any[]}
          isLoading={isWaitingForAiResponse}
          conversationId={currentConversation?.id || selectedConversationId}
          className="h-full p-4"
        />
      </div>

      {/* チャット入力エリア */}
      <div className="bg-gray-50 p-4">
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isGeneralLoading || isWaitingForAiResponse}
          className=""
        />
      </div>
    </div>
  );
});

ChatMainContainer.displayName = 'ChatMainContainer'; 
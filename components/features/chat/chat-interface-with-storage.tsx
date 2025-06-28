"use client";

import { useIntegratedChatState } from '@/lib/hooks/use-integrated-chat-state';
import { ChatSidebarContainer } from './containers/chat-sidebar-container';
import { ChatMainContainer } from './containers/chat-main-container';

interface ChatInterfaceWithStorageProps {
  // 既存の会話を読み込む場合
  conversationId?: string;
  // 自動保存を有効にするか
  autoSave?: boolean;
}

export function ChatInterfaceWithStorage({ 
  conversationId, 
  autoSave = true 
}: ChatInterfaceWithStorageProps) {
  
  // 統合されたチャット状態管理
  const {
    selectedConversationId,
    isConversationLoading,
    sidebarState,
    agentState,
    conversationManager,
    chatInputManager,
    selectConversation,
    createNewConversation,
    deleteConversation
  } = useIntegratedChatState({
    initialConversationId: conversationId,
    autoSave
  });

  return (
    <div className="flex h-full w-full relative">
      {/* サイドバーコンテナ */}
      <ChatSidebarContainer
        // 統合された状態と機能を渡す
        sidebarState={sidebarState}
        conversationManager={conversationManager}
        isConversationLoading={isConversationLoading}
        selectedConversationId={selectedConversationId}
        onSelectConversation={selectConversation}
        onCreateConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
      />

      {/* メインチャットコンテナ */}
      <ChatMainContainer
        // 統合された状態と機能を渡す
        sidebarState={sidebarState}
        agentState={agentState}
        conversationManager={conversationManager}
        chatInputManager={chatInputManager}
        selectedConversationId={selectedConversationId}
        isConversationLoading={isConversationLoading}
        autoSave={autoSave}
      />
    </div>
  );
} 
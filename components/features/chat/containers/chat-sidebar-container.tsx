"use client";

import { memo } from 'react';
import { useSidebarState } from '@/lib/hooks/use-sidebar-state';
import { useConversationManager } from '@/lib/hooks/use-conversation-manager';
import { SidebarHeader } from '../history/sidebar-header';
import { ChatHistorySidebar } from '../history/chat-history-sidebar';
import { MobileOverlay } from '../ui/mobile-overlay';
import type { ConversationWithDetails } from '@/lib/types/chat';

interface ChatSidebarContainerProps {
  // 新しい統合プロパティ（オプション）
  sidebarState?: ReturnType<typeof useSidebarState>;
  conversationManager?: ReturnType<typeof useConversationManager>;
  isConversationLoading?: boolean;
  selectedConversationId?: string;
  
  // 既存のプロパティ
  onSelectConversation?: (conversation: ConversationWithDetails) => void;
  onCreateConversation?: (title: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  disabled?: boolean;
  className?: string;
}

export const ChatSidebarContainer = memo(({
  // 新しい統合プロパティ
  sidebarState: externalSidebarState,
  conversationManager: externalConversationManager,
  isConversationLoading: externalIsConversationLoading,
  selectedConversationId,
  
  // 既存のプロパティ
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  disabled = false,
  className = ""
}: ChatSidebarContainerProps) => {
  
  // 外部から状態が渡されている場合は使用、そうでなければ内部のhooksを使用
  const internalSidebarState = useSidebarState();
  const internalConversationManager = useConversationManager();
  
  const sidebarState = externalSidebarState || internalSidebarState;
  const conversationManager = externalConversationManager || internalConversationManager;
  const isConversationLoading = externalIsConversationLoading ?? conversationManager.isLoading;
  
  const { 
    isVisible: isSidebarOpen, 
    toggleSidebar, 
    hideSidebar,
    isMobile
  } = sidebarState;

  const {
    currentConversation,
    conversations,
    handleDeleteConversation: internalHandleDeleteConversation
  } = conversationManager;

  // モバイルでサイドバーを閉じる
  const handleMobileClose = () => {
    if (isMobile) {
      hideSidebar();
    }
  };

  // 会話選択ハンドラー
  const handleSelectConversation = (conversation: ConversationWithDetails) => {
    onSelectConversation?.(conversation);
    handleMobileClose();
  };

  // 会話作成ハンドラー
  const handleCreateConversation = async (title: string) => {
    if (onCreateConversation) {
      await onCreateConversation(title);
    }
    handleMobileClose();
  };

  // 会話削除ハンドラー
  const handleDeleteConversationWrapper = async (conversationId: string) => {
    if (onDeleteConversation) {
      return await onDeleteConversation(conversationId);
    } else {
      return await internalHandleDeleteConversation(conversationId);
    }
  };

  // 会話データを履歴コンポーネント用にマッピング
  const historyConversations: ConversationWithDetails[] = conversations.map((conv: ConversationWithDetails) => ({
    id: conv.id,
    title: conv.title,
    updated_at: conv.updated_at,
    created_at: conv.created_at,
    user_id: conv.user_id,
    last_message: conv.last_message,
    last_message_at: conv.last_message_at,
    last_agent_id: conv.last_agent_id
  }));

  return (
    <>
      {/* モバイル用オーバーレイ */}
      <MobileOverlay 
        isVisible={isSidebarOpen && isMobile} 
        onClick={hideSidebar}
      />

      {/* サイドバー */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        fixed md:relative
        h-full bg-gray-50
        transform transition-all duration-300 ease-in-out
        z-30 md:z-0
        flex flex-col
        ${isSidebarOpen ? 'w-80 md:w-72 lg:w-80' : 'w-12 overflow-visible'}
        md:translate-x-0
        ${className}
      `}>
        {/* サイドバーヘッダー */}
        <SidebarHeader 
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          disabled={disabled}
        />

        {/* サイドバーコンテンツ（条件表示） */}
        {isSidebarOpen && (
          <div className="flex-1 overflow-hidden">
            <ChatHistorySidebar
              conversations={historyConversations}
              selectedConversationId={selectedConversationId || currentConversation?.id}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversationWrapper}
              onCreateConversation={handleCreateConversation}
              isLoading={isConversationLoading}
            />
          </div>
        )}
      </div>
    </>
  );
});

ChatSidebarContainer.displayName = 'ChatSidebarContainer'; 
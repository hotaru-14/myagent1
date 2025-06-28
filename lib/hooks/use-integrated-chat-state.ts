"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSidebarState } from './use-sidebar-state';
import { useGlobalAgentState } from '@/lib/contexts/agent-context';
import { useConversationManager } from './use-conversation-manager';
import { useChatInputManager } from './use-chat-input-manager';
import { DEFAULT_AGENT_ID, getAgentById } from '@/lib/constants/agents';
import type { ConversationWithDetails } from '@/lib/types/chat';

interface UseIntegratedChatStateProps {
  initialConversationId?: string;
  autoSave?: boolean;
}

export function useIntegratedChatState({
  initialConversationId,
  autoSave = true
}: UseIntegratedChatStateProps = {}) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(initialConversationId);
  const [isConversationLoading, setIsConversationLoading] = useState(false);

  // 各種状態管理hooks
  const sidebarState = useSidebarState();
  const agentState = useGlobalAgentState();
  
  const conversationManager = useConversationManager({ 
    initialConversationId: selectedConversationId, 
    autoSave 
  });
  
  const chatInputManager = useChatInputManager({
    conversationId: selectedConversationId,
    autoSave
  });

  // 会話選択時の統合処理
  const selectConversation = useCallback(async (conversation: ConversationWithDetails) => {
    if (isConversationLoading) return; // 重複処理を防ぐ
    
    setIsConversationLoading(true);
    
    try {
      console.log('Selecting conversation:', conversation.id);
      
      // 1. 選択された会話IDを設定
      setSelectedConversationId(conversation.id);
      
      // 2. 会話データを読み込み（メッセージも含む）
      const result = await conversationManager.loadConversationById(conversation.id);
      
      if (result) {
        // 3. チャット入力管理にメッセージを設定
        chatInputManager.loadMessages(result.messages);
        
        // 5. 適切なエージェントに切り替え
        if (result.messages.length > 0) {
          const lastMessage = result.messages[result.messages.length - 1];
          const lastAgentId = lastMessage.agent_id;
          
          if (lastAgentId) {
            const agent = getAgentById(lastAgentId);
            if (agent && agentState.currentAgent?.id !== lastAgentId) {
              console.log(`Switching agent from ${agentState.currentAgent?.id} to ${lastAgentId} for conversation ${conversation.id}`);
              agentState.changeAgent(lastAgentId);
            }
          } else if (agentState.currentAgent?.id !== DEFAULT_AGENT_ID) {
            // agent_idが存在しない場合、デフォルトエージェントにフォールバック
            agentState.changeAgent(DEFAULT_AGENT_ID);
          }
        }
        
        // 6. モバイルでサイドバーを閉じる
        if (sidebarState.isMobile) {
          sidebarState.hideSidebar();
        }
        
        console.log('Conversation loaded successfully:', conversation.id);
      }
    } catch (error) {
      console.error('Error selecting conversation:', error);
    } finally {
      setIsConversationLoading(false);
    }
  }, [
    isConversationLoading,
    conversationManager,
    chatInputManager,
    agentState,
    sidebarState
  ]);

  // 新しい会話を作成
  const createNewConversation = useCallback(async (title?: string) => {
    setIsConversationLoading(true);
    
    try {
      console.log('Creating new conversation:', title);
      
      // 1. 選択された会話IDをクリア
      setSelectedConversationId(undefined);
      
      // 2. メッセージをクリア
      chatInputManager.clearMessages();
      
      // 3. 新しい会話を作成（タイトルが指定されていれば）
      const result = await conversationManager.createNewConversation(title);
      
      // 4. デフォルトエージェントに設定
      if (agentState.currentAgent?.id !== DEFAULT_AGENT_ID) {
        agentState.changeAgent(DEFAULT_AGENT_ID);
      }
      
      // 5. モバイルでサイドバーを閉じる
      if (sidebarState.isMobile) {
        sidebarState.hideSidebar();
      }
      
      console.log('New conversation created successfully');
      return result;
    } catch (error) {
      console.error('Error creating new conversation:', error);
      return null;
    } finally {
      setIsConversationLoading(false);
    }
  }, [
    conversationManager,
    chatInputManager,
    agentState,
    sidebarState
  ]);

  // 会話を削除
  const deleteConversation = useCallback(async (conversationId: string) => {
    const result = await conversationManager.handleDeleteConversation(conversationId);
    
    if (result && selectedConversationId === conversationId) {
      // 削除された会話が選択中の会話だった場合、クリア
      setSelectedConversationId(undefined);
      chatInputManager.clearMessages();
    }
    
    return result;
  }, [conversationManager, chatInputManager, selectedConversationId]);

  return {
    // 状態
    selectedConversationId,
    isConversationLoading,
    
    // 各種管理オブジェクト
    sidebarState,
    agentState,
    conversationManager,
    chatInputManager,
    
    // 統合アクション
    selectConversation,
    createNewConversation,
    deleteConversation
  };
} 
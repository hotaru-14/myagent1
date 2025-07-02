"use client";

import { useState, useEffect, useCallback } from 'react';
import { useGlobalAgentState } from '@/lib/contexts/agent-context';
import { useChatStorage } from './use-chat-storage';

import { getAgentById, DEFAULT_AGENT_ID } from '@/lib/constants/agents';

interface UseConversationManagerProps {
  initialConversationId?: string;
  autoSave?: boolean;
}

export function useConversationManager({
  initialConversationId,
  autoSave = true
}: UseConversationManagerProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    currentConversation,
    conversations,
    isLoading: storageLoading,
    error: storageError,
    saveMessage,
    saveMessagePair,
    createConversationWithMessagePair,
    ensureConversationExists,
    loadMessages,
    deleteConversation,
    updateConversationTitle,
    setCurrentConversation,
    manualCleanup
  } = useChatStorage();

  const { currentAgent, changeAgent } = useGlobalAgentState();

  // 指定された会話を読み込み
  useEffect(() => {
    if (initialConversationId) {
      loadConversationById(initialConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, conversations]);

  // 会話のメッセージを読み込み
  const loadConversationById = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      setCurrentConversation(conversation);
      const rawMessages = await loadMessages(conversationId);
      
      // メッセージをフォーマット
      const messages = rawMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: new Date(msg.created_at),
        agent_id: msg.agent_id
      }));

      // デフォルトエージェント設定: 既存会話を開く場合、最後のメッセージのagent_idを自動選択
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const lastAgentId = lastMessage.agent_id;
        
        if (lastAgentId) {
          const agent = getAgentById(lastAgentId);
          if (agent && currentAgent?.id !== lastAgentId) {
            changeAgent(lastAgentId);
          } else if (!agent) {
            console.warn(`Invalid agent_id found: ${lastAgentId}. Falling back to default agent.`);
            if (currentAgent?.id !== DEFAULT_AGENT_ID) {
              changeAgent(DEFAULT_AGENT_ID);
            }
          }
        } else if (currentAgent?.id !== DEFAULT_AGENT_ID) {
          changeAgent(DEFAULT_AGENT_ID);
        }
      }

      return { conversation, messages };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
      console.error('Error loading conversation:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [conversations, setCurrentConversation, loadMessages, currentAgent, changeAgent]);

  // 新しい会話を作成（実際のDBレコードとして即座に作成）
  const createNewConversation = useCallback(async (title?: string) => {
    setError(null);
    
    try {
      // 現在の会話をクリアして新しい会話の準備
      setCurrentConversation(null);
      
      // デフォルトエージェント設定: 新規会話開始時はデフォルトエージェントに設定
      if (currentAgent?.id !== DEFAULT_AGENT_ID) {
        changeAgent(DEFAULT_AGENT_ID);
      }

      // 一時IDを使わず、実際の会話を即座に作成
      const conversationId = await ensureConversationExists(title || '新しい会話');

      if (!conversationId) {
        throw new Error('Failed to create conversation');
      }

      const newConversation = {
        id: conversationId,
        user_id: '', // 実際のuser_idはサーバー側で設定される
        title: title || '新しい会話',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setCurrentConversation(newConversation);
      
      return newConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      console.error('Error creating conversation:', err);
      return null;
    }
  }, [setCurrentConversation, currentAgent, changeAgent, ensureConversationExists]);

  // 新機能：メッセージペア保存（競合状態解決）
  const saveMessagePairToConversation = useCallback(async (
    userContent: string,
    aiContent: string,
    agentId?: string
  ) => {
    if (!autoSave) return null;

    const resolvedAgentId = agentId || currentAgent?.id || DEFAULT_AGENT_ID;
    
    console.log(`[ConversationManager] 💾 Starting message pair save:`, {
      userContentLength: userContent.length,
      aiContentLength: aiContent.length,
      agentId: resolvedAgentId,
      conversation: {
        id: currentConversation?.id,
        exists: !!currentConversation
      },
      timestamp: new Date().toISOString()
    });

    setError(null);

    try {
      if (currentConversation?.id) {
        // 既存の会話にメッセージペアを保存
        console.log(`[ConversationManager] 📝 Saving message pair to existing conversation: ${currentConversation.id}`);
        const result = await saveMessagePair(
          currentConversation.id,
          userContent,
          aiContent,
          resolvedAgentId
        );
        
        console.log(`[ConversationManager] ✅ Message pair saved to existing conversation:`, {
          conversationId: currentConversation.id,
          userMessageId: result?.userMessage?.id,
          aiMessageId: result?.aiMessage?.id,
          agentId: resolvedAgentId
        });
        
        return result;
      } else {
        // 新しい会話を作成し、同時にメッセージペアを保存
        const agentName = currentAgent?.name || "AI";
        const title = userContent.slice(0, 30) || `新しい${agentName}との会話`;
        
        console.log(`[ConversationManager] 🆕 Creating new conversation with message pair:`, {
          title,
          agentId: resolvedAgentId
        });
        
        const result = await createConversationWithMessagePair(
          userContent,
          aiContent,
          resolvedAgentId,
          title
        );
        
        if (result) {
          console.log(`[ConversationManager] ✅ New conversation created with message pair:`, {
            conversationId: result.conversation.id,
            userMessageId: result.userMessage.id,
            aiMessageId: result.aiMessage.id,
            agentId: resolvedAgentId
          });
          
          // 新しく作成された会話を現在の会話として設定
          setCurrentConversation(result.conversation);
          return result;
        }
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save message pair';
      setError(errorMessage);
      console.error(`[ConversationManager] ❌ Error saving message pair:`, {
        error: errorMessage,
        agentId: resolvedAgentId,
        userContentLength: userContent.length,
        aiContentLength: aiContent.length
      });
      return null;
    }
  }, [
    autoSave, 
    currentConversation, 
    currentAgent, 
    saveMessagePair,
    createConversationWithMessagePair,
    setCurrentConversation
  ]);

  // 従来のメッセージ保存関数（互換性のため残す）
  const saveMessageToConversation = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    agentId?: string
  ) => {
    if (!autoSave) return null;

    const resolvedAgentId = agentId || currentAgent?.id || DEFAULT_AGENT_ID;
    
    console.log(`[ConversationManager] 📝 Saving single message (legacy):`, {
      role,
      contentLength: content.length,
      agentId: resolvedAgentId,
      conversationId: currentConversation?.id
    });

    setError(null);

    try {
      if (currentConversation?.id) {
        // 既存の会話にメッセージを保存
        const result = await saveMessage(
          currentConversation.id, 
          role, 
          content, 
          resolvedAgentId
        );
        
        console.log(`[ConversationManager] ✅ Single message saved:`, {
          conversationId: currentConversation.id,
          messageId: result?.id,
          agentId: resolvedAgentId
        });
        
        return result;
      } else {
        throw new Error('No conversation available for single message save');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save message';
      setError(errorMessage);
      console.error(`[ConversationManager] ❌ Error saving single message:`, {
        error: errorMessage,
        agentId: resolvedAgentId,
        role,
        contentLength: content.length
      });
      return null;
    }
  }, [autoSave, currentConversation, currentAgent, saveMessage]);

  // 会話を削除
  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    if (!window.confirm('この会話を削除しますか？')) {
      return false;
    }

    setError(null);

    try {
      await deleteConversation(conversationId);
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMessage);
      console.error('Error deleting conversation:', err);
      return false;
    }
  }, [currentConversation, deleteConversation, setCurrentConversation]);

  // 会話のメッセージを取得
  const getConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const messages = await loadMessages(conversationId);
      return messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: new Date(msg.created_at),
        agent_id: msg.agent_id
      }));
    } catch (err) {
      console.error('Error loading conversation messages:', err);
      return [];
    }
  }, [loadMessages]);

  return {
    // 状態
    currentConversation,
    conversations,
    isLoading: isLoading || storageLoading,
    error: error || storageError,

    // アクション
    loadConversationById,
    createNewConversation,
    saveMessageToConversation, // 互換性のため残す
    saveMessagePairToConversation, // 新機能：メッセージペア保存
    handleDeleteConversation,
    updateConversationTitle,
    setCurrentConversation,
    getConversationMessages,
    manualCleanup // 手動クリーンアップ機能を追加
  };
} 
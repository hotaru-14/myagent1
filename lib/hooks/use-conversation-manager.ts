"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChatStorage } from './use-chat-storage';
import { useGlobalAgentState } from '@/lib/contexts/agent-context';
import { DEFAULT_AGENT_ID, getAgentById } from '@/lib/constants/agents';
import type { Conversation } from '@/lib/types/chat';
import { generateTempId, isTemporaryId } from '@/lib/utils/id-utils';

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
  
  // 新しい会話作成時の会話IDを一時的に保存
  const pendingConversationIdRef = useRef<string | null>(null);

  const {
    currentConversation,
    conversations,
    isLoading: storageLoading,
    error: storageError,
    createConversation,
    saveMessage,
    saveMessageWithConversation,
    loadMessages,
    deleteConversation,
    updateConversationTitle,
    setCurrentConversation
  } = useChatStorage();

  const { currentAgent, changeAgent } = useGlobalAgentState();

  // 指定された会話を読み込み
  useEffect(() => {
    if (initialConversationId) {
      loadConversationById(initialConversationId);
    }
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

  // 新しい会話を作成（一時的な状態のみ、DB保存なし）
  const createNewConversation = useCallback(async (title?: string) => {
    setError(null);
    
    try {
      // 現在の会話をクリアして新しい会話の準備
      setCurrentConversation(null);
      pendingConversationIdRef.current = null;
      
      // デフォルトエージェント設定: 新規会話開始時はデフォルトエージェントに設定
      if (currentAgent?.id !== DEFAULT_AGENT_ID) {
        changeAgent(DEFAULT_AGENT_ID);
      }

      // 一時的な会話IDを生成してローカル状態のみ設定
      const tempId = generateTempId();
      const temporaryConversation = {
        id: tempId,
        title: title || '新しい会話',
        user_id: '', // 実際のユーザーIDは保存時に設定
        created_at: '',
        updated_at: ''
      };

      setCurrentConversation(temporaryConversation);
      
      return temporaryConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      console.error('Error creating conversation:', err);
      return null;
    }
  }, [setCurrentConversation, currentAgent, changeAgent]);

  // メッセージを保存（会話作成も同時に行う場合）
  const saveMessageToConversation = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    agentId?: string
  ) => {
    if (!autoSave) return null;

    const resolvedAgentId = agentId || currentAgent?.id || DEFAULT_AGENT_ID;
    
    // Phase C: DB保存前のバリデーションとログ
    console.log(`[ConversationManager] 💾 Starting message save:`, {
      role,
      contentLength: content.length,
      contentPreview: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      agentId: {
        provided: agentId,
        current: currentAgent?.id,
        resolved: resolvedAgentId
      },
      conversation: {
        id: currentConversation?.id,
        isTemporary: currentConversation ? isTemporaryId(currentConversation.id) : null
      },
      timestamp: new Date().toISOString()
    });

    setError(null);

    try {
      if (currentConversation && !isTemporaryId(currentConversation.id)) {
        // 既存の会話（永続ID）にメッセージを保存
        console.log(`[ConversationManager] 📝 Saving to existing conversation: ${currentConversation.id}`);
        const result = await saveMessage(
          currentConversation.id, 
          role, 
          content, 
          resolvedAgentId
        );
        
        console.log(`[ConversationManager] ✅ Message saved to existing conversation:`, {
          conversationId: currentConversation.id,
          messageId: result?.id,
          agentId: resolvedAgentId
        });
        
        return result;
      } else {
        // 新しい会話を作成し、同時にメッセージを保存
        // 一時的な会話またはcurrentConversationがnullの場合
        const agentName = currentAgent?.name || "AI";
        const title = currentConversation?.title || content.slice(0, 30) || `新しい${agentName}との会話`;
        
        console.log(`[ConversationManager] 🆕 Creating new conversation with message:`, {
          title,
          agentId: resolvedAgentId
        });
        
        const result = await saveMessageWithConversation(
          role, 
          content, 
          resolvedAgentId, 
          title
        );
        
        if (result) {
          console.log(`[ConversationManager] ✅ New conversation created:`, {
            conversationId: result.conversation.id,
            messageId: result.message.id,
            agentId: resolvedAgentId
          });
          
          // 新しく作成された会話を現在の会話として設定
          setCurrentConversation(result.conversation);
          pendingConversationIdRef.current = result.conversation.id;
          return result;
        }
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save message';
      setError(errorMessage);
      console.error(`[ConversationManager] ❌ Error saving message:`, {
        error: errorMessage,
        agentId: resolvedAgentId,
        role,
        contentLength: content.length
      });
      return null;
    }
  }, [
    autoSave, 
    currentConversation, 
    currentAgent, 
    saveMessage, 
    saveMessageWithConversation,
    setCurrentConversation
  ]);

  // AI応答後の保存処理
  const saveAiResponse = useCallback(async (content: string, agentId?: string) => {
    if (!autoSave) return null;

    const resolvedAgentId = agentId || currentAgent?.id || DEFAULT_AGENT_ID;
    const conversationId = currentConversation?.id || pendingConversationIdRef.current;
    
    // Phase C: AI応答保存前のバリデーションとログ
    console.log(`[ConversationManager] 🤖 Starting AI response save:`, {
      contentLength: content.length,
      contentPreview: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      agentId: {
        provided: agentId,
        current: currentAgent?.id,
        resolved: resolvedAgentId
      },
      conversationId: {
        current: currentConversation?.id,
        pending: pendingConversationIdRef.current,
        resolved: conversationId
      },
      timestamp: new Date().toISOString()
    });

    try {
      if (conversationId) {
        console.log(`[ConversationManager] 📝 Saving AI response to conversation: ${conversationId}`);
        const result = await saveMessage(
          conversationId, 
          'assistant', 
          content, 
          resolvedAgentId
        );
        
        console.log(`[ConversationManager] ✅ AI response saved:`, {
          conversationId,
          messageId: result?.id,
          agentId: resolvedAgentId,
          contentLength: content.length
        });
        
        // 保存後、一時的な会話IDをクリア
        pendingConversationIdRef.current = null;
        return result;
      } else {
        const error = 'No conversation ID available for saving AI response';
        console.error(`[ConversationManager] ❌ ${error}:`, {
          currentConversation: currentConversation?.id,
          pendingConversationId: pendingConversationIdRef.current,
          agentId: resolvedAgentId
        });
        throw new Error(error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save AI response';
      setError(errorMessage);
      console.error(`[ConversationManager] ❌ Error saving AI response:`, {
        error: errorMessage,
        agentId: resolvedAgentId,
        conversationId,
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
    pendingConversationId: pendingConversationIdRef.current,

    // アクション
    loadConversationById,
    createNewConversation,
    saveMessageToConversation,
    saveAiResponse,
    handleDeleteConversation,
    updateConversationTitle,
    setCurrentConversation,
    getConversationMessages
  };
} 
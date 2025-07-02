"use client";

import { useState, useCallback, useOptimistic, useRef } from 'react';
import { Message, UIMessage } from '@/lib/types/chat';
import { generateId } from 'ai';

interface OptimisticChatState {
  messages: UIMessage[];
  isLoading: boolean;
  error: string | null;
  pendingMessageIds: Set<string>;
}

type OptimisticAction = 
  | { type: 'ADD_USER_MESSAGE'; payload: { id: string; conversationId: string; agentId: string; content: string } }
  | { type: 'ADD_AI_MESSAGE'; payload: { id: string; conversationId: string; agentId: string; content: string; isLoading?: boolean } }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<UIMessage> } }
  | { type: 'REMOVE_MESSAGE'; payload: { id: string } }
  | { type: 'SET_LOADING'; payload: { id: string; isLoading: boolean } }
  | { type: 'SET_ERROR'; payload: { id: string; error: string } };

interface UseOptimisticChatProps {
  initialMessages?: Message[];
  onSaveMessage?: (userContent: string, aiContent: string, agentId: string) => Promise<{ userMessage: Message; aiMessage: Message } | null>;
}

/**
 * 楽観的UI更新を提供するチャットフック
 * ChatGPT風の即座表示とエラー時のロールバック機能
 * 
 * 参考: Next.js 15の最適化パターン
 * @see https://dev.to/saiful7778/optimizing-database-queries-in-nextjs-15-with-cache-and-prisma-5ehe
 */
export function useOptimisticChat({
  initialMessages = [],
  onSaveMessage
}: UseOptimisticChatProps = {}) {
  
  // 基本状態
  const [baseState, setBaseState] = useState<OptimisticChatState>({
    messages: initialMessages.map(msg => ({ ...msg, isLoading: false })),
    isLoading: false,
    error: null,
    pendingMessageIds: new Set()
  });

  // 楽観的更新の状態管理
  const [optimisticMessages, setOptimisticMessages] = useOptimistic(
    baseState.messages,
    (currentMessages: UIMessage[], action: OptimisticAction) => {
      switch (action.type) {
        case 'ADD_USER_MESSAGE':
          return [
            ...currentMessages,
            {
              id: action.payload.id,
              conversation_id: action.payload.conversationId,
              agent_id: action.payload.agentId,
              role: 'user' as const,
              content: action.payload.content,
              created_at: new Date().toISOString(),
              isLoading: false
            }
          ];

        case 'ADD_AI_MESSAGE':
          return [
            ...currentMessages,
            {
              id: action.payload.id,
              conversation_id: action.payload.conversationId,
              agent_id: action.payload.agentId,
              role: 'assistant' as const,
              content: action.payload.content,
              created_at: new Date().toISOString(),
              isLoading: action.payload.isLoading || false
            }
          ];

        case 'UPDATE_MESSAGE':
          return currentMessages.map(msg =>
            msg.id === action.payload.id
              ? { ...msg, ...action.payload.updates }
              : msg
          );

        case 'REMOVE_MESSAGE':
          return currentMessages.filter(msg => msg.id !== action.payload.id);

        case 'SET_LOADING':
          return currentMessages.map(msg =>
            msg.id === action.payload.id
              ? { ...msg, isLoading: action.payload.isLoading }
              : msg
          );

        case 'SET_ERROR':
          return currentMessages.map(msg =>
            msg.id === action.payload.id
              ? { ...msg, error: action.payload.error, isLoading: false }
              : msg
          );

        default:
          return currentMessages;
      }
    }
  );

  // ペンディング状態の管理
  const pendingMessagesRef = useRef<Map<string, { userTempId: string; aiTempId: string }>>(new Map());

  // エラーリトライの管理
  const [retryAttempts, setRetryAttempts] = useState<Map<string, number>>(new Map());
  const MAX_RETRY_ATTEMPTS = 3;

  // ユーザーメッセージの楽観的追加
  const addOptimisticUserMessage = useCallback((
    content: string,
    agentId: string,
    conversationId?: string
  ) => {
    const tempId = `temp-user-${generateId()}`;
    
    setOptimisticMessages({
      type: 'ADD_USER_MESSAGE',
      payload: {
        id: tempId,
        conversationId: conversationId || 'temp-conversation',
        agentId,
        content
      }
    });

    return tempId;
  }, [setOptimisticMessages]);

  // AI応答の楽観的追加（ローディング状態）
  const addOptimisticAIMessage = useCallback((
    agentId: string,
    conversationId?: string,
    initialContent: string = ''
  ) => {
    const tempId = `temp-ai-${generateId()}`;
    
    setOptimisticMessages({
      type: 'ADD_AI_MESSAGE',
      payload: {
        id: tempId,
        conversationId: conversationId || 'temp-conversation',
        agentId,
        content: initialContent,
        isLoading: true
      }
    });

    return tempId;
  }, [setOptimisticMessages]);

  // ストリーミング中のメッセージ更新
  const updateOptimisticMessage = useCallback((
    messageId: string,
    content: string,
    isComplete: boolean = false
  ) => {
    setOptimisticMessages({
      type: 'UPDATE_MESSAGE',
      payload: {
        id: messageId,
        updates: {
          content,
          isLoading: !isComplete
        }
      }
    });
  }, [setOptimisticMessages]);

  // メッセージペアの保存とロールバック処理
  const saveMessagePairWithOptimism = useCallback(async (
    userContent: string,
    aiContent: string,
    agentId: string,
    conversationId?: string
  ) => {
    // 1. 楽観的にユーザーメッセージを追加
    const userTempId = addOptimisticUserMessage(userContent, agentId, conversationId);
    const aiTempId = addOptimisticAIMessage(agentId, conversationId, aiContent);
    
    // ペンディング状態を記録
    const pairId = generateId();
    pendingMessagesRef.current.set(pairId, { userTempId, aiTempId });
    
    setBaseState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      pendingMessageIds: new Set([...prev.pendingMessageIds, userTempId, aiTempId])
    }));

    try {
      // 2. 実際の保存処理
      if (!onSaveMessage) {
        throw new Error('保存関数が提供されていません');
      }

      const result = await onSaveMessage(userContent, aiContent, agentId);
      
      if (!result) {
        throw new Error('メッセージの保存に失敗しました');
      }

      // 3. 成功時: 一時メッセージを実際のメッセージで置換
      setOptimisticMessages({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: userTempId,
          updates: {
            id: result.userMessage.id,
            conversation_id: result.userMessage.conversation_id,
            created_at: result.userMessage.created_at,
            isLoading: false
          }
        }
      });

      setOptimisticMessages({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: aiTempId,
          updates: {
            id: result.aiMessage.id,
            conversation_id: result.aiMessage.conversation_id,
            created_at: result.aiMessage.created_at,
            isLoading: false
          }
        }
      });

      // ペンディング状態をクリア
      pendingMessagesRef.current.delete(pairId);
      setBaseState(prev => {
        const newPendingIds = new Set(prev.pendingMessageIds);
        newPendingIds.delete(userTempId);
        newPendingIds.delete(aiTempId);
        return {
          ...prev,
          isLoading: false,
          pendingMessageIds: newPendingIds,
          messages: optimisticMessages.map(msg => {
            if (msg.id === userTempId) {
              return { ...result.userMessage, isLoading: false };
            }
            if (msg.id === aiTempId) {
              return { ...result.aiMessage, isLoading: false };
            }
            return msg;
          })
        };
      });

      console.log('✅ Optimistic update completed successfully');
      return result;

    } catch (error) {
      // 4. エラー時: ロールバック処理
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      
      console.error('❌ Optimistic update failed, rolling back:', errorMessage);

      // リトライ判定
      const currentAttempts = retryAttempts.get(pairId) || 0;
      const shouldRetry = currentAttempts < MAX_RETRY_ATTEMPTS;

      if (shouldRetry) {
        // リトライの場合: エラー状態にマークしてリトライ可能にする
        setOptimisticMessages({
          type: 'SET_ERROR',
          payload: {
            id: aiTempId,
            error: `${errorMessage} (リトライ ${currentAttempts + 1}/${MAX_RETRY_ATTEMPTS})`
          }
        });

        setRetryAttempts(prev => new Map(prev).set(pairId, currentAttempts + 1));
      } else {
        // 最大リトライ回数に達した場合: メッセージを削除
        setOptimisticMessages({
          type: 'REMOVE_MESSAGE',
          payload: { id: userTempId }
        });
        
        setOptimisticMessages({
          type: 'REMOVE_MESSAGE',
          payload: { id: aiTempId }
        });
      }

      // ペンディング状態をクリア
      pendingMessagesRef.current.delete(pairId);
      setBaseState(prev => {
        const newPendingIds = new Set(prev.pendingMessageIds);
        newPendingIds.delete(userTempId);
        newPendingIds.delete(aiTempId);
        return {
          ...prev,
          isLoading: false,
          error: shouldRetry ? `${errorMessage} (リトライ可能)` : errorMessage,
          pendingMessageIds: newPendingIds
        };
      });

      return null;
    }
  }, [
    addOptimisticUserMessage,
    addOptimisticAIMessage,
    setOptimisticMessages,
    optimisticMessages,
    onSaveMessage,
    retryAttempts
  ]);

  // リトライ機能
  const retryFailedMessage = useCallback(async (pairId: string) => {
    const pendingPair = pendingMessagesRef.current.get(pairId);
    if (!pendingPair) return;

    const userMessage = optimisticMessages.find(m => m.id === pendingPair.userTempId);
    const aiMessage = optimisticMessages.find(m => m.id === pendingPair.aiTempId);
    
    if (!userMessage || !aiMessage) return;

    await saveMessagePairWithOptimism(
      userMessage.content,
      aiMessage.content,
      userMessage.agent_id,
      userMessage.conversation_id
    );
  }, [optimisticMessages, saveMessagePairWithOptimism]);

  // メッセージのクリア
  const clearMessages = useCallback(() => {
    setBaseState({
      messages: [],
      isLoading: false,
      error: null,
      pendingMessageIds: new Set()
    });
    
    pendingMessagesRef.current.clear();
    setRetryAttempts(new Map());
  }, []);

  // 実際のメッセージでの状態同期
  const syncWithRealMessages = useCallback((realMessages: Message[]) => {
    setBaseState(prev => ({
      ...prev,
      messages: realMessages.map(msg => ({ ...msg, isLoading: false }))
    }));
  }, []);

  return {
    // 状態
    messages: optimisticMessages,
    isLoading: baseState.isLoading,
    error: baseState.error,
    hasPendingMessages: baseState.pendingMessageIds.size > 0,
    
    // アクション
    addOptimisticUserMessage,
    addOptimisticAIMessage,
    updateOptimisticMessage,
    saveMessagePairWithOptimism,
    retryFailedMessage,
    clearMessages,
    syncWithRealMessages,
    
    // デバッグ情報
    pendingMessageIds: Array.from(baseState.pendingMessageIds),
    retryCount: (pairId: string) => retryAttempts.get(pairId) || 0
  };
} 
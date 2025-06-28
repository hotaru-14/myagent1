"use client";

import { useCallback, useRef, useState, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { useConversationManager } from './use-conversation-manager';
import { useAgentState } from './use-agent-state';
import { DEFAULT_AGENT_ID, getAgentById } from '@/lib/constants/agents';
import { 
  isResearchPlanMessage, 
  isResearchProgressMessage, 
  isResearchReportMessage 
} from '@/lib/utils/research-message-utils';

interface UseChatInputManagerProps {
  conversationId?: string;
  autoSave?: boolean;
}

interface ResearchStreamingState {
  isResearchStreaming: boolean;
  currentResearchPhase: 'planning' | 'searching' | 'analyzing' | 'reporting' | null;
  streamingStartTime?: number;
  lastProgressUpdate?: number;
}

export function useChatInputManager({
  conversationId,
  autoSave = true
}: UseChatInputManagerProps = {}) {
  
  // 保存待ちのユーザーメッセージを一時保存
  const pendingUserMessageRef = useRef<{ content: string; agentId: string } | null>(null);
  
  // 研究エージェント用ストリーミング状態管理
  const [researchStreamingState, setResearchStreamingState] = useState<ResearchStreamingState>({
    isResearchStreaming: false,
    currentResearchPhase: null
  });
  
  const { currentAgent } = useAgentState();
  const {
    saveMessageToConversation,
    saveAiResponse,
    setCurrentConversation
  } = useConversationManager({ 
    initialConversationId: conversationId, 
    autoSave 
  });

  // 研究エージェント用の設定計算
  const chatConfig = useMemo(() => {
    const isResearchAgent = currentAgent?.id === 'researchAgent';
    
    return {
      api: "/api/chat",
      body: {
        agentId: currentAgent?.id || DEFAULT_AGENT_ID,
        // 研究エージェント用の拡張設定
        ...(isResearchAgent && {
          streamingTimeout: 300000, // 5分（研究は時間がかかる）
          maxTokens: 4000, // より長いレスポンス対応
          enableProgressTracking: true
        })
      },
      key: `chat-${currentAgent?.id || DEFAULT_AGENT_ID}`, // エージェント変更時に再初期化
      
      // ストリーミング中のリアルタイム処理（研究エージェント拡張）
      onChunk: isResearchAgent ? (chunk: any) => {
        const now = Date.now();
        
        // 研究フェーズの検出と状態更新
        if (chunk.content) {
          const content = chunk.content;
          
          // 研究計画フェーズ検出
          if (isResearchPlanMessage(content)) {
            setResearchStreamingState(prev => ({
              ...prev,
              isResearchStreaming: true,
              currentResearchPhase: 'planning',
              streamingStartTime: prev.streamingStartTime || now,
              lastProgressUpdate: now
            }));
          }
          
          // 検索進捗フェーズ検出  
          else if (isResearchProgressMessage(content)) {
            setResearchStreamingState(prev => ({
              ...prev,
              isResearchStreaming: true,
              currentResearchPhase: 'searching',
              lastProgressUpdate: now
            }));
          }
          
          // レポート生成フェーズ検出
          else if (isResearchReportMessage(content)) {
            setResearchStreamingState(prev => ({
              ...prev,
              currentResearchPhase: 'reporting',
              lastProgressUpdate: now
            }));
          }
        }
      } : undefined,
      
      onFinish: async (message: any) => {
        // 研究エージェントのストリーミング完了処理
        if (currentAgent?.id === 'researchAgent') {
          setResearchStreamingState(prev => ({
            ...prev,
            isResearchStreaming: false,
            currentResearchPhase: null
          }));
          console.log('Research streaming completed:', {
            duration: researchStreamingState.streamingStartTime 
              ? Date.now() - researchStreamingState.streamingStartTime 
              : 0,
            finalPhase: researchStreamingState.currentResearchPhase
          });
        }
        
        // AI応答完了時に、ユーザーメッセージとAI応答を一括保存
        if (autoSave && pendingUserMessageRef.current) {
          try {
            // まずユーザーメッセージを保存
            await saveMessageToConversation(
              'user', 
              pendingUserMessageRef.current.content, 
              pendingUserMessageRef.current.agentId
            );
            
            // 次にAI応答を保存
            await saveAiResponse(message.content, currentAgent?.id);
            
            // 保存完了後、一時保存データをクリア
            pendingUserMessageRef.current = null;
          } catch (error) {
            console.error('Error saving messages:', error);
            // エラー発生時も一時保存データをクリア
            pendingUserMessageRef.current = null;
          }
        }
      },
      
      // エラーハンドリング（研究エージェント拡張）
      onError: (error: any) => {
        console.error('Chat streaming error:', error);
        
        // 研究エージェントのエラー時はストリーミング状態をリセット
        if (currentAgent?.id === 'researchAgent') {
          setResearchStreamingState({
            isResearchStreaming: false,
            currentResearchPhase: null
          });
        }
      }
    };
  }, [currentAgent, researchStreamingState.streamingStartTime]);

  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit: originalHandleSubmit, 
    isLoading,
    setMessages 
  } = useChat(chatConfig);

  // 入力値変更ハンドラー
  const handleInputValueChange = useCallback((value: string) => {
    handleInputChange({ target: { value } } as any);
  }, [handleInputChange]);

  // メッセージ送信時の処理（DB保存は行わず、一時保存のみ）
  const handleSubmitWithSave = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // ユーザーメッセージを一時保存（DB保存はonFinishで行う）
    if (autoSave) {
      pendingUserMessageRef.current = {
        content: input,
        agentId: currentAgent?.id || DEFAULT_AGENT_ID
      };
    }

    // 元のhandleSubmitを実行（API呼び出し）
    originalHandleSubmit(e);
  }, [input, autoSave, currentAgent, originalHandleSubmit]);

  // メッセージをクリア（新しい会話開始時など）
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentConversation(null);
  }, [setMessages, setCurrentConversation]);

  // 会話のメッセージを設定
  const loadMessages = useCallback((chatMessages: any[]) => {
    const formattedMessages = chatMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      createdAt: new Date(msg.created_at || msg.createdAt)
    }));
    setMessages(formattedMessages);
  }, [setMessages]);

  // 会話とメッセージを同期して読み込み
  const loadConversationWithMessages = useCallback(async (conversationId: string, messages: any[]) => {
    // メッセージを設定
    loadMessages(messages);
    
    // 最後のメッセージからエージェントを特定して同期
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const lastAgentId = lastMessage.agent_id;
      
      if (lastAgentId) {
        const agent = getAgentById(lastAgentId);
        if (agent && currentAgent?.id !== lastAgentId) {
          // エージェント変更が必要な場合のみ変更
          console.log(`Switching agent from ${currentAgent?.id} to ${lastAgentId} for conversation ${conversationId}`);
          // 注意: ここではagentStateのchangeAgentを直接呼び出せないので、
          // 親コンポーネントから処理する必要がある
        }
      }
    }
  }, [loadMessages, currentAgent]);

  return {
    // チャット状態
    messages,
    input,
    isLoading,

    // 入力ハンドラー
    handleInputChange: handleInputValueChange,
    handleSubmit: handleSubmitWithSave,

    // メッセージ管理
    clearMessages,
    loadMessages,
    loadConversationWithMessages,
    setMessages,
    
    // 研究エージェント用拡張（Phase 4.2実装）
    researchStreaming: {
      isStreaming: researchStreamingState.isResearchStreaming,
      currentPhase: researchStreamingState.currentResearchPhase,
      startTime: researchStreamingState.streamingStartTime,
      lastUpdate: researchStreamingState.lastProgressUpdate,
      duration: researchStreamingState.streamingStartTime 
        ? Date.now() - researchStreamingState.streamingStartTime 
        : null
    }
  };
} 
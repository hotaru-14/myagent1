"use client";

import { useCallback, useRef, useState, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { useConversationManager } from './use-conversation-manager';
import { useGlobalAgentState } from '@/lib/contexts/agent-context';
import { DEFAULT_AGENT_ID, getAgentById } from '@/lib/constants/agents';

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
  
  const { currentAgent } = useGlobalAgentState();
  const {
    setCurrentConversation,
    saveMessagePairToConversation
  } = useConversationManager({ 
    initialConversationId: conversationId, 
    autoSave 
  });

  // 研究エージェント用の設定計算
  const chatConfig: Parameters<typeof useChat>[0] = useMemo(() => {
    const isResearchAgent = currentAgent?.id === 'researchAgent';
    const agentId = currentAgent?.id || DEFAULT_AGENT_ID;
    
    // Phase C: API送信前のagentIdバリデーション
    console.log(`[ChatInput] 🔧 Preparing API config:`, {
      currentAgent: {
        id: currentAgent?.id,
        name: currentAgent?.name,
        icon: currentAgent?.icon
      },
      resolvedAgentId: agentId,
      isValidAgent: !!currentAgent,
      timestamp: new Date().toISOString()
    });
    
    return {
      api: "/api/chat",
      body: {
        agentId: agentId,
        // 研究エージェント用の拡張設定
        ...(isResearchAgent && {
          streamingTimeout: 300000, // 5分（研究は時間がかかる）
          maxTokens: 4000, // より長いレスポンス対応
          enableProgressTracking: true
        })
      },
      key: `chat-${currentAgent?.id || DEFAULT_AGENT_ID}`, // エージェント変更時に再初期化
      
      // 研究エージェント用ストリーミング進捗処理
      onToolCall: currentAgent?.id === 'researchAgent' ? async ({ toolCall }) => {
        if (toolCall.toolName === 'search_tavily' && researchStreamingState.currentResearchPhase !== 'searching') {
          setResearchStreamingState(prev => ({
            ...prev,
            isResearchStreaming: true,
            currentResearchPhase: 'searching',
            lastProgressUpdate: Date.now()
          }));
        } else if (toolCall.toolName === 'search' && researchStreamingState.currentResearchPhase !== 'analyzing') {
          setResearchStreamingState(prev => ({
            ...prev,
            currentResearchPhase: 'analyzing',
            lastProgressUpdate: Date.now()
          }));
        }
      } : undefined,
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        
        // 新機能：メッセージペア保存（競合状態解決）
        if (autoSave && pendingUserMessageRef.current) {
          const pendingMessage = pendingUserMessageRef.current;
          const aiAgentId = currentAgent?.id || DEFAULT_AGENT_ID;
          
          console.log(`[ChatInput] 💾 Starting message pair save:`, {
            userMessage: {
              content: pendingMessage.content.slice(0, 50) + (pendingMessage.content.length > 50 ? '...' : ''),
              agentId: pendingMessage.agentId
            },
            aiResponse: {
              contentLength: message.content?.length || 0,
              agentId: aiAgentId
            },
            timestamp: new Date().toISOString()
          });
          
          try {
            // メッセージペアを一つのトランザクションで保存
            console.log(`[ChatInput] 🔄 Saving message pair with agentId: ${pendingMessage.agentId}`);
            await saveMessagePairToConversation(
              pendingMessage.content,
              message.content,
              pendingMessage.agentId
            );
            
            console.log(`[ChatInput] ✅ Message pair saved successfully`);
            
            // 保存完了後、一時保存データをクリア
            pendingUserMessageRef.current = null;
          } catch (error) {
            console.error('[ChatInput] ❌ Error saving message pair:', error);
            // エラー発生時も一時保存データをクリア
            pendingUserMessageRef.current = null;
          }
        }
      },
      
      // エラーハンドリング（研究エージェント拡張）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }, [currentAgent, researchStreamingState.streamingStartTime, researchStreamingState.currentResearchPhase, autoSave, saveMessagePairToConversation]);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleInputChange({ target: { value } } as any);
  }, [handleInputChange]);

  // メッセージ送信時の処理（DB保存は行わず、一時保存のみ）
  const handleSubmitWithSave = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const agentId = currentAgent?.id || DEFAULT_AGENT_ID;
    
    // Phase C: メッセージ送信前のバリデーションとログ
    console.log(`[ChatInput] 📤 Preparing message submission:`, {
      messageLength: input.length,
      messagePreview: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
      selectedAgent: {
        id: agentId,
        name: currentAgent?.name || 'Default',
        isValid: !!currentAgent
      },
      autoSave: autoSave,
      timestamp: new Date().toISOString()
    });

    // ユーザーメッセージを一時保存（DB保存はonFinishで行う）
    if (autoSave) {
      pendingUserMessageRef.current = {
        content: input,
        agentId: agentId
      };
      
      console.log(`[ChatInput] 💾 Message queued for saving with agentId: ${agentId}`);
    }

    // 元のhandleSubmitを実行（API呼び出し）
    console.log(`[ChatInput] 🚀 Submitting to API with agentId: ${agentId}`);
    originalHandleSubmit(e);
  }, [input, autoSave, currentAgent, originalHandleSubmit]);

  // メッセージをクリア（新しい会話開始時など）
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentConversation(null);
  }, [setMessages, setCurrentConversation]);

  // 会話のメッセージを設定
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
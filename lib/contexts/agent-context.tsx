// ==========================================
// グローバルエージェント状態管理Context
// ==========================================

"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import type { Agent, AgentState, AgentChangeEvent } from '@/lib/types/agent';
import { DEFAULT_AGENT_ID, getAgentById, getAllAgents } from '@/lib/constants/agents';
import { determineFallbackStrategy, type FallbackReason } from '@/lib/utils/agent-fallback';
import { validateAgentId } from '@/lib/utils/agent-validation';

// ==========================================
// 状態とアクションの型定義
// ==========================================

interface ExtendedAgentState extends AgentState {
  error: string | null;
  isInitialized: boolean;
  lastChangeTimestamp: number | null;
  fallbackNotifications: (FallbackReason & { id: string })[];
}

interface AgentContextValue {
  // 状態
  state: ExtendedAgentState;
  currentAgent: Agent | null;
  lastAgent: Agent | null;
  availableAgents: Agent[];
  
  // アクション
  changeAgent: (newAgentId: string, conversationId?: string) => Promise<boolean>;
  resetAgent: (agentId?: string) => void;
  clearError: () => void;
  
  // 高度な機能
  isValidAgent: (agentId: string) => boolean;
  getAgentChangeHistory: () => AgentChangeEvent[];
  
  // フォールバック通知機能
  showFallbackNotification: (fallbackReason: FallbackReason) => void;
  dismissFallbackNotification: (id: string) => void;
  clearAllFallbackNotifications: () => void;
  undoAgentChange: (targetAgentId: string) => Promise<boolean>;
}

type AgentAction =
  | { type: 'CHANGE_AGENT_START'; payload: string }
  | { type: 'CHANGE_AGENT_SUCCESS'; payload: { newAgentId: string; lastAgentId: string | null } }
  | { type: 'CHANGE_AGENT_ERROR'; payload: string }
  | { type: 'RESET_AGENT'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'INITIALIZE'; payload: string }
  | { type: 'SHOW_FALLBACK_NOTIFICATION'; payload: FallbackReason & { id: string } }
  | { type: 'DISMISS_FALLBACK_NOTIFICATION'; payload: { id: string } }
  | { type: 'CLEAR_FALLBACK_NOTIFICATIONS' };

// ==========================================
// Reducer
// ==========================================

function agentReducer(state: ExtendedAgentState, action: AgentAction): ExtendedAgentState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        currentAgentId: action.payload,
        isInitialized: true,
        error: null
      };

    case 'CHANGE_AGENT_START':
      return {
        ...state,
        isChanging: true,
        error: null
      };

    case 'CHANGE_AGENT_SUCCESS':
      return {
        ...state,
        currentAgentId: action.payload.newAgentId,
        lastAgentId: action.payload.lastAgentId,
        isChanging: false,
        error: null,
        lastChangeTimestamp: Date.now()
      };

    case 'CHANGE_AGENT_ERROR':
      return {
        ...state,
        isChanging: false,
        error: action.payload
      };

    case 'RESET_AGENT':
      return {
        ...state,
        currentAgentId: action.payload,
        lastAgentId: null,
        isChanging: false,
        error: null,
        lastChangeTimestamp: Date.now()
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'SHOW_FALLBACK_NOTIFICATION':
      // 重複通知を防ぐため、同じコードの通知は1つまで
      const existingNotification = state.fallbackNotifications.find(
        n => n.code === action.payload.code && n.originalAgentId === action.payload.originalAgentId
      );
      if (existingNotification) {
        return state; // 既に同じ通知が存在する場合は追加しない
      }
      
      return {
        ...state,
        fallbackNotifications: [...state.fallbackNotifications, action.payload]
      };

    case 'DISMISS_FALLBACK_NOTIFICATION':
      return {
        ...state,
        fallbackNotifications: state.fallbackNotifications.filter(n => n.id !== action.payload.id)
      };

    case 'CLEAR_FALLBACK_NOTIFICATIONS':
      return {
        ...state,
        fallbackNotifications: []
      };

    default:
      return state;
  }
}

// ==========================================
// Context作成
// ==========================================

const AgentContext = createContext<AgentContextValue | null>(null);

// ==========================================
// Provider Props
// ==========================================

interface AgentProviderProps {
  children: ReactNode;
  initialAgentId?: string;
  onAgentChange?: (event: AgentChangeEvent) => void;
}

// ==========================================
// Provider実装
// ==========================================

export function AgentProvider({ 
  children, 
  initialAgentId = DEFAULT_AGENT_ID,
  onAgentChange 
}: AgentProviderProps) {
  
  // 状態管理
  const [state, dispatch] = useReducer(agentReducer, {
    currentAgentId: initialAgentId,
    lastAgentId: null,
    isChanging: false,
    error: null,
    isInitialized: false,
    lastChangeTimestamp: null,
    fallbackNotifications: []
  });

  // 静的データ
  const availableAgents = getAllAgents();
  
  // 計算されたプロパティ
  const currentAgent = getAgentById(state.currentAgentId);
  const lastAgent = state.lastAgentId ? getAgentById(state.lastAgentId) : null;

  // エージェント変更履歴（メモリ内のみ、必要に応じて永続化可能）
  const [changeHistory, setChangeHistory] = React.useState<AgentChangeEvent[]>([]);

  // ==========================================
  // バリデーション関数
  // ==========================================

  const isValidAgent = useCallback((agentId: string): boolean => {
    return !!getAgentById(agentId);
  }, []);

  // ==========================================
  // ローカルストレージ操作
  // ==========================================

  const saveToStorage = useCallback((agentId: string) => {
    try {
      localStorage.setItem('last-selected-agent', agentId);
    } catch (error) {
      console.warn('Failed to save agent to storage:', error);
    }
  }, []);

  const loadFromStorage = useCallback((): string | null => {
    try {
      const saved = localStorage.getItem('last-selected-agent');
      return saved && isValidAgent(saved) ? saved : null;
    } catch (error) {
      console.warn('Failed to load agent from storage:', error);
      return null;
    }
  }, [isValidAgent]);

  // ==========================================
  // エージェント変更関数（改善版）
  // ==========================================

  const changeAgent = useCallback(async (
    newAgentId: string, 
    conversationId?: string
  ): Promise<boolean> => {
    console.log(`[AgentContext] 🔄 Attempting to change agent to: ${newAgentId}`);

    // 既に同じエージェントの場合はスキップ
    if (newAgentId === state.currentAgentId) {
      console.log(`[AgentContext] ⏭️ Already using agent: ${newAgentId}`);
      return true;
    }

    // 変更中の場合は重複実行を防ぐ
    if (state.isChanging) {
      console.warn('[AgentContext] ⚠️ Agent change already in progress');
      return false;
    }

    // フォールバック戦略を適用
    const fallbackResult = determineFallbackStrategy(newAgentId, {
      userAction: 'manual_switch',
      conversationId,
      previousAgent: state.currentAgentId
    });

    let actualTargetAgentId = newAgentId;

    // フォールバック戦略の適用
    if (fallbackResult.shouldFallback) {
      console.log(`[AgentContext] 🔄 Applying fallback strategy: ${fallbackResult.strategy?.name}`);
      
      // フォールバック通知を表示
      if (fallbackResult.userNotificationRequired && fallbackResult.reason) {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        dispatch({
          type: 'SHOW_FALLBACK_NOTIFICATION',
          payload: { ...fallbackResult.reason, id }
        });

        // 重要でない通知は自動削除
        if (fallbackResult.reason.severity === 'low') {
          setTimeout(() => {
            dispatch({
              type: 'DISMISS_FALLBACK_NOTIFICATION',
              payload: { id }
            });
          }, 3000);
        }
      }
      
      // フォールバック先エージェントに変更
      actualTargetAgentId = fallbackResult.targetAgentId!;
      console.log(`[AgentContext] ✅ Fallback target resolved: ${actualTargetAgentId}`);
    }

    // 最終バリデーション
    if (!isValidAgent(actualTargetAgentId)) {
      const errorMsg = `Invalid agent ID after fallback: ${actualTargetAgentId}`;
      console.error(`[AgentContext] ❌ ${errorMsg}`);
      dispatch({ type: 'CHANGE_AGENT_ERROR', payload: errorMsg });
      return false;
    }

    try {
      // 変更開始
      dispatch({ type: 'CHANGE_AGENT_START', payload: actualTargetAgentId });

      // 即座に状態更新（遅延なし）
      const previousAgentId = state.currentAgentId;
      dispatch({ 
        type: 'CHANGE_AGENT_SUCCESS', 
        payload: { 
          newAgentId: actualTargetAgentId, 
          lastAgentId: previousAgentId 
        } 
      });

      // 履歴記録
      const changeEvent: AgentChangeEvent = {
        fromAgentId: previousAgentId,
        toAgentId: actualTargetAgentId,
        conversationId,
        timestamp: new Date()
      };
      
      setChangeHistory(prev => [...prev.slice(-9), changeEvent]); // 最新10件を保持

      // ローカルストレージに保存
      saveToStorage(actualTargetAgentId);

      // コールバック実行
      onAgentChange?.(changeEvent);

      console.log(`[AgentContext] ✅ Agent changed successfully: ${previousAgentId} → ${actualTargetAgentId}`);
      return true;

    } catch (error) {
      const errorMsg = `Failed to change agent: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[AgentContext] ❌ ${errorMsg}`, error);
      dispatch({ type: 'CHANGE_AGENT_ERROR', payload: errorMsg });
      return false;
    }
  }, [state.currentAgentId, state.isChanging, isValidAgent, saveToStorage, onAgentChange]);

  // ==========================================
  // リセット関数
  // ==========================================

  const resetAgent = useCallback((agentId: string = DEFAULT_AGENT_ID) => {
    if (!isValidAgent(agentId)) {
      console.error(`Cannot reset to invalid agent: ${agentId}`);
      return;
    }

    dispatch({ type: 'RESET_AGENT', payload: agentId });
    saveToStorage(agentId);
    
    console.log(`Agent reset to: ${agentId}`);
  }, [isValidAgent, saveToStorage]);

  // ==========================================
  // エラークリア関数
  // ==========================================

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // ==========================================
  // 履歴取得関数
  // ==========================================

  const getAgentChangeHistory = useCallback(() => {
    return [...changeHistory];
  }, [changeHistory]);

  // ==========================================
  // 初期化処理
  // ==========================================

  useEffect(() => {
    if (!state.isInitialized) {
      const savedAgentId = loadFromStorage();
      const targetAgentId = savedAgentId || initialAgentId;
      
      if (isValidAgent(targetAgentId)) {
        dispatch({ type: 'INITIALIZE', payload: targetAgentId });
        console.log(`Agent initialized: ${targetAgentId}`);
      } else {
        dispatch({ type: 'INITIALIZE', payload: DEFAULT_AGENT_ID });
        console.warn(`Invalid initial agent ${targetAgentId}, fallback to ${DEFAULT_AGENT_ID}`);
      }
    }
  }, [state.isInitialized, initialAgentId, loadFromStorage, isValidAgent]);

  // ==========================================
  // Context Value
  // ==========================================

  const contextValue: AgentContextValue = {
    // 状態
    state,
    currentAgent,
    lastAgent,
    availableAgents,
    
    // アクション
    changeAgent,
    resetAgent,
    clearError,
    
    // 高度な機能
    isValidAgent,
    getAgentChangeHistory,
    
    // フォールバック通知機能
    showFallbackNotification: (fallbackReason: FallbackReason) => {
      dispatch({ type: 'SHOW_FALLBACK_NOTIFICATION', payload: { ...fallbackReason, id: Date.now().toString() } });
    },
    dismissFallbackNotification: (id: string) => {
      dispatch({ type: 'DISMISS_FALLBACK_NOTIFICATION', payload: { id } });
    },
    clearAllFallbackNotifications: () => {
      dispatch({ type: 'CLEAR_FALLBACK_NOTIFICATIONS' });
    },
    undoAgentChange: async (targetAgentId: string): Promise<boolean> => {
      if (!isValidAgent(targetAgentId)) {
        console.error(`Cannot undo agent change to invalid agent: ${targetAgentId}`);
        return false;
      }

      try {
        await changeAgent(targetAgentId);
        return true;
      } catch (error) {
        console.error(`Failed to undo agent change: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
        return false;
      }
    }
  };

  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
}

// ==========================================
// Context Hook
// ==========================================

export function useAgentContext(): AgentContextValue {
  const context = useContext(AgentContext);
  
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  
  return context;
}

// ==========================================
// 下位互換性のためのHook（既存のuseAgentStateと同じインターフェース）
// ==========================================

export function useGlobalAgentState() {
  const {
    state,
    currentAgent,
    lastAgent,
    availableAgents,
    changeAgent,
    resetAgent,
    isValidAgent
  } = useAgentContext();

  return {
    // 状態（既存インターフェース互換）
    currentAgent,
    lastAgent,
    availableAgents,
    isChanging: state.isChanging,
    currentAgentId: state.currentAgentId,
    lastAgentId: state.lastAgentId,
    
    // アクション（既存インターフェース互換）
    changeAgent: useCallback((agentId: string, conversationId?: string) => {
      return changeAgent(agentId, conversationId);
    }, [changeAgent]),
    
    resetAgent,
    
    // 新機能
    error: state.error,
    isInitialized: state.isInitialized,
    isValidAgent
  };
} 
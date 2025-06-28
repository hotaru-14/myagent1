// ==========================================
// エージェントフォールバック戦略システム
// ==========================================

import type { Agent, AgentChangeEvent } from '@/lib/types/agent';
import { getAgentById, getAllAgents, DEFAULT_AGENT_ID } from '@/lib/constants/agents';
import { validateAgentId, VALIDATION_ERROR_CODES } from './agent-validation';

// ==========================================
// フォールバック関連の型定義
// ==========================================

export interface FallbackReason {
  code: string;
  message: string;
  originalAgentId: string;
  targetAgentId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: {
    conversationId?: string;
    userAction?: string;
    errorDetails?: string;
  };
}

export interface FallbackStrategy {
  name: string;
  priority: number;
  condition: (agentId: string, context?: FallbackContext) => boolean;
  targetAgent: string | ((agentId: string, context?: FallbackContext) => string);
  allowUserOverride: boolean;
  notifyUser: boolean;
}

export interface FallbackContext {
  conversationId?: string;
  previousAgent?: string;
  userAction?: 'manual_switch' | 'api_call' | 'initialization' | 'error_recovery';
  errorType?: string;
  retryCount?: number;
}

export interface FallbackResult {
  shouldFallback: boolean;
  targetAgentId?: string;
  reason?: FallbackReason;
  strategy?: FallbackStrategy;
  userNotificationRequired: boolean;
  allowUserOverride: boolean;
}

// ==========================================
// フォールバック理由コード定数
// ==========================================

export const FALLBACK_REASON_CODES = {
  // 軽微（ユーザー操作による正常な切り替え）
  USER_MANUAL_SWITCH: 'USER_MANUAL_SWITCH',
  INITIALIZATION: 'INITIALIZATION',
  
  // 中程度（設定・データの問題）
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  INVALID_AGENT_FORMAT: 'INVALID_AGENT_FORMAT',
  STORAGE_CORRUPTION: 'STORAGE_CORRUPTION',
  
  // 重大（システムレベルの問題）
  MASTRA_UNAVAILABLE: 'MASTRA_UNAVAILABLE',
  AGENT_INITIALIZATION_FAILED: 'AGENT_INITIALIZATION_FAILED',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  
  // 致命的（緊急フォールバック）
  CRITICAL_FAILURE: 'CRITICAL_FAILURE'
} as const;

// ==========================================
// フォールバック戦略定義
// ==========================================

export const FALLBACK_STRATEGIES: FallbackStrategy[] = [
  // 戦略1: ユーザー手動切り替え（フォールバック不要）
  {
    name: 'NoFallbackForManualSwitch',
    priority: 1,
    condition: (agentId, context) => {
      return Boolean(context?.userAction === 'manual_switch' && validateAgentId(agentId).isValid);
    },
    targetAgent: (agentId) => agentId,
    allowUserOverride: false,
    notifyUser: false
  },

  // 戦略2: 初期化時のみデフォルトにフォールバック
  {
    name: 'InitializationFallback',
    priority: 2,
    condition: (agentId, context) => {
      return Boolean(context?.userAction === 'initialization' && !validateAgentId(agentId).isValid);
    },
    targetAgent: DEFAULT_AGENT_ID,
    allowUserOverride: true,
    notifyUser: true
  },

  // 戦略3: 前のエージェントに戻す
  {
    name: 'PreviousAgentFallback',
    priority: 3,
    condition: (agentId, context) => {
      return Boolean(
        !validateAgentId(agentId).isValid && 
        context?.previousAgent && 
        validateAgentId(context.previousAgent).isValid &&
        (context?.retryCount === undefined || context.retryCount < 2)
      );
    },
    targetAgent: (agentId, context) => context?.previousAgent || DEFAULT_AGENT_ID,
    allowUserOverride: true,
    notifyUser: true
  },

  // 戦略4: 類似エージェントへのフォールバック
  {
    name: 'SimilarAgentFallback',
    priority: 4,
    condition: (agentId, context) => {
      const validation = validateAgentId(agentId);
      return Boolean(
        !validation.isValid && 
        validation.suggestions && 
        validation.suggestions.length > 0
      );
    },
    targetAgent: (agentId) => {
      const validation = validateAgentId(agentId);
      return validation.suggestions?.[0] || DEFAULT_AGENT_ID;
    },
    allowUserOverride: true,
    notifyUser: true
  },

  // 戦略5: デフォルトエージェントへの最終フォールバック（厳格な条件）
  {
    name: 'DefaultAgentFallback',
    priority: 5,
    condition: (agentId, context) => {
      return Boolean(
        !validateAgentId(agentId).isValid && 
        context?.userAction !== 'manual_switch' && // 手動切り替えではない
        (context?.retryCount === undefined || context.retryCount < 3) // 再試行回数制限
      );
    },
    targetAgent: DEFAULT_AGENT_ID,
    allowUserOverride: true,
    notifyUser: true
  },

  // 戦略6: フォールバック拒否（無限ループ防止）
  {
    name: 'NoFallback',
    priority: 6,
    condition: () => true, // 最後の戦略として全てにマッチ
    targetAgent: (agentId) => agentId, // 変更しない
    allowUserOverride: false,
    notifyUser: true
  }
];

// ==========================================
// フォールバック履歴管理
// ==========================================

class FallbackHistoryManager {
  private history: FallbackReason[] = [];
  private readonly maxHistorySize = 50;

  addFallback(reason: FallbackReason): void {
    this.history.push(reason);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  getHistory(): FallbackReason[] {
    return [...this.history];
  }

  getRecentFallbacks(count: number = 10): FallbackReason[] {
    return this.history.slice(-count);
  }

  getFallbacksByAgent(agentId: string): FallbackReason[] {
    return this.history.filter(f => f.originalAgentId === agentId || f.targetAgentId === agentId);
  }

  getFallbacksByTimeRange(startTime: Date, endTime: Date): FallbackReason[] {
    return this.history.filter(f => f.timestamp >= startTime && f.timestamp <= endTime);
  }

  getRetryCount(agentId: string, timeWindow: number = 5000): number {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.history.filter(f => 
      f.originalAgentId === agentId && 
      f.timestamp >= cutoff
    ).length;
  }

  clear(): void {
    this.history = [];
  }
}

// グローバルフォールバック履歴管理インスタンス
const fallbackHistory = new FallbackHistoryManager();

// ==========================================
// メインフォールバック決定関数
// ==========================================

/**
 * エージェント切り替え時のフォールバック戦略を決定
 * @param targetAgentId - 切り替え先のエージェントID
 * @param context - フォールバックコンテキスト
 * @returns フォールバック結果
 */
export function determineFallbackStrategy(
  targetAgentId: string,
  context: FallbackContext = {}
): FallbackResult {
  // 再試行回数を履歴から取得
  const retryCount = fallbackHistory.getRetryCount(targetAgentId);
  const contextWithRetry = { ...context, retryCount };

  // 戦略を優先順位でソートして評価
  const sortedStrategies = [...FALLBACK_STRATEGIES].sort((a, b) => a.priority - b.priority);
  
  for (const strategy of sortedStrategies) {
    if (strategy.condition(targetAgentId, contextWithRetry)) {
      const finalTargetAgentId = typeof strategy.targetAgent === 'function' 
        ? strategy.targetAgent(targetAgentId, contextWithRetry)
        : strategy.targetAgent;

      // フォールバックが必要かどうかの判定
      const shouldFallback = finalTargetAgentId !== targetAgentId;

      if (shouldFallback) {
        // フォールバック理由を生成
        const reason = createFallbackReason(
          targetAgentId,
          finalTargetAgentId,
          strategy,
          contextWithRetry
        );

        // 履歴に記録
        fallbackHistory.addFallback(reason);

        return {
          shouldFallback: true,
          targetAgentId: finalTargetAgentId,
          reason,
          strategy,
          userNotificationRequired: strategy.notifyUser,
          allowUserOverride: strategy.allowUserOverride
        };
      } else {
        // フォールバックの必要なし
        return {
          shouldFallback: false,
          targetAgentId: targetAgentId,
          strategy,
          userNotificationRequired: false,
          allowUserOverride: false
        };
      }
    }
  }

  // このケースは理論上発生しないはず（最後の戦略が全てにマッチするため）
  console.error('No fallback strategy matched - this should not happen');
  return {
    shouldFallback: false,
    userNotificationRequired: false,
    allowUserOverride: false
  };
}

// ==========================================
// フォールバック理由生成
// ==========================================

function createFallbackReason(
  originalAgentId: string,
  targetAgentId: string,
  strategy: FallbackStrategy,
  context: FallbackContext
): FallbackReason {
  const validation = validateAgentId(originalAgentId);
  
  let code: string;
  let message: string;
  let severity: FallbackReason['severity'];

  // エラーの種類に基づいてコードとメッセージを決定
  if (context.userAction === 'initialization') {
    code = FALLBACK_REASON_CODES.INITIALIZATION;
    message = `Initialized to default agent due to invalid saved agent: ${originalAgentId}`;
    severity = 'low';
  } else if (context.userAction === 'manual_switch') {
    code = FALLBACK_REASON_CODES.USER_MANUAL_SWITCH;
    message = `User manually switched to: ${targetAgentId}`;
    severity = 'low';
  } else if (validation.errorCode === VALIDATION_ERROR_CODES.AGENT_NOT_FOUND) {
    code = FALLBACK_REASON_CODES.AGENT_NOT_FOUND;
    message = `Agent '${originalAgentId}' not found, falling back to: ${targetAgentId}`;
    severity = 'medium';
  } else if (validation.errorCode === VALIDATION_ERROR_CODES.INVALID_FORMAT) {
    code = FALLBACK_REASON_CODES.INVALID_AGENT_FORMAT;
    message = `Invalid agent format '${originalAgentId}', falling back to: ${targetAgentId}`;
    severity = 'medium';
  } else if (validation.errorCode === VALIDATION_ERROR_CODES.MASTRA_NOT_COMPATIBLE) {
    code = FALLBACK_REASON_CODES.MASTRA_UNAVAILABLE;
    message = `Agent '${originalAgentId}' not compatible with Mastra, falling back to: ${targetAgentId}`;
    severity = 'high';
  } else if (context.retryCount && context.retryCount > 2) {
    code = FALLBACK_REASON_CODES.CRITICAL_FAILURE;
    message = `Multiple retry failures for '${originalAgentId}', emergency fallback to: ${targetAgentId}`;
    severity = 'critical';
  } else {
    code = FALLBACK_REASON_CODES.SYSTEM_ERROR;
    message = `System error with agent '${originalAgentId}', falling back to: ${targetAgentId}`;
    severity = 'high';
  }

  return {
    code,
    message,
    originalAgentId,
    targetAgentId,
    severity,
    timestamp: new Date(),
    context: {
      conversationId: context.conversationId,
      userAction: context.userAction,
      errorDetails: validation.error
    }
  };
}

// ==========================================
// 便利関数
// ==========================================

/**
 * フォールバック戦略のテスト実行
 * @param agentId - テスト対象のエージェントID
 * @param context - テストコンテキスト
 * @returns フォールバック結果
 */
export function testFallbackStrategy(
  agentId: string,
  context: FallbackContext = {}
): FallbackResult {
  return determineFallbackStrategy(agentId, context);
}

/**
 * フォールバック履歴の取得
 * @returns フォールバック履歴の配列
 */
export function getFallbackHistory(): FallbackReason[] {
  return fallbackHistory.getHistory();
}

/**
 * フォールバック履歴のクリア
 */
export function clearFallbackHistory(): void {
  fallbackHistory.clear();
}

/**
 * 特定のエージェントのフォールバック履歴を取得
 * @param agentId - エージェントID
 * @returns フォールバック履歴の配列
 */
export function getFallbackHistoryForAgent(agentId: string): FallbackReason[] {
  return fallbackHistory.getFallbacksByAgent(agentId);
}

/**
 * 最近のフォールバック履歴を取得
 * @param count - 取得する件数
 * @returns 最近のフォールバック履歴の配列
 */
export function getRecentFallbacks(count: number = 10): FallbackReason[] {
  return fallbackHistory.getRecentFallbacks(count);
}

/**
 * フォールバック統計の生成
 * @returns フォールバック統計
 */
export function getFallbackStatistics() {
  const history = fallbackHistory.getHistory();
  const totalFallbacks = history.length;
  
  if (totalFallbacks === 0) {
    return {
      totalFallbacks: 0,
      severityDistribution: {},
      commonCodes: {},
      affectedAgents: {},
      averageRetryCount: 0
    };
  }

  const severityDistribution = history.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commonCodes = history.reduce((acc, f) => {
    acc[f.code] = (acc[f.code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const affectedAgents = history.reduce((acc, f) => {
    acc[f.originalAgentId] = (acc[f.originalAgentId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalFallbacks,
    severityDistribution,
    commonCodes,
    affectedAgents,
    averageRetryCount: totalFallbacks > 0 ? 
      history.reduce((sum, f) => sum + (f.context?.errorDetails ? 1 : 0), 0) / totalFallbacks : 0
  };
}

/**
 * デバッグ用フォールバック情報の出力
 * @param agentId - デバッグ対象のエージェントID
 */
export function debugFallbackStrategy(agentId: string): void {
  console.group(`🔄 Fallback Strategy Debug: ${agentId}`);
  
  const contexts = [
    { userAction: 'manual_switch' as const },
    { userAction: 'initialization' as const },
    { userAction: 'api_call' as const },
    { userAction: 'error_recovery' as const, retryCount: 0 },
    { userAction: 'error_recovery' as const, retryCount: 3 }
  ];

  contexts.forEach(context => {
    const result = testFallbackStrategy(agentId, context);
    console.log(`Context: ${JSON.stringify(context)}`);
    console.log(`Result:`, result);
    console.log('---');
  });

  console.log('Fallback Statistics:', getFallbackStatistics());
  console.log('Recent Fallbacks:', getRecentFallbacks(5));
  console.groupEnd();
} 
"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, Search, Wifi, WifiOff, Clock, AlertCircle, X, RotateCcw } from 'lucide-react';

// ==========================================
// 型定義
// ==========================================

export type ResearchErrorType = 
  | 'WEB_SEARCH_FAILED'
  | 'SEARCH_API_LIMIT'
  | 'STREAMING_INTERRUPTED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'INVALID_SEARCH_QUERY'
  | 'NO_SEARCH_RESULTS'
  | 'RESEARCH_AGENT_UNAVAILABLE'
  | 'MASTRA_CONNECTION_ERROR'
  | 'UNKNOWN_ERROR';

export interface ResearchError {
  type: ResearchErrorType;
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
  context?: {
    searchQuery?: string;
    searchCount?: number;
    conversationId?: string;
    agentId?: string;
  };
}

interface ResearchErrorHandlerProps {
  error: ResearchError;
  onRetry?: () => void;
  onModifyQuery?: (newQuery: string) => void;
  onSwitchAgent?: () => void;
  onDismiss?: () => void;
  className?: string;
}

interface ErrorStyleConfig {
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: React.ReactNode;
  iconColor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ==========================================
// エラー設定マッピング
// ==========================================

const ERROR_CONFIGS: Record<ResearchErrorType, ErrorStyleConfig> = {
  WEB_SEARCH_FAILED: {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-700',
    textColor: 'text-orange-800 dark:text-orange-200',
    icon: <Search className="w-5 h-5" />,
    iconColor: 'text-orange-500',
    severity: 'medium'
  },
  SEARCH_API_LIMIT: {
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-700',
    textColor: 'text-red-800 dark:text-red-200',
    icon: <AlertTriangle className="w-5 h-5" />,
    iconColor: 'text-red-500',
    severity: 'high'
  },
  STREAMING_INTERRUPTED: {
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-700',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    icon: <WifiOff className="w-5 h-5" />,
    iconColor: 'text-yellow-500',
    severity: 'medium'
  },
  NETWORK_ERROR: {
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-700',
    textColor: 'text-red-800 dark:text-red-200',
    icon: <Wifi className="w-5 h-5" />,
    iconColor: 'text-red-500',
    severity: 'high'
  },
  TIMEOUT_ERROR: {
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-700',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    icon: <Clock className="w-5 h-5" />,
    iconColor: 'text-yellow-500',
    severity: 'medium'
  },
  INVALID_SEARCH_QUERY: {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
    textColor: 'text-blue-800 dark:text-blue-200',
    icon: <AlertCircle className="w-5 h-5" />,
    iconColor: 'text-blue-500',
    severity: 'low'
  },
  NO_SEARCH_RESULTS: {
    bgColor: 'bg-gray-50 dark:bg-gray-700',
    borderColor: 'border-gray-200 dark:border-gray-600',
    textColor: 'text-gray-800 dark:text-gray-200',
    icon: <Search className="w-5 h-5" />,
    iconColor: 'text-gray-500',
    severity: 'low'
  },
  RESEARCH_AGENT_UNAVAILABLE: {
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-700',
    textColor: 'text-red-800 dark:text-red-200',
    icon: <AlertTriangle className="w-5 h-5" />,
    iconColor: 'text-red-500',
    severity: 'critical'
  },
  MASTRA_CONNECTION_ERROR: {
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-700',
    textColor: 'text-red-800 dark:text-red-200',
    icon: <AlertTriangle className="w-5 h-5" />,
    iconColor: 'text-red-500',
    severity: 'critical'
  },
  UNKNOWN_ERROR: {
    bgColor: 'bg-gray-50 dark:bg-gray-700',
    borderColor: 'border-gray-200 dark:border-gray-600',
    textColor: 'text-gray-800 dark:text-gray-200',
    icon: <AlertCircle className="w-5 h-5" />,
    iconColor: 'text-gray-500',
    severity: 'medium'
  }
};

// ==========================================
// ユーザーフレンドリーメッセージ
// ==========================================

const FRIENDLY_MESSAGES: Record<ResearchErrorType, string> = {
  WEB_SEARCH_FAILED: 'Web検索中にエラーが発生しました。しばらく待ってから再試行してください。',
  SEARCH_API_LIMIT: '検索API制限に達しました。しばらく時間をおいてから再試行してください。',
  STREAMING_INTERRUPTED: '調査中に接続が中断されました。ネットワーク接続を確認してから再試行してください。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
  TIMEOUT_ERROR: '調査がタイムアウトしました。より具体的な検索条件で再試行してください。',
  INVALID_SEARCH_QUERY: '検索クエリが無効です。異なる検索キーワードで再試行してください。',
  NO_SEARCH_RESULTS: '検索結果が見つかりませんでした。異なるキーワードで検索してみてください。',
  RESEARCH_AGENT_UNAVAILABLE: '研究エージェントが利用できません。別のエージェントに切り替えてください。',
  MASTRA_CONNECTION_ERROR: 'システムとの接続に問題があります。しばらく待ってから再試行してください。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。再試行してください。'
};

// ==========================================
// 推奨アクション
// ==========================================

const RECOVERY_SUGGESTIONS: Record<ResearchErrorType, string[]> = {
  WEB_SEARCH_FAILED: ['再試行する', '検索クエリを修正する', '別のエージェントを使用する'],
  SEARCH_API_LIMIT: ['しばらく待つ', '別のエージェントを使用する'],
  STREAMING_INTERRUPTED: ['ネットワーク接続を確認する', '再試行する'],
  NETWORK_ERROR: ['インターネット接続を確認する', '再試行する'],
  TIMEOUT_ERROR: ['より具体的な検索条件を設定する', '検索対象を絞り込む'],
  INVALID_SEARCH_QUERY: ['検索キーワードを変更する', 'より具体的な質問をする'],
  NO_SEARCH_RESULTS: ['異なるキーワードで検索する', '関連用語を試す'],
  RESEARCH_AGENT_UNAVAILABLE: ['別のエージェントに切り替える', 'しばらく待つ'],
  MASTRA_CONNECTION_ERROR: ['ページを再読み込みする', 'しばらく待つ'],
  UNKNOWN_ERROR: ['再試行する', 'ページを再読み込みする']
};

// ==========================================
// メインコンポーネント
// ==========================================

export function ResearchErrorHandler({
  error,
  onRetry,
  onModifyQuery,
  onSwitchAgent,
  onDismiss,
  className = ""
}: ResearchErrorHandlerProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [newQuery, setNewQuery] = React.useState(error.context?.searchQuery || '');

  const config = ERROR_CONFIGS[error.type];
  const friendlyMessage = FRIENDLY_MESSAGES[error.type];
  const suggestions = RECOVERY_SUGGESTIONS[error.type];

  // 自動非表示（重要度が低い場合）
  React.useEffect(() => {
    if (config.severity === 'low') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [config.severity]);

  const handleDismiss = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 150);
  }, [onDismiss]);

  const handleRetry = React.useCallback(() => {
    console.log(`🔄 Retrying research operation for error: ${error.type}`);
    onRetry?.();
    handleDismiss();
  }, [error.type, onRetry, handleDismiss]);

  const handleModifyQuery = React.useCallback(() => {
    if (newQuery.trim() && newQuery !== error.context?.searchQuery) {
      console.log(`✏️ Modifying search query: "${error.context?.searchQuery}" → "${newQuery}"`);
      onModifyQuery?.(newQuery.trim());
      handleDismiss();
    }
  }, [newQuery, error.context?.searchQuery, onModifyQuery, handleDismiss]);

  const handleSwitchAgent = React.useCallback(() => {
    console.log(`🔄 Switching agent due to error: ${error.type}`);
    onSwitchAgent?.();
    handleDismiss();
  }, [error.type, onSwitchAgent, handleDismiss]);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-20 right-4 max-w-md w-full z-40
      transform transition-all duration-300 ease-in-out
      animate-in slide-in-from-right duration-300
      ${className}
    `}>
      <div className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg shadow-lg backdrop-blur-sm
      `}>
        {/* ヘッダー */}
        <div className="flex items-start gap-3 p-4">
          <div className={`${config.iconColor} mt-0.5 flex-shrink-0`}>
            {config.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm mb-1">
                  研究エラー
                  {config.severity === 'critical' && ' (緊急)'}
                </h4>
                <p className="text-sm leading-relaxed mb-2">
                  {friendlyMessage}
                </p>
                
                {/* 詳細エラーメッセージ */}
                {error.details && (
                  <details className="text-xs opacity-75">
                    <summary className="cursor-pointer hover:opacity-100">
                      技術的詳細
                    </summary>
                    <p className="mt-1 font-mono bg-black/5 dark:bg-white/5 p-2 rounded">
                      {error.details}
                    </p>
                  </details>
                )}
              </div>
              
              <button
                onClick={handleDismiss}
                className={`
                  ${config.iconColor} hover:opacity-70 
                  p-1 rounded-md transition-opacity
                  flex-shrink-0
                `}
                aria-label="エラーを閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* コンテキスト情報 */}
            {error.context && (
              <div className="text-xs opacity-75 mt-2 space-y-1">
                {error.context.searchQuery && (
                  <div>検索クエリ: &ldquo;{error.context.searchQuery}&rdquo;</div>
                )}
                {error.context.searchCount && (
                  <div>検索回数: {error.context.searchCount}</div>
                )}
                <div>{error.timestamp.toLocaleTimeString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* クエリ修正フィールド（該当する場合） */}
        {error.recoverable && (error.type === 'INVALID_SEARCH_QUERY' || error.type === 'NO_SEARCH_RESULTS') && (
          <div className="px-4 pb-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                placeholder="新しい検索キーワードを入力"
                className={`
                  flex-1 px-3 py-2 text-sm border rounded-md
                  ${config.textColor} bg-white/50 dark:bg-black/20
                  ${config.borderColor} focus:ring-2 focus:ring-offset-1
                  focus:ring-purple-500 focus:border-purple-500
                `}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleModifyQuery();
                  }
                }}
              />
              <button
                onClick={handleModifyQuery}
                disabled={!newQuery.trim() || newQuery === error.context?.searchQuery}
                className={`
                  px-3 py-2 text-sm rounded-md border transition-colors
                  ${config.textColor} ${config.borderColor}
                  hover:bg-black/5 dark:hover:bg-white/5
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:ring-2 focus:ring-purple-500
                `}
              >
                適用
              </button>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        {error.recoverable && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 text-sm flex-wrap">
              {onRetry && (
                <button
                  onClick={handleRetry}
                  className={`
                    inline-flex items-center gap-1 px-3 py-1.5 rounded-md
                    ${config.textColor} hover:bg-black/5 dark:hover:bg-white/5
                    border ${config.borderColor} transition-colors
                    focus:ring-2 focus:ring-purple-500
                  `}
                >
                  <RefreshCw className="w-3 h-3" />
                  再試行
                </button>
              )}
              
              {onSwitchAgent && config.severity !== 'low' && (
                <button
                  onClick={handleSwitchAgent}
                  className={`
                    inline-flex items-center gap-1 px-3 py-1.5 rounded-md
                    ${config.textColor} hover:bg-black/5 dark:hover:bg-white/5
                    border ${config.borderColor} transition-colors
                    focus:ring-2 focus:ring-purple-500
                  `}
                >
                  <RotateCcw className="w-3 h-3" />
                  別エージェント
                </button>
              )}
            </div>
          </div>
        )}

        {/* 提案セクション */}
        <div className="px-4 pb-4">
          <div className="text-xs">
            <div className="font-medium mb-1 opacity-75">推奨アクション:</div>
            <ul className="space-y-0.5 opacity-75">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-[10px] mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// エラー生成ヘルパー関数
// ==========================================

export function createResearchError(
  type: ResearchErrorType,
  details?: string,
  context?: ResearchError['context']
): ResearchError {
  return {
    type,
    message: FRIENDLY_MESSAGES[type],
    details,
    timestamp: new Date(),
    recoverable: !['RESEARCH_AGENT_UNAVAILABLE', 'MASTRA_CONNECTION_ERROR'].includes(type),
    context
  };
}

// ==========================================
// エラー分類ヘルパー
// ==========================================

export function classifyError(error: Error, context?: ResearchError['context']): ResearchError {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return createResearchError('NETWORK_ERROR', error.message, context);
  }
  
  if (message.includes('timeout')) {
    return createResearchError('TIMEOUT_ERROR', error.message, context);
  }
  
  if (message.includes('api') && message.includes('limit')) {
    return createResearchError('SEARCH_API_LIMIT', error.message, context);
  }
  
  if (message.includes('search') && message.includes('failed')) {
    return createResearchError('WEB_SEARCH_FAILED', error.message, context);
  }
  
  if (message.includes('streaming') || message.includes('interrupted')) {
    return createResearchError('STREAMING_INTERRUPTED', error.message, context);
  }
  
  if (message.includes('mastra') || message.includes('connection')) {
    return createResearchError('MASTRA_CONNECTION_ERROR', error.message, context);
  }
  
  return createResearchError('UNKNOWN_ERROR', error.message, context);
} 
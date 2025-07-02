"use client";

import React from 'react';
import { AlertTriangle, Info, AlertCircle, X, Undo2, Settings } from 'lucide-react';
import type { FallbackReason } from '@/lib/utils/agent-fallback';

// ==========================================
// 型定義
// ==========================================

interface FallbackNotificationProps {
  fallbackReason: FallbackReason;
  onDismiss?: () => void;
  onUndoFallback?: () => void;
  onViewDetails?: () => void;
  className?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
}

interface NotificationStyleConfig {
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: React.ReactNode;
  iconColor: string;
}

// ==========================================
// フォールバック通知コンポーネント
// ==========================================

export function FallbackNotification({
  fallbackReason,
  onDismiss,
  onUndoFallback,
  onViewDetails,
  className = "",
  autoHide = true,
  autoHideDelay = 5000
}: FallbackNotificationProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // 閉じる処理
  const handleDismiss = React.useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 150);
  }, [onDismiss]);

  // 自動非表示タイマー
  React.useEffect(() => {
    if (autoHide && fallbackReason.severity !== 'critical') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, fallbackReason.severity, handleDismiss]);

  // 重要度に応じたスタイル設定
  const getNotificationStyle = React.useCallback((): NotificationStyleConfig => {
    switch (fallbackReason.severity) {
      case 'low':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-700',
          textColor: 'text-blue-800 dark:text-blue-200',
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-blue-500'
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-700',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          icon: <AlertTriangle className="w-5 h-5" />,
          iconColor: 'text-yellow-500'
        };
      case 'high':
        return {
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-700',
          textColor: 'text-orange-800 dark:text-orange-200',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-orange-500'
        };
      case 'critical':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-700',
          textColor: 'text-red-800 dark:text-red-200',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-red-500'
        };
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-700',
          borderColor: 'border-gray-200 dark:border-gray-600',
          textColor: 'text-gray-800 dark:text-gray-200',
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-gray-500'
        };
    }
  }, [fallbackReason.severity]);

  // メッセージのユーザーフレンドリー化
  const getFriendlyMessage = React.useCallback((): string => {
    switch (fallbackReason.code) {
      case 'USER_MANUAL_SWITCH':
        return `エージェントを「${fallbackReason.targetAgentId}」に切り替えました`;
      case 'INITIALIZATION':
        return `保存されていたエージェント設定が無効だったため、デフォルトエージェントに切り替えました`;
      case 'AGENT_NOT_FOUND':
        return `「${fallbackReason.originalAgentId}」が見つからないため、「${fallbackReason.targetAgentId}」に切り替えました`;
      case 'INVALID_AGENT_FORMAT':
        return `エージェント形式が無効だったため、「${fallbackReason.targetAgentId}」に切り替えました`;
      case 'MASTRA_UNAVAILABLE':
        return `システムエラーが発生したため、「${fallbackReason.targetAgentId}」に切り替えました`;
      case 'CRITICAL_FAILURE':
        return `重大な問題が発生しました。安全のため「${fallbackReason.targetAgentId}」に切り替えました`;
      default:
        return fallbackReason.message;
    }
  }, [fallbackReason]);

  // 元に戻す処理
  const handleUndo = React.useCallback(() => {
    onUndoFallback?.();
    handleDismiss();
  }, [onUndoFallback, handleDismiss]);

  if (!isVisible) return null;

  const style = getNotificationStyle();
  const friendlyMessage = getFriendlyMessage();

  return (
    <div className={`
      fixed top-4 right-4 max-w-md w-full z-50
      transform transition-all duration-300 ease-in-out
      ${isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      ${className}
    `}>
      <div className={`
        ${style.bgColor} ${style.borderColor} ${style.textColor}
        border rounded-lg shadow-lg backdrop-blur-sm
        animate-in slide-in-from-right duration-300
      `}>
        {/* ヘッダー */}
        <div className="flex items-start gap-3 p-4">
          <div className={`${style.iconColor} mt-0.5 flex-shrink-0`}>
            {style.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm mb-1">
                  エージェント切り替え
                  {fallbackReason.severity === 'critical' && ' (緊急)'}
                </h4>
                <p className="text-sm leading-relaxed">
                  {friendlyMessage}
                </p>
              </div>
              
              <button
                onClick={handleDismiss}
                className={`
                  ${style.iconColor} hover:opacity-70 
                  p-1 rounded-md transition-opacity
                  flex-shrink-0
                `}
                aria-label="通知を閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* タイムスタンプ */}
            <div className="text-xs opacity-75 mt-2">
              {fallbackReason.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        {(onUndoFallback || onViewDetails) && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 text-sm">
              {onUndoFallback && fallbackReason.code !== 'USER_MANUAL_SWITCH' && (
                <button
                  onClick={handleUndo}
                  className={`
                    inline-flex items-center gap-1 px-3 py-1.5 rounded-md
                    ${style.textColor} hover:bg-black/5 dark:hover:bg-white/5
                    border ${style.borderColor} transition-colors
                  `}
                >
                  <Undo2 className="w-3 h-3" />
                  元に戻す
                </button>
              )}
              
              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className={`
                    inline-flex items-center gap-1 px-3 py-1.5 rounded-md
                    ${style.textColor} hover:bg-black/5 dark:hover:bg-white/5
                    border ${style.borderColor} transition-colors
                  `}
                >
                  <Settings className="w-3 h-3" />
                  詳細
                </button>
              )}
            </div>
          </div>
        )}

        {/* 進行状況バー（自動非表示の場合） */}
        {autoHide && fallbackReason.severity !== 'critical' && (
          <div className="px-4 pb-2">
            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1">
              <div 
                className="bg-current h-1 rounded-full transition-all ease-linear"
                style={{
                  animation: `shrink ${autoHideDelay}ms linear forwards`
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// フォールバック通知管理フック
// ==========================================

interface FallbackNotificationState {
  notifications: (FallbackReason & { id: string })[];
}

export function useFallbackNotifications() {
  const [state, setState] = React.useState<FallbackNotificationState>({
    notifications: []
  });

  // 通知を削除
  const dismissNotification = React.useCallback((id: string) => {
    setState(prev => ({
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  }, []);

  // 通知を追加
  const showNotification = React.useCallback((fallbackReason: FallbackReason) => {
    const id = Date.now().toString();
    setState(prev => ({
      notifications: [...prev.notifications, { ...fallbackReason, id }]
    }));

    // 重要でない通知は自動的に削除
    if (fallbackReason.severity === 'low') {
      setTimeout(() => {
        dismissNotification(id);
      }, 3000);
    }
  }, [dismissNotification]);

  // 全通知をクリア
  const clearAllNotifications = React.useCallback(() => {
    setState({ notifications: [] });
  }, []);

  return {
    notifications: state.notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications
  };
}

// ==========================================
// 複数通知表示コンポーネント
// ==========================================

interface FallbackNotificationContainerProps {
  notifications: (FallbackReason & { id: string })[];
  onDismiss: (id: string) => void;
  onUndoFallback?: (originalAgentId: string) => void;
  onViewDetails?: (fallbackReason: FallbackReason) => void;
}

export function FallbackNotificationContainer({
  notifications,
  onDismiss,
  onUndoFallback,
  onViewDetails
}: FallbackNotificationContainerProps) {
  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ marginTop: index * 8 }}
        >
          <FallbackNotification
            fallbackReason={notification}
            onDismiss={() => onDismiss(notification.id)}
            onUndoFallback={() => onUndoFallback?.(notification.originalAgentId)}
            onViewDetails={() => onViewDetails?.(notification)}
            autoHide={notification.severity !== 'critical'}
          />
        </div>
      ))}
    </div>
  );
} 
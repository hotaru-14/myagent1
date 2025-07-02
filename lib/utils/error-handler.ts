/**
 * エラーハンドリングとリトライ機能を提供するユーティリティ
 * 
 * 参考: Next.js 15のエラーハンドリングパターン
 * @see https://loadforge.com/guides/nextjs-performance-tuning-mastering-database-speed-and-caching-for-faster-web-applications
 */

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR', 
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ChatError {
  type: ErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  timestamp: string;
  context?: Record<string, any>;
  originalError?: Error;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorType.NETWORK_ERROR,
    ErrorType.DATABASE_ERROR,
    ErrorType.TIMEOUT_ERROR
  ]
};

/**
 * エラーを分類し、適切なChatErrorオブジェクトを作成
 */
export function classifyError(error: unknown, context?: Record<string, any>): ChatError {
  const timestamp = new Date().toISOString();
  
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // ネットワークエラーの検出
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      error.name === 'TypeError' && errorMessage.includes('failed to fetch')
    ) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'ネットワークエラーが発生しました。接続を確認してください。',
        retryable: true,
        timestamp,
        context,
        originalError: error
      };
    }
    
    // データベースエラーの検出
    if (
      errorMessage.includes('database') ||
      errorMessage.includes('sql') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('deadlock')
    ) {
      return {
        type: ErrorType.DATABASE_ERROR,
        message: 'データベースエラーが発生しました。しばらく待ってから再試行してください。',
        retryable: true,
        timestamp,
        context,
        originalError: error
      };
    }
    
    // 認証エラーの検出
    if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('login') ||
      error.message.includes('401')
    ) {
      return {
        type: ErrorType.AUTHENTICATION_ERROR,
        message: '認証が必要です。ログインしてください。',
        retryable: false,
        timestamp,
        context,
        originalError: error
      };
    }
    
    // バリデーションエラーの検出
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required') ||
      error.message.includes('400')
    ) {
      return {
        type: ErrorType.VALIDATION_ERROR,
        message: '入力データに問題があります。内容を確認してください。',
        retryable: false,
        timestamp,
        context,
        originalError: error
      };
    }
    
    // レート制限エラーの検出
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      error.message.includes('429')
    ) {
      return {
        type: ErrorType.RATE_LIMIT_ERROR,
        message: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
        retryable: true,
        timestamp,
        context,
        originalError: error
      };
    }
    
    // タイムアウトエラーの検出
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('aborted') ||
      error.name === 'AbortError'
    ) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        message: '処理がタイムアウトしました。再試行してください。',
        retryable: true,
        timestamp,
        context,
        originalError: error
      };
    }
  }
  
  // 未知のエラー
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: error instanceof Error ? error.message : '予期しないエラーが発生しました。',
    retryable: false,
    timestamp,
    context,
    originalError: error instanceof Error ? error : undefined
  };
}

/**
 * 指数バックオフでリトライを実行
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: ChatError) => void
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: ChatError;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = classifyError(error, { attempt, maxAttempts: finalConfig.maxAttempts });
      
      // リトライ可能かチェック
      if (!finalConfig.retryableErrors.includes(lastError.type)) {
        throw lastError;
      }
      
      // 最後の試行でもエラーの場合は投げる
      if (attempt === finalConfig.maxAttempts) {
        throw lastError;
      }
      
      // リトライコールバック
      if (onRetry) {
        onRetry(attempt, lastError);
      }
      
      // 指数バックオフで待機
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );
      
      console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt}/${finalConfig.maxAttempts}):`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * トランザクション的な操作の実行
 */
export async function executeTransaction<T>(
  operations: Array<() => Promise<any>>,
  onRollback?: (completedOperations: number) => Promise<void>
): Promise<T[]> {
  const results: T[] = [];
  let completedOperations = 0;
  
  try {
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
      completedOperations++;
    }
    
    return results;
  } catch (error) {
    // ロールバック処理
    if (onRollback && completedOperations > 0) {
      try {
        await onRollback(completedOperations);
        console.log(`🔄 Transaction rolled back: ${completedOperations} operations undone`);
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
        // ロールバック失敗も元のエラーと一緒に記録
        const originalError = classifyError(error);
        const rollbackErrorInfo = classifyError(rollbackError);
        
        throw {
          ...originalError,
          message: `${originalError.message} (ロールバックも失敗: ${rollbackErrorInfo.message})`,
          context: {
            ...originalError.context,
            rollbackError: rollbackErrorInfo
          }
        } as ChatError;
      }
    }
    
    throw classifyError(error, { completedOperations });
  }
}

/**
 * エラーメッセージの多言語対応
 */
export function getLocalizedErrorMessage(error: ChatError, locale: string = 'ja'): string {
  const messages: Record<string, Record<ErrorType, string>> = {
    ja: {
      [ErrorType.NETWORK_ERROR]: 'ネットワークエラーが発生しました。接続を確認してください。',
      [ErrorType.DATABASE_ERROR]: 'データベースエラーが発生しました。しばらく待ってから再試行してください。',
      [ErrorType.VALIDATION_ERROR]: '入力データに問題があります。内容を確認してください。',
      [ErrorType.AUTHENTICATION_ERROR]: '認証が必要です。ログインしてください。',
      [ErrorType.RATE_LIMIT_ERROR]: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
      [ErrorType.TIMEOUT_ERROR]: '処理がタイムアウトしました。再試行してください。',
      [ErrorType.UNKNOWN_ERROR]: '予期しないエラーが発生しました。'
    },
    en: {
      [ErrorType.NETWORK_ERROR]: 'Network error occurred. Please check your connection.',
      [ErrorType.DATABASE_ERROR]: 'Database error occurred. Please try again later.',
      [ErrorType.VALIDATION_ERROR]: 'Invalid input data. Please check your input.',
      [ErrorType.AUTHENTICATION_ERROR]: 'Authentication required. Please log in.',
      [ErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait and try again.',
      [ErrorType.TIMEOUT_ERROR]: 'Operation timed out. Please try again.',
      [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred.'
    }
  };
  
  return messages[locale]?.[error.type] || error.message;
}

/**
 * エラー統計の収集
 */
export class ErrorStats {
  private static instance: ErrorStats;
  private errors: Map<ErrorType, number> = new Map();
  private lastErrors: ChatError[] = [];
  private maxHistorySize = 100;
  
  static getInstance(): ErrorStats {
    if (!ErrorStats.instance) {
      ErrorStats.instance = new ErrorStats();
    }
    return ErrorStats.instance;
  }
  
  recordError(error: ChatError): void {
    // エラー種別のカウント
    const current = this.errors.get(error.type) || 0;
    this.errors.set(error.type, current + 1);
    
    // 履歴の記録
    this.lastErrors.unshift(error);
    if (this.lastErrors.length > this.maxHistorySize) {
      this.lastErrors.pop();
    }
    
    console.error('📊 Error recorded:', {
      type: error.type,
      count: current + 1,
      message: error.message
    });
  }
  
  getStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    recentErrors: ChatError[];
    mostCommonError: ErrorType | null;
  } {
    const totalErrors = Array.from(this.errors.values()).reduce((sum, count) => sum + count, 0);
    const errorsByType = Object.fromEntries(this.errors.entries()) as Record<ErrorType, number>;
    
    let mostCommonError: ErrorType | null = null;
    let maxCount = 0;
    
    for (const [type, count] of this.errors.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonError = type;
      }
    }
    
    return {
      totalErrors,
      errorsByType,
      recentErrors: this.lastErrors.slice(0, 10),
      mostCommonError
    };
  }
  
  clearStats(): void {
    this.errors.clear();
    this.lastErrors = [];
  }
}

/**
 * デバッグ用のエラー情報出力
 */
export function logErrorDetails(error: ChatError): void {
  console.group('🔍 Error Details');
  console.log('Type:', error.type);
  console.log('Message:', error.message);
  console.log('Retryable:', error.retryable);
  console.log('Timestamp:', error.timestamp);
  if (error.code) console.log('Code:', error.code);
  if (error.context) console.log('Context:', error.context);
  if (error.originalError) {
    console.log('Original Error:', error.originalError);
    console.log('Stack:', error.originalError.stack);
  }
  console.groupEnd();
} 
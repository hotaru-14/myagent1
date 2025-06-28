"use client";

import React from 'react';
import { Monitor, Activity, Network, Bug, Download, Trash2, Play, Pause, Search, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

// ==========================================
// 型定義
// ==========================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'agent' | 'network' | 'ui' | 'performance' | 'error';

export interface DebugLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
  source?: string;
  agentId?: string;
  conversationId?: string;
}

export interface PerformanceMetrics {
  agentSwitchTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  errorCount: number;
  lastUpdate: Date;
}

export interface NetworkMetrics {
  requestCount: number;
  failureCount: number;
  averageLatency: number;
  lastRequest: Date | null;
  activeConnections: number;
}

interface AdvancedDebugPanelProps {
  onClose?: () => void;
  initialTab?: 'logs' | 'performance' | 'network' | 'errors';
}

// ==========================================
// デバッグログ管理クラス
// ==========================================

class DebugLogger {
  private logs: DebugLog[] = [];
  private maxLogs = 1000;
  private listeners: ((logs: DebugLog[]) => void)[] = [];

  addLog(log: Omit<DebugLog, 'id' | 'timestamp'>) {
    const newLog: DebugLog = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    this.logs.push(newLog);
    
    // 最大ログ数を超えた場合、古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // リスナーに通知
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  subscribe(listener: (logs: DebugLog[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// グローバルデバッグロガーインスタンス
const globalDebugLogger = new DebugLogger();

// ==========================================
// パフォーマンス監視クラス
// ==========================================

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    agentSwitchTime: 0,
    apiResponseTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    errorCount: 0,
    lastUpdate: new Date()
  };
  
  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];

  updateMetrics(updates: Partial<PerformanceMetrics>) {
    this.metrics = {
      ...this.metrics,
      ...updates,
      lastUpdate: new Date()
    };
    
    this.listeners.forEach(listener => listener({ ...this.metrics }));
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  subscribe(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  measureAgentSwitch(startTime: number) {
    const switchTime = performance.now() - startTime;
    this.updateMetrics({ agentSwitchTime: switchTime });
    
    globalDebugLogger.addLog({
      level: 'info',
      category: 'performance',
      message: `Agent switch completed in ${switchTime.toFixed(2)}ms`,
      details: { switchTime }
    });
  }

  measureApiResponse(startTime: number, success: boolean = true) {
    const responseTime = performance.now() - startTime;
    this.updateMetrics({ apiResponseTime: responseTime });
    
    globalDebugLogger.addLog({
      level: success ? 'info' : 'error',
      category: 'network',
      message: `API response ${success ? 'completed' : 'failed'} in ${responseTime.toFixed(2)}ms`,
      details: { responseTime, success }
    });
  }
}

const globalPerformanceMonitor = new PerformanceMonitor();

// ==========================================
// ログレベル設定
// ==========================================

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'text-gray-500',
  info: 'text-blue-500',
  warn: 'text-yellow-500',
  error: 'text-red-500'
};

const LOG_LEVEL_ICONS: Record<LogLevel, React.ReactNode> = {
  debug: <Bug className="w-3 h-3" />,
  info: <Info className="w-3 h-3" />,
  warn: <AlertTriangle className="w-3 h-3" />,
  error: <XCircle className="w-3 h-3" />
};

// ==========================================
// メインコンポーネント
// ==========================================

export function AdvancedDebugPanel({ 
  onClose, 
  initialTab = 'logs' 
}: AdvancedDebugPanelProps) {
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [logs, setLogs] = React.useState<DebugLog[]>([]);
  const [isRecording, setIsRecording] = React.useState(true);
  const [filterLevel, setFilterLevel] = React.useState<LogLevel | 'all'>('all');
  const [filterCategory, setFilterCategory] = React.useState<LogCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [performance, setPerformance] = React.useState<PerformanceMetrics>(globalPerformanceMonitor.getMetrics());

  // ログとパフォーマンスデータの購読
  React.useEffect(() => {
    const unsubscribeLogs = globalDebugLogger.subscribe(setLogs);
    const unsubscribePerformance = globalPerformanceMonitor.subscribe(setPerformance);
    
    // 初期データを設定
    setLogs(globalDebugLogger.getLogs());
    
    return () => {
      unsubscribeLogs();
      unsubscribePerformance();
    };
  }, []);

  // ログフィルタリング
  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const levelMatch = filterLevel === 'all' || log.level === filterLevel;
      const categoryMatch = filterCategory === 'all' || log.category === filterCategory;
      const searchMatch = searchQuery === '' || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return levelMatch && categoryMatch && searchMatch;
    });
  }, [logs, filterLevel, filterCategory, searchQuery]);

  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case 'logs':
        return renderLogsTab();
      case 'performance':
        return renderPerformanceTab();
      case 'network':
        return renderNetworkTab();
      case 'errors':
        return renderErrorsTab();
      default:
        return renderLogsTab();
    }
  };

  // ログタブ
  const renderLogsTab = () => (
    <div className="flex flex-col h-full">
      {/* ログコントロール */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
            isRecording 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}
        >
          {isRecording ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isRecording ? 'Recording' : 'Paused'}
        </button>
        
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as LogLevel | 'all')}
          className="text-xs border rounded px-2 py-1 dark:bg-gray-600 dark:border-gray-500"
        >
          <option value="all">All Levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as LogCategory | 'all')}
          className="text-xs border rounded px-2 py-1 dark:bg-gray-600 dark:border-gray-500"
        >
          <option value="all">All Categories</option>
          <option value="agent">Agent</option>
          <option value="network">Network</option>
          <option value="ui">UI</option>
          <option value="performance">Performance</option>
          <option value="error">Error</option>
        </select>
        
        <div className="flex-1 relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-xs border rounded dark:bg-gray-600 dark:border-gray-500"
          />
        </div>
        
        <button
          onClick={() => globalDebugLogger.clearLogs()}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
        
        <button
          onClick={() => {
            const logs = globalDebugLogger.exportLogs();
            const blob = new Blob([logs], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `debug-logs-${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      {/* ログリスト */}
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1">
        {filteredLogs.map(log => (
          <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
            <div className={`${LOG_LEVEL_COLORS[log.level]} mt-0.5`}>
              {LOG_LEVEL_ICONS[log.level]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-gray-500 text-[10px]">
                <span>{log.timestamp.toLocaleTimeString()}</span>
                <span className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{log.category}</span>
                {log.agentId && (
                  <span className="bg-purple-200 dark:bg-purple-700 px-1 rounded">{log.agentId}</span>
                )}
              </div>
              <div className="text-gray-800 dark:text-gray-200 mt-1">{log.message}</div>
              {log.details && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Details</summary>
                  <pre className="mt-1 text-[10px] bg-gray-100 dark:bg-gray-600 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}
        
        {filteredLogs.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No logs match the current filters
          </div>
        )}
      </div>
    </div>
  );

  // パフォーマンスタブ
  const renderPerformanceTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
          <div className="text-xs font-medium text-blue-800 dark:text-blue-200">Agent Switch Time</div>
          <div className="text-lg font-bold text-blue-600">{performance.agentSwitchTime.toFixed(2)}ms</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
          <div className="text-xs font-medium text-green-800 dark:text-green-200">API Response Time</div>
          <div className="text-lg font-bold text-green-600">{performance.apiResponseTime.toFixed(2)}ms</div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
          <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Render Time</div>
          <div className="text-lg font-bold text-yellow-600">{performance.renderTime.toFixed(2)}ms</div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
          <div className="text-xs font-medium text-red-800 dark:text-red-200">Error Count</div>
          <div className="text-lg font-bold text-red-600">{performance.errorCount}</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        Last updated: {performance.lastUpdate.toLocaleString()}
      </div>
    </div>
  );

  // ネットワークタブ
  const renderNetworkTab = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Network monitoring features coming soon...
      </div>
    </div>
  );

  // エラータブ
  const renderErrorsTab = () => {
    const errorLogs = logs.filter(log => log.level === 'error');
    
    return (
      <div className="space-y-2">
        {errorLogs.map(log => (
          <div key={log.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-3">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200 text-sm font-medium">
              <XCircle className="w-4 h-4" />
              {log.timestamp.toLocaleTimeString()}
            </div>
            <div className="text-red-700 dark:text-red-300 mt-1">{log.message}</div>
            {log.details && (
              <pre className="mt-2 text-xs bg-red-100 dark:bg-red-800/20 p-2 rounded overflow-x-auto">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
        
        {errorLogs.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            No errors recorded
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed top-4 left-4 w-96 h-[calc(100vh-2rem)] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Advanced Debug Panel
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>

      {/* タブナビゲーション */}
      <div className="flex border-b border-gray-200 dark:border-gray-600">
        {[
          { id: 'logs', label: 'Logs', icon: <Bug className="w-4 h-4" /> },
          { id: 'performance', label: 'Performance', icon: <Activity className="w-4 h-4" /> },
          { id: 'network', label: 'Network', icon: <Network className="w-4 h-4" /> },
          { id: 'errors', label: 'Errors', icon: <AlertTriangle className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1 px-4 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-b-2 border-purple-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-hidden p-4">
        {renderTabContent()}
      </div>
    </div>
  );
}

// ==========================================
// デバッグロガーのエクスポート
// ==========================================

export { globalDebugLogger, globalPerformanceMonitor };

// ==========================================
// デバッグフック
// ==========================================

export function useAdvancedDebug() {
  const [showPanel, setShowPanel] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Alt+D で高度デバッグパネルを切り替え
      if (event.ctrlKey && event.altKey && event.key === 'D') {
        event.preventDefault();
        setShowPanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logDebug = React.useCallback((message: string, details?: any, source?: string) => {
    globalDebugLogger.addLog({
      level: 'debug',
      category: 'ui',
      message,
      details,
      source
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logError = React.useCallback((message: string, error?: Error, context?: any) => {
    globalPerformanceMonitor.updateMetrics({
      errorCount: globalPerformanceMonitor.getMetrics().errorCount + 1
    });
    
    globalDebugLogger.addLog({
      level: 'error',
      category: 'error',
      message,
      details: {
        error: error?.message,
        stack: error?.stack,
        context
      }
    });
  }, []);

  const measurePerformance = React.useCallback((label: string) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        globalDebugLogger.addLog({
          level: 'info',
          category: 'performance',
          message: `${label} completed in ${duration.toFixed(2)}ms`,
          details: { duration, label }
        });
        return duration;
      }
    };
  }, []);

  return {
    showPanel,
    setShowPanel,
    logDebug,
    logError,
    measurePerformance
  };
} 
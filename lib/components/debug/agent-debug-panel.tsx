// ==========================================
// エージェント状態デバッグパネル（Phase A.1テスト用）
// ==========================================

"use client";

import React from 'react';
import { useAgentContext, useGlobalAgentState } from '@/lib/contexts/agent-context';
import {
  validateAgentId, 
  validateAgentIdBatch, 
  isValidAgentId, 
  getValidatedAgent,
  debugAgentValidation
} from '@/lib/utils/agent-validation';
import {
  determineFallbackStrategy,
  getFallbackHistory,
  clearFallbackHistory,
  getFallbackStatistics,
  debugFallbackStrategy
} from '@/lib/utils/agent-fallback';

export function AgentDebugPanel() {
  // 直接Contextを使用
  const {
    state,
    changeAgent,
    resetAgent,
    clearError,
    getAgentChangeHistory,
    isValidAgent
  } = useAgentContext();

  // 下位互換性フックを使用
  const globalState = useGlobalAgentState();

  // バリデーションテスト用の状態
  const [testAgentId, setTestAgentId] = React.useState('');
  const [validationResult, setValidationResult] = React.useState<ReturnType<typeof validateAgentId> | null>(null);

  // フォールバックテスト用の状態
  const [fallbackTestAgent, setFallbackTestAgent] = React.useState('');
  const [fallbackResult, setFallbackResult] = React.useState<ReturnType<typeof determineFallbackStrategy> | null>(null);

  // バリデーションテストの実行
  const runValidationTest = React.useCallback(() => {
    if (!testAgentId.trim()) return;
    
    const result = validateAgentId(testAgentId, {
      includeSuggestions: true,
      includeMetadata: true,
      checkMastraCompatibility: true
    });
    
    setValidationResult(result);
    debugAgentValidation(testAgentId);
  }, [testAgentId]);

  // バッチテストの実行
  const runBatchValidationTest = React.useCallback(() => {
    const testAgents = ['weatherAgent', 'researchAgent', 'invalidAgent', '', 'w3@ther', 'test123'];
    const result = validateAgentIdBatch(testAgents);
    
    console.group('🔍 Batch Validation Test');
    console.log('Results:', result);
    console.table(result.results.map(r => ({
      agentId: r.agentId,
      isValid: r.isValid,
      error: r.error,
      errorCode: r.errorCode,
      suggestions: r.suggestions?.join(', ')
    })));
    console.groupEnd();
  }, []);

  // フォールバックテストの実行
  const runFallbackTest = React.useCallback(() => {
    if (!fallbackTestAgent.trim()) return;
    
    const contexts = [
      { userAction: 'manual_switch' as const },
      { userAction: 'initialization' as const },
      { userAction: 'api_call' as const },
      { userAction: 'error_recovery' as const, retryCount: 0 },
      { userAction: 'error_recovery' as const, retryCount: 3 }
    ];

    const results = contexts.map(context => ({
      context,
      result: determineFallbackStrategy(fallbackTestAgent, context)
    }));

    setFallbackResult(results[0].result); // 最初の結果を表示用に設定

    console.group(`🔄 Fallback Strategy Test: ${fallbackTestAgent}`);
    results.forEach(({ context, result }) => {
      console.log(`Context: ${JSON.stringify(context)}`);
      console.log('Result:', result);
      console.log('---');
    });
    console.groupEnd();

    debugFallbackStrategy(fallbackTestAgent);
  }, [fallbackTestAgent]);

  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-50">
      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
        🔧 Agent Debug Panel
      </h3>
      
      {/* 基本状態表示 */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Current State</h4>
        <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <div><strong>Current Agent:</strong> {state.currentAgentId}</div>
          <div><strong>Last Agent:</strong> {state.lastAgentId || 'None'}</div>
          <div><strong>Is Changing:</strong> {state.isChanging ? '✅' : '❌'}</div>
          <div><strong>Is Initialized:</strong> {state.isInitialized ? '✅' : '❌'}</div>
          <div><strong>Error:</strong> {state.error || 'None'}</div>
          <div><strong>Last Change:</strong> {
            state.lastChangeTimestamp 
              ? new Date(state.lastChangeTimestamp).toLocaleTimeString()
              : 'Never'
          }</div>
        </div>
      </div>

      {/* エラー表示 */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
          <div className="text-red-800 dark:text-red-200 text-sm">
            <strong>Error:</strong> {state.error}
          </div>
          <button
            onClick={clearError}
            className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Clear Error
          </button>
        </div>
      )}

      {/* エージェント切り替えテスト */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Test Agent Switch</h4>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => changeAgent('weatherAgent')}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={state.isChanging}
          >
            Weather
          </button>
          <button
            onClick={() => changeAgent('researchAgent')}
            className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50"
            disabled={state.isChanging}
          >
            Research
          </button>
          <button
            onClick={() => resetAgent()}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      </div>

      {/* バリデーションテスト (Phase A.2) */}
      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">🧪 Validation Test (A.2)</h4>
        
        {/* 基本バリデーション */}
        <div className="mb-3">
          <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <div>weatherAgent: {isValidAgentId('weatherAgent') ? '✅' : '❌'}</div>
            <div>researchAgent: {isValidAgentId('researchAgent') ? '✅' : '❌'}</div>
            <div>invalidAgent: {isValidAgentId('invalidAgent') ? '✅' : '❌'}</div>
            <div>empty string: {isValidAgentId('') ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* 詳細バリデーションテスト */}
        <div className="mb-3">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={testAgentId}
              onChange={(e) => setTestAgentId(e.target.value)}
              placeholder="Enter agent ID to test"
              className="flex-1 px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={runValidationTest}
              className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
            >
              Test
            </button>
          </div>
          
          {validationResult && (
            <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded p-2">
              <div><strong>Valid:</strong> {validationResult.isValid ? '✅' : '❌'}</div>
              {validationResult.error && (
                <div><strong>Error:</strong> {validationResult.error}</div>
              )}
              {validationResult.errorCode && (
                <div><strong>Code:</strong> {validationResult.errorCode}</div>
              )}
              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div><strong>Suggestions:</strong> {validationResult.suggestions.join(', ')}</div>
              )}
              {validationResult.metadata && (
                <div><strong>Time:</strong> {validationResult.metadata.validationTime.toFixed(2)}ms</div>
              )}
            </div>
          )}
        </div>

        {/* バッチテスト */}
        <button
          onClick={runBatchValidationTest}
          className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
        >
          Run Batch Test (Check Console)
        </button>
      </div>

      {/* フォールバックテスト (Phase A.3) */}
      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">🔄 Fallback Test (A.3)</h4>
        
        {/* フォールバックテスト */}
        <div className="mb-3">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={fallbackTestAgent}
              onChange={(e) => setFallbackTestAgent(e.target.value)}
              placeholder="Enter agent ID for fallback test"
              className="flex-1 px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={runFallbackTest}
              className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
            >
              Test
            </button>
          </div>
          
          {fallbackResult && (
            <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded p-2">
              <div><strong>Should Fallback:</strong> {fallbackResult.shouldFallback ? '✅' : '❌'}</div>
              <div><strong>Target:</strong> {fallbackResult.targetAgentId}</div>
              <div><strong>Strategy:</strong> {fallbackResult.strategy?.name}</div>
              <div><strong>Notify User:</strong> {fallbackResult.userNotificationRequired ? '✅' : '❌'}</div>
              <div><strong>Allow Override:</strong> {fallbackResult.allowUserOverride ? '✅' : '❌'}</div>
              {fallbackResult.reason && (
                <>
                  <div><strong>Reason:</strong> {fallbackResult.reason.code}</div>
                  <div><strong>Severity:</strong> {fallbackResult.reason.severity}</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* フォールバック統計 */}
        <div className="mb-3">
          <button
            onClick={() => {
              const stats = getFallbackStatistics();
              console.group('📊 Fallback Statistics');
              console.log('Statistics:', stats);
              console.log('History:', getFallbackHistory());
              console.groupEnd();
            }}
            className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 mr-2"
          >
            Show Stats (Console)
          </button>
          <button
            onClick={clearFallbackHistory}
            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* バリデーション機能テスト */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Context vs Validation</h4>
        <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <div>Context isValidAgent: {isValidAgent('weatherAgent') ? '✅' : '❌'}</div>
          <div>Validation isValidAgentId: {isValidAgentId('weatherAgent') ? '✅' : '❌'}</div>
          <div>getValidatedAgent: {getValidatedAgent('weatherAgent')?.name || 'null'}</div>
        </div>
      </div>

      {/* 履歴表示 */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Change History</h4>
        <div className="max-h-24 overflow-y-auto text-xs space-y-1 text-gray-600 dark:text-gray-400">
          {getAgentChangeHistory().slice(-3).map((event, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-600 pb-1">
              {event.fromAgentId} → {event.toAgentId}
              <br />
              <span className="text-gray-500">{event.timestamp.toLocaleTimeString()}</span>
            </div>
          ))}
          {getAgentChangeHistory().length === 0 && (
            <div className="text-gray-500">No changes yet</div>
          )}
        </div>
      </div>

      {/* 下位互換性テスト */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Legacy Hook Test</h4>
        <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <div><strong>Legacy Current:</strong> {globalState.currentAgentId}</div>
          <div><strong>Legacy Changing:</strong> {globalState.isChanging ? '✅' : '❌'}</div>
          <div><strong>Legacy Error:</strong> {globalState.error || 'None'}</div>
        </div>
      </div>

      {/* 即座同期テスト */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Sync Test</h4>
        <button
          onClick={async () => {
            console.time('Agent Switch Time');
            const success = await changeAgent(
              state.currentAgentId === 'weatherAgent' ? 'researchAgent' : 'weatherAgent'
            );
            console.timeEnd('Agent Switch Time');
            console.log('Switch success:', success);
          }}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
        >
          Measure Switch Time
        </button>
      </div>
    </div>
  );
}

// ==========================================
// デバッグパネル表示用のフック
// ==========================================

export function useDebugPanel() {
  const [showDebug, setShowDebug] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D でデバッグパネルを切り替え
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { showDebug, setShowDebug };
} 
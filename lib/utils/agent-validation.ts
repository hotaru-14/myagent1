// ==========================================
// エージェントバリデーション機能
// ==========================================

import { getAgentById, getAllAgents, AVAILABLE_AGENTS } from '@/lib/constants/agents';
import type { Agent } from '@/lib/types/agent';

// ==========================================
// バリデーション結果の型定義
// ==========================================

export interface AgentValidationResult {
  isValid: boolean;
  agentId: string;
  agent?: Agent;
  error?: string;
  errorCode?: string;
  suggestions?: string[];
  metadata?: {
    availableAgents: string[];
    similarAgents: string[];
    validationTime: number;
  };
}

export interface BatchValidationResult {
  results: AgentValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    successRate: number;
  };
  validationTime: number;
}

// ==========================================
// エラーコード定数
// ==========================================

export const VALIDATION_ERROR_CODES = {
  EMPTY_AGENT_ID: 'EMPTY_AGENT_ID',
  INVALID_FORMAT: 'INVALID_FORMAT',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_NOT_AVAILABLE: 'AGENT_NOT_AVAILABLE',
  MASTRA_NOT_COMPATIBLE: 'MASTRA_NOT_COMPATIBLE'
} as const;

// ==========================================
// メインバリデーション関数
// ==========================================

/**
 * エージェントIDの包括的バリデーション
 * @param agentId - 検証するエージェントID
 * @param options - バリデーションオプション
 * @returns 詳細なバリデーション結果
 */
export function validateAgentId(
  agentId: string,
  options: {
    includeSuggestions?: boolean;
    includeMetadata?: boolean;
    checkMastraCompatibility?: boolean;
  } = {}
): AgentValidationResult {
  const startTime = performance.now();
  
  const {
    includeSuggestions = true,
    includeMetadata = true,
    checkMastraCompatibility = false
  } = options;

  // 基本チェック: 空文字列
  if (!agentId || typeof agentId !== 'string' || agentId.trim() === '') {
    return {
      isValid: false,
      agentId: agentId || '',
      error: 'Agent ID cannot be empty',
      errorCode: VALIDATION_ERROR_CODES.EMPTY_AGENT_ID,
      suggestions: includeSuggestions ? generateSuggestions('') : undefined,
      metadata: includeMetadata ? generateMetadata(startTime) : undefined
    };
  }

  // フォーマットチェック
  const formatValidation = validateAgentIdFormat(agentId);
  if (!formatValidation.isValid) {
    return {
      isValid: false,
      agentId,
      error: formatValidation.error,
      errorCode: VALIDATION_ERROR_CODES.INVALID_FORMAT,
      suggestions: includeSuggestions ? generateSuggestions(agentId) : undefined,
      metadata: includeMetadata ? generateMetadata(startTime) : undefined
    };
  }

  // エージェント存在チェック
  const agent = getAgentById(agentId);
  if (!agent) {
    return {
      isValid: false,
      agentId,
      error: `Agent '${agentId}' not found in available agents`,
      errorCode: VALIDATION_ERROR_CODES.AGENT_NOT_FOUND,
      suggestions: includeSuggestions ? generateSuggestions(agentId) : undefined,
      metadata: includeMetadata ? generateMetadata(startTime) : undefined
    };
  }

  // Mastra互換性チェック（オプション）
  if (checkMastraCompatibility) {
    const mastraCompatibility = checkMastraCompatibilityForAgent(agentId);
    if (!mastraCompatibility.isCompatible) {
      return {
        isValid: false,
        agentId,
        agent,
        error: `Agent '${agentId}' is not compatible with Mastra: ${mastraCompatibility.reason}`,
        errorCode: VALIDATION_ERROR_CODES.MASTRA_NOT_COMPATIBLE,
        suggestions: includeSuggestions ? generateSuggestions(agentId) : undefined,
        metadata: includeMetadata ? generateMetadata(startTime) : undefined
      };
    }
  }

  // 全チェック成功
  return {
    isValid: true,
    agentId,
    agent,
    metadata: includeMetadata ? generateMetadata(startTime) : undefined
  };
}

// ==========================================
// フォーマットバリデーション
// ==========================================

interface FormatValidationResult {
  isValid: boolean;
  error?: string;
}

function validateAgentIdFormat(agentId: string): FormatValidationResult {
  // 基本的なフォーマットチェック
  if (agentId.length < 3) {
    return {
      isValid: false,
      error: 'Agent ID must be at least 3 characters long'
    };
  }

  if (agentId.length > 50) {
    return {
      isValid: false,
      error: 'Agent ID must be 50 characters or less'
    };
  }

  // 許可される文字: 英数字、ハイフン、アンダースコア
  const validFormat = /^[a-zA-Z0-9_-]+$/;
  if (!validFormat.test(agentId)) {
    return {
      isValid: false,
      error: 'Agent ID can only contain letters, numbers, hyphens, and underscores'
    };
  }

  // 先頭は文字である必要がある
  if (!/^[a-zA-Z]/.test(agentId)) {
    return {
      isValid: false,
      error: 'Agent ID must start with a letter'
    };
  }

  return { isValid: true };
}

// ==========================================
// Mastra互換性チェック
// ==========================================

interface MastraCompatibilityResult {
  isCompatible: boolean;
  reason?: string;
}

function checkMastraCompatibilityForAgent(agentId: string): MastraCompatibilityResult {
  // 実際のMastraインスタンスが利用可能かチェック
  // この部分は実行時にMastraの状態を確認する
  
  try {
    // ここで実際のMastra.getAgent()呼び出しをシミュレート
    // 本来はMastraインスタンスにアクセスする必要がある
    
    // 現時点では、エージェント定数に存在するかどうかで判定
    const agent = getAgentById(agentId);
    if (!agent) {
      return {
        isCompatible: false,
        reason: 'Agent not found in agent constants'
      };
    }

    // 将来的には以下のようなチェックを追加可能
    // - Mastraインスタンスの初期化状態
    // - エージェントの設定完了状態
    // - 必要なツールの利用可能性

    return { isCompatible: true };
    
  } catch (error) {
    return {
      isCompatible: false,
      reason: `Mastra compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// ==========================================
// 提案生成
// ==========================================

function generateSuggestions(invalidAgentId: string): string[] {
  const availableAgents = getAllAgents();
  const suggestions: string[] = [];

  if (invalidAgentId.trim() === '') {
    // 空の場合は利用可能なエージェントを提案
    suggestions.push(...availableAgents.slice(0, 3).map(agent => agent.id));
  } else {
    // 類似エージェントを検索
    const similarAgents = findSimilarAgents(invalidAgentId, availableAgents);
    suggestions.push(...similarAgents.slice(0, 3));
  }

  return suggestions;
}

function findSimilarAgents(input: string, agents: Agent[]): string[] {
  const inputLower = input.toLowerCase();
  
  // 完全一致、部分一致、類似性によってスコアリング
  const scored = agents.map(agent => {
    const agentIdLower = agent.id.toLowerCase();
    const agentNameLower = agent.name.toLowerCase();
    
    let score = 0;
    
    // 部分一致スコア
    if (agentIdLower.includes(inputLower)) score += 10;
    if (agentNameLower.includes(inputLower)) score += 8;
    
    // 開始一致スコア
    if (agentIdLower.startsWith(inputLower)) score += 15;
    if (agentNameLower.startsWith(inputLower)) score += 12;
    
    // レーベンシュタイン距離による類似性スコア
    const distance = levenshteinDistance(inputLower, agentIdLower);
    score += Math.max(0, 10 - distance);
    
    return { agent, score };
  });
  
  return scored
    .filter(item => item.score > 5)
    .sort((a, b) => b.score - a.score)
    .map(item => item.agent.id);
}

// シンプルなレーベンシュタイン距離計算
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// ==========================================
// メタデータ生成
// ==========================================

function generateMetadata(startTime: number) {
  const availableAgents = getAllAgents().map(agent => agent.id);
  
  return {
    availableAgents,
    similarAgents: availableAgents.slice(0, 5), // 簡易版
    validationTime: performance.now() - startTime
  };
}

// ==========================================
// バッチバリデーション
// ==========================================

/**
 * 複数のエージェントIDを一括でバリデーション
 * @param agentIds - 検証するエージェントIDの配列
 * @param options - バリデーションオプション
 * @returns バッチバリデーション結果
 */
export function validateAgentIdBatch(
  agentIds: string[],
  options: Parameters<typeof validateAgentId>[1] = {}
): BatchValidationResult {
  const startTime = performance.now();
  
  const results = agentIds.map(agentId => validateAgentId(agentId, options));
  
  const validCount = results.filter(result => result.isValid).length;
  const invalidCount = results.length - validCount;
  
  return {
    results,
    summary: {
      total: results.length,
      valid: validCount,
      invalid: invalidCount,
      successRate: results.length > 0 ? validCount / results.length : 0
    },
    validationTime: performance.now() - startTime
  };
}

// ==========================================
// 便利関数
// ==========================================

/**
 * 簡易バリデーション（boolean戻り値）
 * @param agentId - 検証するエージェントID
 * @returns バリデーション結果（true/false）
 */
export function isValidAgentId(agentId: string): boolean {
  return validateAgentId(agentId, { 
    includeSuggestions: false, 
    includeMetadata: false 
  }).isValid;
}

/**
 * エージェント存在チェック（null安全）
 * @param agentId - 検証するエージェントID
 * @returns エージェントオブジェクトまたはnull
 */
export function getValidatedAgent(agentId: string): Agent | null {
  const result = validateAgentId(agentId, { 
    includeSuggestions: false, 
    includeMetadata: false 
  });
  return result.isValid ? result.agent || null : null;
}

/**
 * デバッグ用詳細ログ
 * @param agentId - 検証するエージェントID
 */
export function debugAgentValidation(agentId: string): void {
  const result = validateAgentId(agentId, {
    includeSuggestions: true,
    includeMetadata: true,
    checkMastraCompatibility: true
  });
  
  console.group(`🔍 Agent Validation Debug: ${agentId}`);
  console.log('Result:', result);
  console.log('Available Agents:', Object.keys(AVAILABLE_AGENTS));
  if (!result.isValid) {
    console.error('Validation Error:', result.error);
    console.log('Error Code:', result.errorCode);
    console.log('Suggestions:', result.suggestions);
  }
  console.groupEnd();
} 
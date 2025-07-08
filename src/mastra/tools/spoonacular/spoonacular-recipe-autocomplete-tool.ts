// ================================================================
// Spoonacular レシピオートコンプリートツール
// ----------------------------------------------------------------
// 検索候補の自動提案機能を提供するツール。
// UI補助機能として検索入力をサポート。
// ================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { 
  autocompleteRecipeSearch, 
  validateParams, 
  addAttribution 
} from './common/api-client';

import {

  LOG_PREFIXES
} from './common/constants';

  import {
    AutocompleteParams,
    AutocompleteSuggestion,
    ApiError
  } from './common/types';

// ===========================================
// スキーマ定義
// ===========================================

/**
 * 入力スキーマ定義
 */
const inputSchema = z.object({
  query: z.string()
    .min(1, "検索クエリは必須です")
    .max(100, "検索クエリは100文字以内で入力してください")
    .describe("検索候補を取得するクエリ（部分文字列可。例: 'chick', 'past', 'choco'）"),
  
  number: z.number()
    .int()
    .min(1)
    .max(25)
    .default(10)
    .describe("取得する候補数（1-25、デフォルト: 10）")
});

/**
 * 出力スキーマ定義
 */
const outputSchema = z.object({
  action: z.literal('autocomplete').describe("実行されたアクション"),
  query: z.string().describe("使用された検索クエリ"),
  results: z.any().nullable().describe("オートコンプリート結果（成功時は候補リスト、失敗時はnull）"),
  totalResults: z.number().optional().describe("取得した候補数"),
  success: z.boolean().describe("実行成功フラグ"),
  error: z.string().optional().describe("エラーメッセージ"),
  attribution: z.string().describe("データ出典"),
  rateLimit: z.object({
    quotaUsed: z.string().optional().describe("使用済みクォータ"),
    quotaLeft: z.string().optional().describe("残りクォータ"),
    quotaRequest: z.string().optional().describe("このリクエストで使用したクォータ")
  }).optional().describe("API制限情報")
});

// ===========================================
// バリデーション・ユーティリティ関数
// ===========================================

/**
 * クエリの妥当性チェックと正規化
 * @param query - 検索クエリ
 */
function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * クエリの特徴分析
 * @param query - 正規化された検索クエリ
 */
function analyzeQuery(query: string): {
  length: number;
  isPartial: boolean;
  language: 'en' | 'ja' | 'mixed';
  suggestions: string[];
} {
  const length = query.length;
  const isPartial = length < 4; // 4文字未満は部分入力と判断
  
  // 言語判定（簡易版）
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(query);
  const hasEnglish = /[a-zA-Z]/.test(query);
  
  let language: 'en' | 'ja' | 'mixed' = 'en';
  if (hasJapanese && hasEnglish) {
    language = 'mixed';
  } else if (hasJapanese) {
    language = 'ja';
  }
  
  // 一般的な検索提案
  const commonSuggestions = length < 3 ? [
    'chicken curry', 'chocolate cake', 'pasta salad', 'vegetarian pizza',
    'beef stew', 'salmon teriyaki', 'fruit smoothie', 'garlic bread'
  ] : [];
  
  return {
    length,
    isPartial,
    language,
    suggestions: commonSuggestions
  };
}

/**
 * パラメータの組み合わせチェック
 */
function validateParameterCombination(params: any): void {
  const analysis = analyzeQuery(params.query);
  
  // 短いクエリの警告
  if (analysis.isPartial) {
    console.info(`${LOG_PREFIXES.AUTOCOMPLETE} 短いクエリ（${analysis.length}文字）: より具体的な結果を得るにはもう少し入力してください`);
  }
  
  // 言語に応じたアドバイス
  if (analysis.language === 'ja') {
    console.info(`${LOG_PREFIXES.AUTOCOMPLETE} 日本語クエリを検出: 英語での検索もお試しください`);
  } else if (analysis.language === 'mixed') {
    console.warn(`${LOG_PREFIXES.AUTOCOMPLETE} 混合言語クエリ: 一つの言語での検索を推奨します`);
  }
  
  // 候補数の最適化提案
  if (params.number > 15) {
    console.info(`${LOG_PREFIXES.AUTOCOMPLETE} 多くの候補を要求しています: UI表示では10個程度が適切です`);
  }
}

// ===========================================
// ツール実装
// ===========================================

export const spoonacularRecipeAutocompleteTool = createTool({
  id: 'spoonacular-recipe-autocomplete',
  description: `
Spoonacular APIを使用したレシピオートコンプリートツール。
検索入力のUI補助機能として、リアルタイムの候補提案を提供します。

【主要機能】
- 部分入力からの検索候補提案
- レシピ名の自動補完
- リアルタイム検索サポート
- 多言語対応（英語・日本語）

【使用場面】
- 検索フォームの入力補助
- ユーザー体験の向上
- タイピング軽減
- 発見的検索のサポート

【入力例】
- 部分入力: "chick" → "chicken curry", "chicken parmesan"等
- 食材: "pasta" → "pasta salad", "pasta carbonara"等  
- デザート: "choco" → "chocolate cake", "chocolate mousse"等
- 日本語: "カレー" → カレー系レシピの候補

【出力情報】
- レシピID: 詳細検索で使用可能
- レシピ名: 表示用のタイトル
- 画像タイプ: 画像URL生成用

【パフォーマンス特性】
- 高速レスポンス（~200ms）
- 軽量なデータ転送
- 低クォータ消費
- リアルタイム使用に適している

【無料版制限】
- 1日150リクエスト、1分60リクエスト  
- 候補数は最大25個
- データ出典表示必須
  `,
  
  inputSchema,
  outputSchema,
  
  execute: async ({ context }) => {
    const startTime = Date.now();
    console.log(`${LOG_PREFIXES.AUTOCOMPLETE} オートコンプリート開始:`, context);
    
    try {
      // パラメータ検証
      validateParams(context, ['query']);
      
      // クエリの正規化と分析
      const normalizedQuery = normalizeQuery(context.query);
      const analysis = analyzeQuery(normalizedQuery);
      
      validateParameterCombination({ ...context, query: normalizedQuery });
      
      // APIリクエストパラメータ構築
      const autocompleteParams: AutocompleteParams = {
        query: normalizedQuery,
        number: context.number
      };
      
      console.log(`${LOG_PREFIXES.AUTOCOMPLETE} API呼び出し実行:`, {
        query: normalizedQuery,
        queryLength: analysis.length,
        language: analysis.language,
        isPartial: analysis.isPartial,
        requestedCount: context.number
      });
      
      // API呼び出し
      const response = await autocompleteRecipeSearch(autocompleteParams);
      const responseData = addAttribution(response.data);
      
      const executionTime = Date.now() - startTime;
      
      // 結果の統計情報
      const suggestions = (responseData.suggestions as AutocompleteSuggestion[]) || [];
      const uniqueTitles = new Set(suggestions.map((s) => s.title));
      
      console.log(`${LOG_PREFIXES.AUTOCOMPLETE} 補完完了 (${executionTime}ms):`, {
        suggestionsCount: suggestions.length,
        uniqueTitles: uniqueTitles.size,
        hasImages: suggestions.filter((s) => s.imageType).length,
        averageLength: suggestions.length > 0 
          ? Math.round(suggestions.reduce((sum: number, s) => sum + s.title.length, 0) / suggestions.length)
          : 0
      });
      
      // レスポンス構築
      return {
        action: 'autocomplete' as const,
        query: normalizedQuery,
        results: responseData,
        totalResults: suggestions.length,
        success: true,
        attribution: responseData.attribution,
        rateLimit: {
          quotaUsed: response.headers.get('X-API-Quota-Used') || undefined,
          quotaLeft: response.headers.get('X-API-Quota-Left') || undefined,
          quotaRequest: response.headers.get('X-API-Quota-Request') || undefined
        }
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`${LOG_PREFIXES.AUTOCOMPLETE} 補完エラー (${executionTime}ms):`, error);
      
      const apiError = error as ApiError;
      const errorMessage = apiError.message || '予期しないエラーが発生しました';
      
      return {
        action: 'autocomplete' as const,
        query: context.query,
        results: null,
        success: false,
        error: errorMessage,
        attribution: "Recipe data powered by Spoonacular API"
      };
    }
  }
}); 
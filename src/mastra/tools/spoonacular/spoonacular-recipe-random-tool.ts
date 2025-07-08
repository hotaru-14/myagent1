// ================================================================
// Spoonacular ランダムレシピツール
// ----------------------------------------------------------------
// ランダムレシピの取得機能を提供するツール。
// タグフィルタリング、栄養情報取得オプションをサポート。
// ================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { 
  getRandomRecipes, 
 
  addAttribution 
} from './common/api-client';

import {
  SPOONACULAR_LIMITS,
  SUPPORTED_TAGS,
  LOG_PREFIXES
} from './common/constants';

  import {
    RandomRecipeParams,
    RandomRecipe,
    ApiError
  } from './common/types';

// ===========================================
// スキーマ定義
// ===========================================

/**
 * 入力スキーマ定義
 */
const inputSchema = z.object({
  number: z.number()
    .int()
    .min(SPOONACULAR_LIMITS.REQUEST_PARAMS.MIN_RESULTS)
    .max(SPOONACULAR_LIMITS.REQUEST_PARAMS.MAX_RESULTS)
    .default(3)
    .describe("取得するレシピ数（1-100、デフォルト: 3）"),
  
  includeNutrition: z.boolean()
    .default(false)
    .describe("栄養情報を含めるか（無料版では追加クォータ消費）"),
  
  includeTags: z.string()
    .optional()
    .describe("含めるタグ（複数指定時はカンマ区切り。例: 'vegetarian,healthy' または 'dessert,quick'）"),
  
  excludeTags: z.string()
    .optional()
    .describe("除外するタグ（複数指定時はカンマ区切り。例: 'dairy,gluten' または 'expensive,long'）")
});

/**
 * 出力スキーマ定義
 */
const outputSchema = z.object({
  action: z.literal('random').describe("実行されたアクション"),
  results: z.any().nullable().describe("ランダムレシピデータ（成功時はレシピリスト、失敗時はnull）"),
  totalResults: z.number().optional().describe("取得したレシピ数"),
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
// バリデーション関数
// ===========================================

/**
 * タグの妥当性チェック
 * @param tags - チェックするタグ（カンマ区切り文字列）
 * @param tagType - タグの種類（include/exclude）
 */
function validateTags(tags?: string, tagType: 'include' | 'exclude' = 'include'): void {
  if (!tags) return;
  
  const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
  const supportedSet = new Set(SUPPORTED_TAGS.map(tag => tag.toLowerCase()));
  
  for (const tag of tagList) {
    if (!supportedSet.has(tag)) {
      console.warn(`${LOG_PREFIXES.RANDOM} 未対応のタグ (${tagType}): '${tag}'. 利用可能: ${SUPPORTED_TAGS.join(', ')}`);
    }
  }
}

/**
 * パラメータの組み合わせチェック
 */
function validateParameterCombination(params: any): void {
  // 栄養情報付きでの大量取得の警告
  if (params.includeNutrition && params.number > 5) {
    console.warn(`${LOG_PREFIXES.RANDOM} 栄養情報付きでの大量取得は無料版では制限される可能性があります`);
  }
  
  // 相反するタグの警告
  if (params.includeTags && params.excludeTags) {
    const includeSet = new Set(params.includeTags.split(',').map((t: string) => t.trim().toLowerCase()));
    const excludeSet = new Set(params.excludeTags.split(',').map((t: string) => t.trim().toLowerCase()));
    
    for (const tag of includeSet) {
      if (excludeSet.has(tag)) {
        console.warn(`${LOG_PREFIXES.RANDOM} タグ '${tag}' が含める・除外両方で指定されています`);
      }
    }
  }
}

// ===========================================
// ツール実装
// ===========================================

export const spoonacularRecipeRandomTool = createTool({
  id: 'spoonacular-recipe-random',
  description: `
Spoonacular APIを使用したランダムレシピ取得ツール。
レシピ発見やインスピレーションに最適です。

【主要機能】
- ランダムレシピの取得
- タグによるフィルタリング（含める・除外）
- 栄養情報の取得オプション
- 詳細なレシピ情報（食材、調理手順、価格等）

【タグ例】
- 食事制限: vegetarian, vegan, gluten free, dairy free
- 特徴: very healthy, cheap, very popular, sustainable  
- ダイエット: ketogenic, paleo, whole30, low fodmap
- 調理特性: quick, easy, comfort food

【使用例】
- ヘルシーなベジタリアンレシピ: includeTags: "vegetarian,very healthy"
- 安くて早いレシピ: includeTags: "cheap,quick"
- 乳製品不使用デザート: includeTags: "dessert", excludeTags: "dairy"

【無料版制限】
- 1日150リクエスト、1分60リクエスト
- 栄養情報取得は追加クォータ消費
- データ出典表示必須
  `,
  
  inputSchema,
  outputSchema,
  
  execute: async ({ context }) => {
    const startTime = Date.now();
    console.log(`${LOG_PREFIXES.RANDOM} ランダムレシピ取得開始:`, context);
    
    try {
      // パラメータ検証
      validateTags(context.includeTags, 'include');
      validateTags(context.excludeTags, 'exclude');
      validateParameterCombination(context);
      
      // APIリクエストパラメータ構築
      const randomParams: RandomRecipeParams = {
        number: context.number,
        includeNutrition: context.includeNutrition
      };
      
      // オプションパラメータの追加
      if (context.includeTags) {
        randomParams.includeTags = context.includeTags;
      }
      if (context.excludeTags) {
        randomParams.excludeTags = context.excludeTags;
      }
      
      console.log(`${LOG_PREFIXES.RANDOM} API呼び出し実行:`, {
        number: randomParams.number,
        includeNutrition: randomParams.includeNutrition,
        includeTags: randomParams.includeTags || 'なし',
        excludeTags: randomParams.excludeTags || 'なし'
      });
      
      // API呼び出し
      const response = await getRandomRecipes(randomParams);
      const responseData = addAttribution(response.data) as unknown as { recipes: RandomRecipe[]; attribution: string };
      
      const executionTime = Date.now() - startTime;
      console.log(`${LOG_PREFIXES.RANDOM} 取得完了 (${executionTime}ms):`, {
        recipesCount: responseData.recipes?.length || 0,
        hasNutrition: responseData.recipes?.[0]?.nutrition ? 'あり' : 'なし'
      });
      
      // レスポンス構築
      return {
        action: 'random' as const,
        results: responseData,
        totalResults: responseData.recipes?.length || 0,
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
      console.error(`${LOG_PREFIXES.RANDOM} 取得エラー (${executionTime}ms):`, error);
      
      const apiError = error as ApiError;
      const errorMessage = apiError.message || '予期しないエラーが発生しました';
      
      return {
        action: 'random' as const,
        results: null,
        success: false,
        error: errorMessage,
        attribution: "Recipe data powered by Spoonacular API"
      };
    }
  }
}); 
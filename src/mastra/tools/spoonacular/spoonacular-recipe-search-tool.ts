// ================================================================
// Spoonacular レシピ検索ツール
// ----------------------------------------------------------------
// テキストベースのレシピ検索機能を提供するツール。
// 料理ジャンル、食事制限、アレルギー対応などの詳細検索をサポート。
// ================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { 
  searchRecipes, 
  validateParams, 
  addAttribution 
} from './common/api-client';

import {
  SPOONACULAR_LIMITS,
  SUPPORTED_CUISINES,
  SUPPORTED_DIETS,
  SUPPORTED_INTOLERANCES,
  SUPPORTED_DISH_TYPES,
  LOG_PREFIXES
} from './common/constants';

import {
  RecipeSearchParams,
  RecipeSearchResponse,
  SpoonacularToolResponse,
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
    .max(200, "検索クエリは200文字以内で入力してください")
    .describe("検索クエリ（例: 'chicken curry', 'chocolate cake', 'healthy pasta'）"),
  
  number: z.number()
    .int()
    .min(SPOONACULAR_LIMITS.REQUEST_PARAMS.MIN_RESULTS)
    .max(SPOONACULAR_LIMITS.REQUEST_PARAMS.MAX_RESULTS)
    .default(SPOONACULAR_LIMITS.REQUEST_PARAMS.DEFAULT_RESULTS)
    .describe(`取得するレシピ数（${SPOONACULAR_LIMITS.REQUEST_PARAMS.MIN_RESULTS}-${SPOONACULAR_LIMITS.REQUEST_PARAMS.MAX_RESULTS}、デフォルト: ${SPOONACULAR_LIMITS.REQUEST_PARAMS.DEFAULT_RESULTS}）`),
  
  cuisine: z.enum(SUPPORTED_CUISINES as readonly [string, ...string[]])
    .optional()
    .describe("料理ジャンル（例: italian, japanese, indian, thai, chinese, french）"),
  
  diet: z.enum(SUPPORTED_DIETS as readonly [string, ...string[]])
    .optional()
    .describe("食事制限（例: vegetarian, vegan, gluten free, ketogenic, paleo）"),
  
  intolerances: z.string()
    .optional()
    .describe("アレルギー・不耐性（複数指定時はカンマ区切り。例: 'dairy,gluten' または 'peanut,shellfish'）"),
  
  type: z.enum(SUPPORTED_DISH_TYPES as readonly [string, ...string[]])
    .optional()
    .describe("料理タイプ（例: main course, dessert, appetizer, side dish, soup）"),
  
  maxReadyTime: z.number()
    .int()
    .min(1)
    .max(SPOONACULAR_LIMITS.REQUEST_PARAMS.MAX_READY_TIME)
    .optional()
    .describe("最大調理時間（分）"),
  
  minCalories: z.number()
    .int()
    .min(SPOONACULAR_LIMITS.REQUEST_PARAMS.MIN_CALORIES)
    .max(SPOONACULAR_LIMITS.REQUEST_PARAMS.MAX_CALORIES)
    .optional()
    .describe("最小カロリー"),
  
  maxCalories: z.number()
    .int()
    .min(SPOONACULAR_LIMITS.REQUEST_PARAMS.MIN_CALORIES)
    .max(SPOONACULAR_LIMITS.REQUEST_PARAMS.MAX_CALORIES)
    .optional()
    .describe("最大カロリー"),
  
  addRecipeInformation: z.boolean()
    .default(true)
    .describe("基本レシピ情報（調理時間、人数分など）を含めるか"),
  
  fillIngredients: z.boolean()
    .default(false)
    .describe("食材リストを詳細に取得するか"),
  
  addRecipeNutrition: z.boolean()
    .default(false)
    .describe("栄養情報を含めるか（無料版では制限あり）"),
  
  instructionsRequired: z.boolean()
    .default(false)
    .describe("調理手順があるレシピのみを取得するか"),
  
  sort: z.enum(['popularity', 'healthiness', 'price', 'time', 'random', 'meta-score'])
    .default('popularity')
    .describe("並び順（popularity: 人気順, healthiness: 健康度, price: 価格, time: 調理時間）"),
  
  sortDirection: z.enum(['asc', 'desc'])
    .default('desc')
    .describe("並び順の方向（asc: 昇順, desc: 降順）"),
  
  offset: z.number()
    .int()
    .min(0)
    .default(0)
    .describe("検索結果のオフセット（ページング用）")
});

/**
 * 出力スキーマ定義
 */
const outputSchema = z.object({
  action: z.literal('search').describe("実行されたアクション"),
  query: z.string().optional().describe("使用された検索クエリ"),
  results: z.any().nullable().describe("検索結果データ（成功時はレシピリスト、失敗時はnull）"),
  totalResults: z.number().optional().describe("総検索結果数"),
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
 * カロリー範囲の妥当性チェック
 */
function validateCalorieRange(minCalories?: number, maxCalories?: number): void {
  if (minCalories && maxCalories && minCalories >= maxCalories) {
    throw new Error("最小カロリーは最大カロリーより小さい値を指定してください");
  }
}

/**
 * 不耐性パラメータの妥当性チェック
 */
function validateIntolerances(intolerances?: string): void {
  if (!intolerances) return;
  
  const intoleranceList = intolerances.split(',').map(i => i.trim());
  const supportedSet = new Set(SUPPORTED_INTOLERANCES);
  
  for (const intolerance of intoleranceList) {
    if (!supportedSet.has(intolerance as any)) {
      throw new Error(`未対応の不耐性: '${intolerance}'. サポート対象: ${SUPPORTED_INTOLERANCES.join(', ')}`);
    }
  }
}

/**
 * パラメータの組み合わせチェック
 */
function validateParameterCombination(params: any): void {
  // 無料版での栄養情報取得制限の警告
  if (params.addRecipeNutrition && params.number > 10) {
    console.warn(`${LOG_PREFIXES.SEARCH} 栄養情報付きでの大量取得は無料版では制限される可能性があります`);
  }
  
  // 詳細情報取得時の警告
  if (params.fillIngredients && params.addRecipeNutrition && params.number > 5) {
    console.warn(`${LOG_PREFIXES.SEARCH} 詳細情報の大量取得はAPIクォータを多く消費します`);
  }
}

// ===========================================
// ツール実装
// ===========================================

export const spoonacularRecipeSearchTool = createTool({
  id: 'spoonacular-recipe-search',
  description: `
Spoonacular APIを使用したテキストベースレシピ検索ツール。
高度な検索オプションで詳細なレシピ検索が可能です。

【主要機能】
- テキストクエリによるレシピ検索
- 料理ジャンル・食事制限・アレルギー対応での絞り込み
- 調理時間・カロリー範囲での条件指定
- 栄養情報・食材詳細の取得オプション

【検索例】
- "チキンカレー" + cuisine: "indian" + maxReadyTime: 45
- "グルテンフリー パン" + diet: "gluten free" + type: "bread"
- "低カロリー デザート" + maxCalories: 300 + type: "dessert"

【無料版制限】
- 1日150リクエスト、1分60リクエスト
- 栄養情報取得は追加クォータ消費
- データ出典表示必須
  `,
  
  inputSchema,
  outputSchema,
  
  execute: async ({ context }) => {
    const startTime = Date.now();
    console.log(`${LOG_PREFIXES.SEARCH} レシピ検索開始:`, context);
    
    try {
      // パラメータ検証
      validateParams(context, ['query']);
      validateCalorieRange(context.minCalories, context.maxCalories);
      validateIntolerances(context.intolerances);
      validateParameterCombination(context);
      
      // APIリクエストパラメータ構築
      const searchParams: RecipeSearchParams = {
        query: context.query,
        number: context.number,
        addRecipeInformation: context.addRecipeInformation,
        fillIngredients: context.fillIngredients,
        addRecipeNutrition: context.addRecipeNutrition,
        instructionsRequired: context.instructionsRequired,
        sort: context.sort,
        sortDirection: context.sortDirection,
        offset: context.offset
      };
      
      // オプションパラメータの追加
      if (context.cuisine) searchParams.cuisine = context.cuisine;
      if (context.diet) searchParams.diet = context.diet;
      if (context.intolerances) searchParams.intolerances = context.intolerances;
      if (context.type) searchParams.type = context.type;
      if (context.maxReadyTime) searchParams.maxReadyTime = context.maxReadyTime;
      if (context.minCalories) searchParams.minCalories = context.minCalories;
      if (context.maxCalories) searchParams.maxCalories = context.maxCalories;
      
      console.log(`${LOG_PREFIXES.SEARCH} API呼び出し実行:`, { 
        query: searchParams.query, 
        filters: Object.keys(searchParams).filter(k => k !== 'query' && searchParams[k as keyof RecipeSearchParams] !== undefined)
      });
      
      // API呼び出し
      const response = await searchRecipes(searchParams);
      const responseData = addAttribution(response.data);
      
      const executionTime = Date.now() - startTime;
      console.log(`${LOG_PREFIXES.SEARCH} 検索完了 (${executionTime}ms):`, {
        totalResults: responseData.totalResults,
        returnedResults: responseData.results?.length || 0
      });
      
      // レスポンス構築
      return {
        action: 'search' as const,
        query: context.query,
        results: responseData,
        totalResults: responseData.totalResults,
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
      console.error(`${LOG_PREFIXES.SEARCH} 検索エラー (${executionTime}ms):`, error);
      
      const apiError = error as ApiError;
      const errorMessage = apiError.message || '予期しないエラーが発生しました';
      
      return {
        action: 'search' as const,
        query: context.query,
        results: null,
        success: false,
        error: errorMessage,
        attribution: "Recipe data powered by Spoonacular API"
      };
    }
  }
}); 
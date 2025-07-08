// ================================================================
// Spoonacular 食材ベース検索ツール
// ----------------------------------------------------------------
// 手持ち食材からレシピを提案するツール。
// 不足食材の表示、ランキングアルゴリズムをサポート。
// ================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { 
  searchRecipesByIngredients, 
  validateParams, 
  addAttribution 
} from './common/api-client';

import {
  SPOONACULAR_LIMITS,
  LOG_PREFIXES
} from './common/constants';

import {
  IngredientSearchParams,
  IngredientSearchResponse,
  ApiError
} from './common/types';

// ===========================================
// スキーマ定義
// ===========================================

/**
 * 入力スキーマ定義
 */
const inputSchema = z.object({
  ingredients: z.string()
    .min(1, "食材リストは必須です")
    .max(500, "食材リストは500文字以内で入力してください")
    .describe("手持ち食材（カンマ区切り。例: 'chicken,rice,onion' または 'tomato,pasta,cheese'）"),
  
  number: z.number()
    .int()
    .min(SPOONACULAR_LIMITS.REQUEST_PARAMS.MIN_RESULTS)
    .max(SPOONACULAR_LIMITS.REQUEST_PARAMS.MAX_RESULTS)
    .default(SPOONACULAR_LIMITS.REQUEST_PARAMS.DEFAULT_RESULTS)
    .describe(`取得するレシピ数（${SPOONACULAR_LIMITS.REQUEST_PARAMS.MIN_RESULTS}-${SPOONACULAR_LIMITS.REQUEST_PARAMS.MAX_RESULTS}、デフォルト: ${SPOONACULAR_LIMITS.REQUEST_PARAMS.DEFAULT_RESULTS}）`),
  
  ranking: z.number()
    .int()
    .min(1)
    .max(2)
    .default(1)
    .describe("ランキングアルゴリズム（1: 使用食材数を最大化, 2: 不足食材数を最小化）"),
  
  ignorePantry: z.boolean()
    .default(false)
    .describe("一般的な調味料（塩、こしょう、油等）を無視するか")
});

/**
 * 出力スキーマ定義
 */
const outputSchema = z.object({
  action: z.literal('byIngredients').describe("実行されたアクション"),
  ingredients: z.string().describe("使用された食材リスト"),
  results: z.any().nullable().describe("食材ベース検索結果（成功時はレシピリスト、失敗時はnull）"),
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
// バリデーション・ユーティリティ関数
// ===========================================

/**
 * 食材リストの正規化と検証
 * @param ingredients - 食材リスト（カンマ区切り文字列）
 */
function normalizeIngredients(ingredients: string): string {
  return ingredients
    .split(',')
    .map(ingredient => ingredient.trim().toLowerCase())
    .filter(ingredient => ingredient.length > 0)
    .join(',');
}

/**
 * 食材リストの統計情報を生成
 * @param ingredients - 食材リスト（カンマ区切り文字列）
 */
function analyzeIngredients(ingredients: string): {
  count: number;
  list: string[];
  commonPantryItems: string[];
} {
  const ingredientList = ingredients.split(',').map(i => i.trim().toLowerCase());
  
  // 一般的な調味料・パントリーアイテム
  const commonPantryItems = [
    'salt', 'pepper', 'oil', 'butter', 'sugar', 'flour', 'garlic', 'onion',
    '塩', 'こしょう', '油', 'バター', '砂糖', '小麦粉', 'にんにく', '玉ねぎ'
  ];
  
  const pantryMatches = ingredientList.filter(ingredient => 
    commonPantryItems.some(pantry => 
      ingredient.includes(pantry) || pantry.includes(ingredient)
    )
  );
  
  return {
    count: ingredientList.length,
    list: ingredientList,
    commonPantryItems: pantryMatches
  };
}

/**
 * パラメータの組み合わせチェック
 */
function validateParameterCombination(params: any): void {
  const analysis = analyzeIngredients(params.ingredients);
  
  // 食材数の警告
  if (analysis.count < 2) {
    console.warn(`${LOG_PREFIXES.INGREDIENTS} 食材が少ないため、検索結果が限定される可能性があります（${analysis.count}個）`);
  } else if (analysis.count > 10) {
    console.warn(`${LOG_PREFIXES.INGREDIENTS} 食材が多すぎると、完全一致するレシピが見つからない可能性があります（${analysis.count}個）`);
  }
  
  // パントリーアイテムの警告
  if (analysis.commonPantryItems.length > 0 && !params.ignorePantry) {
    console.info(`${LOG_PREFIXES.INGREDIENTS} 一般的な調味料が含まれています: ${analysis.commonPantryItems.join(', ')}. ignorePantryをtrueにすることを検討してください`);
  }
  
  // ランキングアルゴリズムの説明
  if (params.ranking === 1) {
    console.info(`${LOG_PREFIXES.INGREDIENTS} ランキング1: 手持ち食材を多く使うレシピを優先します`);
  } else {
    console.info(`${LOG_PREFIXES.INGREDIENTS} ランキング2: 買い足し食材が少ないレシピを優先します`);
  }
}

// ===========================================
// ツール実装
// ===========================================

export const spoonacularRecipeIngredientsTool = createTool({
  id: 'spoonacular-recipe-ingredients',
  description: `
Spoonacular APIを使用した食材ベース検索ツール。
手持ちの食材からレシピを提案し、不足食材も表示します。

【主要機能】
- 手持ち食材からのレシピ検索
- 使用食材・不足食材・未使用食材の詳細表示  
- 2つのランキングアルゴリズム選択
- 一般的な調味料の無視オプション

【ランキングアルゴリズム】
1. 使用食材数最大化: 手持ち食材をより多く使うレシピを優先
2. 不足食材数最小化: 買い足しが少ないレシピを優先

【食材指定例】
- 基本: "chicken,rice,onion,garlic"
- 日本語: "鶏肉,米,玉ねぎ,にんにく"  
- 野菜中心: "tomato,bell pepper,zucchini,basil"
- デザート: "flour,sugar,eggs,butter,vanilla"

【出力情報】
- 使用食材: 実際にレシピで使われる手持ち食材
- 不足食材: レシピに必要だが手持ちにない食材
- 未使用食材: 手持ちだがレシピで使わない食材
- いいね数: 人気度の指標

【無料版制限】  
- 1日150リクエスト、1分60リクエスト
- データ出典表示必須
  `,
  
  inputSchema,
  outputSchema,
  
  execute: async ({ context }) => {
    const startTime = Date.now();
    console.log(`${LOG_PREFIXES.INGREDIENTS} 食材ベース検索開始:`, context);
    
    try {
      // パラメータ検証
      validateParams(context, ['ingredients']);
      
      // 食材リストの正規化
      const normalizedIngredients = normalizeIngredients(context.ingredients);
      const analysis = analyzeIngredients(normalizedIngredients);
      
      validateParameterCombination({ ...context, ingredients: normalizedIngredients });
      
      // APIリクエストパラメータ構築
      const searchParams: IngredientSearchParams = {
        ingredients: normalizedIngredients,
        number: context.number,
        ranking: context.ranking,
        ignorePantry: context.ignorePantry
      };
      
      console.log(`${LOG_PREFIXES.INGREDIENTS} API呼び出し実行:`, {
        ingredientCount: analysis.count,
        ingredients: analysis.list.join(', '),
        ranking: context.ranking === 1 ? '使用食材数最大化' : '不足食材数最小化',
        ignorePantry: context.ignorePantry
      });
      
      // API呼び出し
      const response = await searchRecipesByIngredients(searchParams);
      const responseData = addAttribution(response.data);
      
      const executionTime = Date.now() - startTime;
      
             // 結果の統計情報を計算
       const recipeStats = responseData.recipes?.map((recipe: any) => ({
         id: recipe.id,
         title: recipe.title,
         usedCount: recipe.usedIngredientCount,
         missedCount: recipe.missedIngredientCount,
         likes: recipe.likes
       })) || [];
       
       console.log(`${LOG_PREFIXES.INGREDIENTS} 検索完了 (${executionTime}ms):`, {
         recipesFound: recipeStats.length,
         avgUsedIngredients: recipeStats.length > 0 
           ? Math.round(recipeStats.reduce((sum: number, r: any) => sum + r.usedCount, 0) / recipeStats.length * 10) / 10
           : 0,
         avgMissedIngredients: recipeStats.length > 0
           ? Math.round(recipeStats.reduce((sum: number, r: any) => sum + r.missedCount, 0) / recipeStats.length * 10) / 10  
           : 0
       });
      
      // レスポンス構築
      return {
        action: 'byIngredients' as const,
        ingredients: normalizedIngredients,
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
      console.error(`${LOG_PREFIXES.INGREDIENTS} 検索エラー (${executionTime}ms):`, error);
      
      const apiError = error as ApiError;
      const errorMessage = apiError.message || '予期しないエラーが発生しました';
      
      return {
        action: 'byIngredients' as const,
        ingredients: context.ingredients,
        results: null,
        success: false,
        error: errorMessage,
        attribution: "Recipe data powered by Spoonacular API"
      };
    }
  }
}); 
// ================================================================
// Spoonacular レシピ詳細取得ツール
// ----------------------------------------------------------------
// 特定レシピIDから最も詳細な情報を取得するツール。
// 栄養情報、調理手順、材料、価格などの包括的情報を提供。
// ================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { 
  getRecipeInformation, 
  validateParams, 
  addAttribution 
} from './common/api-client';

import {
  LOG_PREFIXES
} from './common/constants';

import {
  RecipeDetailParams,
  RecipeDetailResponse,
  ApiError
} from './common/types';

// ===========================================
// スキーマ定義
// ===========================================

/**
 * 入力スキーマ定義
 */
const inputSchema = z.object({
  recipeId: z.number()
    .int()
    .positive("レシピIDは正の整数である必要があります")
    .describe("取得するレシピのID（他のSpoonacularツールから取得可能）"),
  
  includeNutrition: z.boolean()
    .default(false)
    .describe("詳細な栄養情報を含めるか（無料版では追加クォータ消費）"),
  
  includeTaste: z.boolean()
    .default(false)
    .describe("味覚プロファイル情報を含めるか（甘さ、塩気、酸味等）")
});

/**
 * 出力スキーマ定義
 */
const outputSchema = z.object({
  action: z.literal('getRecipe').describe("実行されたアクション"),
  recipeId: z.number().describe("取得したレシピのID"),
  results: z.any().nullable().describe("レシピ詳細データ（成功時は詳細情報、失敗時はnull）"),
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
 * レシピIDの妥当性チェック
 * @param recipeId - チェックするレシピID
 */
function validateRecipeId(recipeId: number): void {
  // SpoonacularのレシピIDは通常6-7桁の数値
  if (recipeId < 1000 || recipeId > 10000000) {
    console.warn(`${LOG_PREFIXES.DETAIL} 珍しいレシピID: ${recipeId}. 通常は1000-10000000の範囲です`);
  }
}

/**
 * パラメータの組み合わせチェック
 */
function validateParameterCombination(params: any): void {
  // 栄養情報取得の警告
  if (params.includeNutrition) {
    console.info(`${LOG_PREFIXES.DETAIL} 栄養情報を取得します（追加クォータ消費）`);
  }
  
  // 味覚情報取得の警告
  if (params.includeTaste) {
    console.info(`${LOG_PREFIXES.DETAIL} 味覚プロファイルを取得します`);
  }
  
  // 両方取得時の警告
  if (params.includeNutrition && params.includeTaste) {
    console.warn(`${LOG_PREFIXES.DETAIL} 詳細情報フル取得はクォータを多く消費します`);
  }
}

/**
 * レシピ情報の分析と統計
 * @param recipe - レシピ詳細情報
 */
function analyzeRecipeData(recipe: any): {
  complexity: 'simple' | 'medium' | 'complex';
  healthScore: number;
  dietaryInfo: string[];
  nutritionSummary?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
} {
  // 複雑度の判定
  const ingredientCount = recipe.extendedIngredients?.length || 0;
  const instructionSteps = recipe.analyzedInstructions?.[0]?.steps?.length || 0;
  const readyTime = recipe.readyInMinutes || 0;
  
  let complexity: 'simple' | 'medium' | 'complex' = 'medium';
  if (ingredientCount <= 5 && instructionSteps <= 5 && readyTime <= 30) {
    complexity = 'simple';
  } else if (ingredientCount >= 15 || instructionSteps >= 15 || readyTime >= 120) {
    complexity = 'complex';
  }
  
  // 食事制限・特徴の収集
  const dietaryInfo: string[] = [];
  if (recipe.vegetarian) dietaryInfo.push('ベジタリアン');
  if (recipe.vegan) dietaryInfo.push('ビーガン');
  if (recipe.glutenFree) dietaryInfo.push('グルテンフリー');
  if (recipe.dairyFree) dietaryInfo.push('乳製品不使用');
  if (recipe.veryHealthy) dietaryInfo.push('とてもヘルシー');
  if (recipe.cheap) dietaryInfo.push('経済的');
  if (recipe.veryPopular) dietaryInfo.push('とても人気');
  if (recipe.sustainable) dietaryInfo.push('持続可能');
  
  // 栄養サマリー（栄養情報がある場合）
  let nutritionSummary;
  if (recipe.nutrition?.nutrients) {
    const nutrients = recipe.nutrition.nutrients;
    const findNutrient = (name: string) => nutrients.find((n: any) => n.name.toLowerCase().includes(name.toLowerCase()))?.amount || 0;
    
    nutritionSummary = {
      calories: findNutrient('calories'),
      protein: findNutrient('protein'),
      carbs: findNutrient('carbohydrates'),
      fat: findNutrient('fat')
    };
  }
  
  return {
    complexity,
    healthScore: recipe.healthScore || 0,
    dietaryInfo,
    nutritionSummary
  };
}

// ===========================================
// ツール実装
// ===========================================

export const spoonacularRecipeDetailTool = createTool({
  id: 'spoonacular-recipe-detail',
  description: `
Spoonacular APIを使用したレシピ詳細情報取得ツール。
特定のレシピIDから最も包括的な情報を取得します。

【主要機能】
- 完全なレシピ詳細情報の取得
- 詳細な栄養情報（オプション）
- 味覚プロファイル（甘さ、塩気等）
- 段階的調理手順と必要器具
- 食材の詳細情報（量、代替案等）
- 価格情報とコスト分析
- ワインペアリング提案

【取得情報例】
- 基本情報: タイトル、画像、調理時間、人数分
- 食材リスト: 分量、単位、通路分類、代替案
- 調理手順: ステップ別説明、必要器具、所要時間
- 栄養情報: カロリー、三大栄養素、ビタミン、ミネラル
- 特徴: ベジタリアン、グルテンフリー、健康度スコア
- 価格: 1人当たりコスト、食材別価格

【レシピID取得方法】
- spoonacular-recipe-search: 検索結果から取得
- spoonacular-recipe-random: ランダム結果から取得  
- spoonacular-recipe-ingredients: 食材検索結果から取得
- spoonacular-recipe-autocomplete: 候補結果から取得

【使用例】
- レシピ表示ページでの詳細情報表示
- 調理アプリでのステップ表示
- 栄養管理アプリでの栄養情報分析
- 料理プランニングでの材料・価格確認

【無料版制限】
- 1日150リクエスト、1分60リクエスト
- 栄養情報取得は追加クォータ消費
- データ出典表示必須
  `,
  
  inputSchema,
  outputSchema,
  
  execute: async ({ context }) => {
    const startTime = Date.now();
    console.log(`${LOG_PREFIXES.DETAIL} レシピ詳細取得開始:`, context);
    
    try {
      // パラメータ検証
      validateParams(context, ['recipeId']);
      validateRecipeId(context.recipeId);
      validateParameterCombination(context);
      
      // APIリクエストパラメータ構築
      const detailParams: RecipeDetailParams = {
        id: context.recipeId,
        includeNutrition: context.includeNutrition,
        includeTaste: context.includeTaste
      };
      
      console.log(`${LOG_PREFIXES.DETAIL} API呼び出し実行:`, {
        recipeId: context.recipeId,
        includeNutrition: context.includeNutrition,
        includeTaste: context.includeTaste
      });
      
      // API呼び出し
      const response = await getRecipeInformation(context.recipeId, detailParams);
      const responseData = addAttribution(response.data);
      
      const executionTime = Date.now() - startTime;
      
      // レシピデータの分析
      const analysis = analyzeRecipeData(responseData);
      
      console.log(`${LOG_PREFIXES.DETAIL} 取得完了 (${executionTime}ms):`, {
        recipeTitle: responseData.title,
        complexity: analysis.complexity,
        healthScore: analysis.healthScore,
        ingredientCount: responseData.extendedIngredients?.length || 0,
        instructionSteps: responseData.analyzedInstructions?.[0]?.steps?.length || 0,
        readyInMinutes: responseData.readyInMinutes,
        dietaryFeatures: analysis.dietaryInfo.length,
        hasNutrition: !!responseData.nutrition,
        hasTaste: !!responseData.taste,
        nutritionSummary: analysis.nutritionSummary
      });
      
      // レスポンス構築
      return {
        action: 'getRecipe' as const,
        recipeId: context.recipeId,
        results: responseData,
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
      console.error(`${LOG_PREFIXES.DETAIL} 取得エラー (${executionTime}ms):`, error);
      
      const apiError = error as ApiError;
      const errorMessage = apiError.message || '予期しないエラーが発生しました';
      
      // レシピが見つからない場合の特別処理
      if (apiError.status === 404) {
        console.warn(`${LOG_PREFIXES.DETAIL} レシピID ${context.recipeId} は存在しないか、アクセスできません`);
      }
      
      return {
        action: 'getRecipe' as const,
        recipeId: context.recipeId,
        results: null,
        success: false,
        error: errorMessage,
        attribution: "Recipe data powered by Spoonacular API"
      };
    }
  }
}); 
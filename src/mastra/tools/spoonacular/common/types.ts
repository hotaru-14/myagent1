// ================================================================
// Spoonacular API 型定義
// ----------------------------------------------------------------
// Spoonacular APIで使用するTypeScript型定義を集約。
// APIレスポンス、リクエストパラメータ、共通インターフェースを定義。
// ================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

// ===========================================
// 共通型定義
// ===========================================

/**
 * 基本的なAPIレスポンス構造
 */
export interface BaseApiResponse {
  success: boolean;
  error?: string;
  attribution: string;
}

/**
 * レート制限情報
 */
export interface RateLimitInfo {
  quotaUsed?: string;
  quotaLeft?: string;
  quotaRequest?: string;
}

/**
 * 栄養素情報
 */
export interface NutrientInfo {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds?: number;
}

/**
 * 栄養情報（詳細）
 */
export interface DetailedNutritionInfo {
  nutrients: NutrientInfo[];
  properties?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  flavonoids?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  ingredients?: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    nutrients: NutrientInfo[];
  }>;
  caloricBreakdown?: {
    percentProtein: number;
    percentFat: number;
    percentCarbs: number;
  };
  weightPerServing?: {
    amount: number;
    unit: string;
  };
}

/**
 * 食材情報（基本）
 */
export interface BasicIngredient {
  id: number;
  name: string;
  localizedName?: string;
  image: string;
}

/**
 * 食材情報（詳細）
 */
export interface DetailedIngredient extends BasicIngredient {
  aisle?: string;
  consistency?: string;
  nameClean?: string;
  original: string;
  originalName?: string;
  amount: number;
  unit: string;
  meta?: string[];
  measures?: {
    us: { amount: number; unitShort: string; unitLong: string };
    metric: { amount: number; unitShort: string; unitLong: string };
  };
}

/**
 * 調理器具情報
 */
export interface Equipment {
  id: number;
  name: string;
  localizedName?: string;
  image: string;
}

/**
 * 調理手順のステップ
 */
export interface InstructionStep {
  number: number;
  step: string;
  ingredients: BasicIngredient[];
  equipment: Equipment[];
  length?: {
    number: number;
    unit: string;
  };
}

/**
 * 調理手順（分析済み）
 */
export interface AnalyzedInstruction {
  name: string;
  steps: InstructionStep[];
}

// ===========================================
// 複合検索（Complex Search）関連型
// ===========================================

/**
 * 複合検索リクエストパラメータ
 */
export interface RecipeSearchParams {
  query: string;
  cuisine?: string;
  diet?: string;
  intolerances?: string;
  type?: string;
  maxReadyTime?: number;
  minCalories?: number;
  maxCalories?: number;
  number?: number;
  addRecipeInformation?: boolean;
  fillIngredients?: boolean;
  addRecipeNutrition?: boolean;
  instructionsRequired?: boolean;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  offset?: number;
}

/**
 * 検索結果のレシピ（基本）
 */
export interface SearchResultRecipe {
  id: number;
  title: string;
  image: string;
  imageType?: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  summary?: string;
  spoonacularScore?: number;
  pricePerServing?: number;
  analyzedInstructions?: AnalyzedInstruction[];
  nutrition?: {
    nutrients: NutrientInfo[];
  };
  usedIngredientCount?: number;
  missedIngredientCount?: number;
  likes?: number;
}

/**
 * 複合検索APIレスポンス
 */
export interface RecipeSearchResponse extends BaseApiResponse {
  results: SearchResultRecipe[];
  totalResults: number;
  offset: number;
  number: number;
}

// ===========================================
// ランダムレシピ関連型
// ===========================================

/**
 * ランダムレシピリクエストパラメータ
 */
export interface RandomRecipeParams {
  number?: number;
  includeNutrition?: boolean;
  includeTags?: string;
  excludeTags?: string;
}

/**
 * ランダムレシピ（詳細）
 */
export interface RandomRecipe {
  id: number;
  title: string;
  image: string;
  imageType?: string;
  servings: number;
  readyInMinutes: number;
  cookingMinutes?: number;
  preparationMinutes?: number;
  license?: string;
  sourceName?: string;
  sourceUrl: string;
  spoonacularSourceUrl?: string;
  aggregateLikes?: number;
  healthScore?: number;
  spoonacularScore: number;
  pricePerServing: number;
  cheap?: boolean;
  creditsText?: string;
  cuisines: string[];
  dairyFree?: boolean;
  diets: string[];
  gaps?: string;
  glutenFree?: boolean;
  instructions?: string;
  ketogenic?: boolean;
  lowFodmap?: boolean;
  occasions: string[];
  sustainable?: boolean;
  vegan?: boolean;
  vegetarian?: boolean;
  veryHealthy?: boolean;
  veryPopular?: boolean;
  whole30?: boolean;
  weightWatcherSmartPoints?: number;
  dishTypes: string[];
  extendedIngredients: DetailedIngredient[];
  analyzedInstructions: AnalyzedInstruction[];
  originalId?: number | null;
  summary: string;
  winePairing?: {
    pairedWines: string[];
    pairingText: string;
    productMatches?: Array<{
      id: number;
      title: string;
      description: string;
      price: string;
      imageUrl: string;
      averageRating: number;
      ratingCount: number;
      score: number;
      link: string;
    }>;
  };
  nutrition?: DetailedNutritionInfo;
}

/**
 * ランダムレシピAPIレスポンス
 */
export interface RandomRecipeResponse extends BaseApiResponse {
  recipes: RandomRecipe[];
}

// ===========================================
// 食材ベース検索関連型
// ===========================================

/**
 * 食材ベース検索リクエストパラメータ
 */
export interface IngredientSearchParams {
  ingredients: string;
  number?: number;
  ranking?: number;
  ignorePantry?: boolean;
}

/**
 * 食材ベース検索の食材情報
 */
export interface IngredientMatch {
  id: number;
  amount: number;
  unit: string;
  unitLong: string;
  unitShort: string;
  aisle: string;
  name: string;
  original: string;
  originalName: string;
  meta: string[];
  image: string;
}

/**
 * 食材ベース検索のレシピ結果
 */
export interface IngredientSearchRecipe {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  missedIngredients: IngredientMatch[];
  usedIngredients: IngredientMatch[];
  unusedIngredients: IngredientMatch[];
  likes: number;
}

/**
 * 食材ベース検索APIレスポンス
 */
export interface IngredientSearchResponse extends BaseApiResponse {
  recipes: IngredientSearchRecipe[];
}

// ===========================================
// オートコンプリート関連型
// ===========================================

/**
 * オートコンプリートリクエストパラメータ
 */
export interface AutocompleteParams {
  query: string;
  number?: number;
}

/**
 * オートコンプリート候補
 */
export interface AutocompleteSuggestion {
  id: number;
  title: string;
  imageType?: string;
}

/**
 * オートコンプリートAPIレスポンス
 */
export interface AutocompleteResponse extends BaseApiResponse {
  suggestions: AutocompleteSuggestion[];
}

// ===========================================
// レシピ詳細情報関連型
// ===========================================

/**
 * レシピ詳細情報リクエストパラメータ
 */
export interface RecipeDetailParams {
  id: number;
  includeNutrition?: boolean;
  includeTaste?: boolean;
}

/**
 * レシピ詳細情報（最も詳細）
 */
export interface RecipeDetailInfo extends RandomRecipe {
  // RandomRecipeの全てのプロパティを継承
  // 追加で詳細情報があれば定義
}

/**
 * レシピ詳細情報APIレスポンス
 */
export interface RecipeDetailResponse extends BaseApiResponse {
  recipe: RecipeDetailInfo;
}

// ===========================================
// ツール統一レスポンス型
// ===========================================

/**
 * 各ツールの統一レスポンス型
 */
export interface SpoonacularToolResponse<T = any> extends BaseApiResponse {
  action: 'search' | 'random' | 'byIngredients' | 'autocomplete' | 'getRecipe';
  query?: string;
  results: T;
  totalResults?: number;
  rateLimit?: RateLimitInfo;
}

// ===========================================
// エラー関連型
// ===========================================

/**
 * APIエラー情報
 */
export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: any;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
  statusCode?: number;
  details?: any;
}

// ===========================================
// ユーティリティ型
// ===========================================

/**
 * Spoonacular APIでサポートされている値の型（文字列リテラル型用）
 */
export type SupportedCuisine = 
  | "african" | "asian" | "american" | "british" | "cajun" | "caribbean"
  | "chinese" | "eastern european" | "european" | "french" | "german"
  | "greek" | "indian" | "irish" | "italian" | "japanese" | "jewish"
  | "korean" | "latin american" | "mediterranean" | "mexican" | "middle eastern"
  | "nordic" | "southern" | "spanish" | "thai" | "vietnamese";

export type SupportedDiet = 
  | "gluten free" | "ketogenic" | "vegetarian" | "lacto-vegetarian"
  | "ovo-vegetarian" | "vegan" | "pescetarian" | "paleo" | "primal"
  | "low fodmap" | "whole30";

export type SupportedIntolerance = 
  | "dairy" | "egg" | "gluten" | "grain" | "peanut" | "seafood"
  | "sesame" | "shellfish" | "soy" | "sulfite" | "tree nut" | "wheat";

export type SupportedDishType = 
  | "main course" | "side dish" | "dessert" | "appetizer" | "salad"
  | "bread" | "breakfast" | "soup" | "beverage" | "sauce" | "marinade"
  | "fingerfood" | "snack" | "drink";

export type SupportedTag = 
  | "vegetarian" | "vegan" | "gluten free" | "dairy free" | "very healthy"
  | "cheap" | "very popular" | "sustainable" | "low fodmap" | "ketogenic"
  | "whole30" | "paleo" | "primal" | "pescetarian" | "fodmap friendly";

// ===========================================
// API クライアント関連型
// ===========================================

/**
 * APIリクエスト設定
 */
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * APIクライアントレスポンス
 */
export interface ApiClientResponse<T = any> {
  data: T;
  headers: Headers;
  status: number;
  statusText: string;
} 
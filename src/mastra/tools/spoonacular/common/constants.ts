// ================================================================
// Spoonacular API 共通定数定義
// ----------------------------------------------------------------
// Spoonacular APIで使用する定数をまとめたファイルです。
// エンドポイント、出典情報、制限値、エラーメッセージなどを定義。
// ================================================================

/**
 * Spoonacular API エンドポイント定義
 * 各ツールで使用するAPIエンドポイントを集約
 */
export const SPOONACULAR_API_ENDPOINTS = {
  // レシピ検索関連
  COMPLEX_SEARCH: "https://api.spoonacular.com/recipes/complexSearch",
  FIND_BY_INGREDIENTS: "https://api.spoonacular.com/recipes/findByIngredients", 
  AUTOCOMPLETE: "https://api.spoonacular.com/recipes/autocomplete",
  RANDOM: "https://api.spoonacular.com/recipes/random",
  RECIPE_INFORMATION: "https://api.spoonacular.com/recipes/{id}/information",
  
  // その他のエンドポイント（将来の拡張用）
  RECIPE_NUTRITION: "https://api.spoonacular.com/recipes/{id}/nutritionWidget.json",
  RECIPE_TASTE: "https://api.spoonacular.com/recipes/{id}/tasteWidget.json",
  SIMILAR_RECIPES: "https://api.spoonacular.com/recipes/{id}/similar",
} as const;

/**
 * Spoonacular API 出典情報
 * 利用規約に従い、データ出典を明記する必要があります
 */
export const SPOONACULAR_ATTRIBUTION = {
  TEXT_VERSION: "Recipe data powered by Spoonacular API",
  LINK_VERSION: `Recipe data powered by <a href="https://spoonacular.com/" title="Spoonacular API">Spoonacular API</a>`,
  REQUIREMENT_NOTE: "無料版では絶対必須の出典表示",
  TERMS_URL: "https://spoonacular.com/terms",
  API_DOCS_URL: "https://spoonacular.com/food-api/docs"
} as const;

/**
 * API制限値定義
 * 無料版の制限値を定義
 */
export const SPOONACULAR_LIMITS = {
  FREE_PLAN: {
    DAILY_REQUESTS: 150,
    REQUESTS_PER_MINUTE: 60,
    CONCURRENT_REQUESTS: 1
  },
  REQUEST_PARAMS: {
    MIN_RESULTS: 1,
    MAX_RESULTS: 100,
    DEFAULT_RESULTS: 5,
    MAX_READY_TIME: 999,
    MIN_CALORIES: 0,
    MAX_CALORIES: 5000
  }
} as const;

/**
 * 料理ジャンル定義
 * Spoonacular APIでサポートされている料理ジャンル
 */
export const SUPPORTED_CUISINES = [
  "african", "asian", "american", "british", "cajun", "caribbean", 
  "chinese", "eastern european", "european", "french", "german", 
  "greek", "indian", "irish", "italian", "japanese", "jewish", 
  "korean", "latin american", "mediterranean", "mexican", "middle eastern", 
  "nordic", "southern", "spanish", "thai", "vietnamese"
] as const;

/**
 * 食事制限定義
 * Spoonacular APIでサポートされている食事制限
 */
export const SUPPORTED_DIETS = [
  "gluten free", "ketogenic", "vegetarian", "lacto-vegetarian", 
  "ovo-vegetarian", "vegan", "pescetarian", "paleo", "primal", 
  "low fodmap", "whole30"
] as const;

/**
 * アレルギー・不耐性定義
 * Spoonacular APIでサポートされているアレルギー・不耐性
 */
export const SUPPORTED_INTOLERANCES = [
  "dairy", "egg", "gluten", "grain", "peanut", "seafood", 
  "sesame", "shellfish", "soy", "sulfite", "tree nut", "wheat"
] as const;

/**
 * 料理タイプ定義
 * Spoonacular APIでサポートされている料理タイプ
 */
export const SUPPORTED_DISH_TYPES = [
  "main course", "side dish", "dessert", "appetizer", "salad", 
  "bread", "breakfast", "soup", "beverage", "sauce", "marinade", 
  "fingerfood", "snack", "drink"
] as const;

/**
 * レシピタグ定義
 * ランダムレシピ検索で使用可能なタグ
 */
export const SUPPORTED_TAGS = [
  "vegetarian", "vegan", "gluten free", "dairy free", "very healthy", 
  "cheap", "very popular", "sustainable", "low fodmap", "ketogenic", 
  "whole30", "paleo", "primal", "pescetarian", "fodmap friendly"
] as const;

/**
 * HTTPステータスコード別エラーメッセージ
 * API呼び出し時のエラーハンドリング用
 */
export const ERROR_MESSAGES = {
  400: "不正なリクエスト: パラメータを確認してください",
  401: "APIキーが無効です。環境変数 SPOONACULAR_API_KEY を確認してください",
  402: "API日次制限に達しました（無料版: 150リクエスト/日）。明日まで待つか有料プランをご検討ください",
  403: "APIアクセスが制限されています。APIキーの権限を確認してください", 
  404: "指定されたリソースが見つかりません",
  429: "リクエスト制限に達しました（無料版: 60リクエスト/分）。少し待ってから再試行してください",
  500: "Spoonacular APIサーバーエラーが発生しました",
  503: "Spoonacular APIサービスが一時的に利用できません",
  NETWORK: "ネットワークエラー: インターネット接続を確認してください",
  TIMEOUT: "リクエストタイムアウト: APIの応答が遅延しています",
  UNKNOWN: "予期しないエラーが発生しました"
} as const;

/**
 * APIレスポンスヘッダー名
 * レート制限情報の取得用
 */
export const RATE_LIMIT_HEADERS = {
  QUOTA_USED: "X-API-Quota-Used",
  QUOTA_LEFT: "X-API-Quota-Left", 
  QUOTA_REQUEST: "X-API-Quota-Request"
} as const;

/**
 * リクエスト設定
 * API呼び出し時のデフォルト設定
 */
export const REQUEST_CONFIG = {
  TIMEOUT: 15000, // 15秒
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
  CONTENT_TYPE: "application/json",
  ACCEPT: "application/json"
} as const;

/**
 * 環境変数名
 */
export const ENV_VARS = {
  API_KEY: "SPOONACULAR_API_KEY"
} as const;

/**
 * デバッグ用ログプレフィックス
 */
export const LOG_PREFIXES = {
  SEARCH: "[Spoonacular Search]",
  RANDOM: "[Spoonacular Random]", 
  INGREDIENTS: "[Spoonacular Ingredients]",
  AUTOCOMPLETE: "[Spoonacular Autocomplete]",
  DETAIL: "[Spoonacular Detail]",
  API_CLIENT: "[Spoonacular API]"
} as const; 
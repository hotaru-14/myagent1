// ================================================================
// Spoonacular API クライアント
// ----------------------------------------------------------------
// Spoonacular APIへの共通アクセス処理を提供。
// エラーハンドリング、レート制限管理、リトライ処理を含む。
// ================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  SPOONACULAR_API_ENDPOINTS,
  SPOONACULAR_ATTRIBUTION,
  ERROR_MESSAGES,
  RATE_LIMIT_HEADERS,
  REQUEST_CONFIG,
  ENV_VARS,
  LOG_PREFIXES
} from './constants';

import {
  ApiClientResponse,
  ApiError,
  RequestConfig,
  RateLimitInfo
} from './types';

// ===========================================
// ユーティリティ関数
// ===========================================

/**
 * 環境変数からAPIキーを取得
 */
function getApiKey(): string {
  const apiKey = process.env[ENV_VARS.API_KEY];
  if (!apiKey) {
    throw new Error(`環境変数 ${ENV_VARS.API_KEY} が設定されていません。Spoonacular APIキーを設定してください。`);
  }
  return apiKey;
}

/**
 * URLテンプレートにパラメータを埋め込み
 * @param template - URL テンプレート (例: "/recipes/{id}/information")
 * @param params - 埋め込むパラメータ
 */
function interpolateUrl(template: string, params: Record<string, any>): string {
  let url = template;
  Object.keys(params).forEach(key => {
    const placeholder = `{${key}}`;
    if (url.includes(placeholder)) {
      url = url.replace(placeholder, encodeURIComponent(String(params[key])));
      delete params[key]; // URLに埋め込んだパラメータはクエリパラメータから除外
    }
  });
  return url;
}

/**
 * URLクエリパラメータを構築
 * @param params - パラメータオブジェクト
 */
function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

/**
 * レスポンスヘッダーからレート制限情報を抽出
 * @param headers - Response headers
 */
function extractRateLimitInfo(headers: Headers): RateLimitInfo {
  return {
    quotaUsed: headers.get(RATE_LIMIT_HEADERS.QUOTA_USED) || undefined,
    quotaLeft: headers.get(RATE_LIMIT_HEADERS.QUOTA_LEFT) || undefined,
    quotaRequest: headers.get(RATE_LIMIT_HEADERS.QUOTA_REQUEST) || undefined
  };
}

/**
 * HTTPステータスコードに基づいてエラーメッセージを取得
 * @param status - HTTPステータスコード
 */
function getErrorMessage(status: number): string {
  const message = ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES];
  return message || ERROR_MESSAGES.UNKNOWN;
}

/**
 * 指定した時間だけ待機
 * @param ms - 待機時間（ミリ秒）
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================================
// APIクライアントクラス
// ===========================================

/**
 * Spoonacular API クライアント
 * APIへの共通アクセス処理を提供
 */
export class SpoonacularApiClient {
  private readonly apiKey: string;
  private readonly defaultConfig: RequestConfig;

  constructor(config?: Partial<RequestConfig>) {
    this.apiKey = getApiKey();
    this.defaultConfig = {
      method: 'GET',
      timeout: REQUEST_CONFIG.TIMEOUT,
      retryAttempts: REQUEST_CONFIG.RETRY_ATTEMPTS,
      retryDelay: REQUEST_CONFIG.RETRY_DELAY,
      headers: {
        'Content-Type': REQUEST_CONFIG.CONTENT_TYPE,
        'Accept': REQUEST_CONFIG.ACCEPT
      },
      ...config
    };
  }

  /**
   * APIリクエストを実行（リトライ付き）
   * @param endpoint - APIエンドポイント
   * @param params - リクエストパラメータ
   * @param config - リクエスト設定
   */
  async request<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
    config?: Partial<RequestConfig>
  ): Promise<ApiClientResponse<T>> {
    const requestConfig = { ...this.defaultConfig, ...config };
    const maxAttempts = requestConfig.retryAttempts || 1;
    
    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`${LOG_PREFIXES.API_CLIENT} リクエスト試行 ${attempt}/${maxAttempts}: ${endpoint}`);
        
        const response = await this.executeRequest<T>(endpoint, params, requestConfig);
        
        console.log(`${LOG_PREFIXES.API_CLIENT} リクエスト成功: ${endpoint}`);
        return response;
        
      } catch (error) {
        lastError = error as ApiError;
        
        console.warn(`${LOG_PREFIXES.API_CLIENT} リクエスト失敗 (${attempt}/${maxAttempts}): ${lastError.message}`);
        
        // リトライすべきかチェック
        if (attempt < maxAttempts && this.shouldRetry(lastError)) {
          const delay = requestConfig.retryDelay || REQUEST_CONFIG.RETRY_DELAY;
          console.log(`${LOG_PREFIXES.API_CLIENT} ${delay}ms後にリトライします...`);
          await sleep(delay * attempt); // 指数バックオフ
          continue;
        }
        
        break; // リトライしない、または最後の試行
      }
    }

    // 全ての試行が失敗した場合
    console.error(`${LOG_PREFIXES.API_CLIENT} 全ての試行が失敗: ${endpoint}`, lastError);
    throw lastError;
  }

  /**
   * 単一のAPIリクエストを実行
   * @param endpoint - APIエンドポイント
   * @param params - リクエストパラメータ
   * @param config - リクエスト設定
   */
  private async executeRequest<T = any>(
    endpoint: string,
    params: Record<string, any>,
    config: RequestConfig
  ): Promise<ApiClientResponse<T>> {
    // URLパラメータの埋め込み
    const url = interpolateUrl(endpoint, { ...params });
    
    // APIキーを追加
    const queryParams = {
      ...params,
      apiKey: this.apiKey
    };
    
    // クエリパラメータを構築
    const queryString = buildQueryParams(queryParams);
    const fullUrl = `${url}?${queryString}`;

    // Fetch API設定
    const fetchConfig: RequestInit = {
      method: config.method || 'GET',
      headers: config.headers as HeadersInit,
      signal: AbortSignal.timeout(config.timeout || REQUEST_CONFIG.TIMEOUT)
    };

    try {
      console.log(`${LOG_PREFIXES.API_CLIENT} 送信: ${config.method} ${fullUrl.replace(this.apiKey, '***')}`);
      
      const response = await fetch(fullUrl, fetchConfig);
      
      // レート制限情報を抽出
      const rateLimitInfo = extractRateLimitInfo(response.headers);
      console.log(`${LOG_PREFIXES.API_CLIENT} レート制限情報:`, rateLimitInfo);

      // HTTPエラーチェック
      if (!response.ok) {
        const errorMessage = getErrorMessage(response.status);
        const error: ApiError = new Error(errorMessage) as ApiError;
        error.status = response.status;
        error.statusText = response.statusText;
        
        // エラー詳細情報を取得（可能であれば）
        try {
          error.response = await response.json();
        } catch {
          // JSONパースに失敗した場合は無視
        }
        
        throw error;
      }

      // レスポンスをJSON解析
      const data = await response.json();
      
      return {
        data,
        headers: response.headers,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      if (error instanceof Error) {
        // 既に処理済みのエラーはそのまま再スロー
        if ((error as ApiError).status) {
          throw error;
        }
        
        // ネットワークエラーやタイムアウトの処理
        const apiError: ApiError = new Error(
          error.name === 'AbortError' ? ERROR_MESSAGES.TIMEOUT : ERROR_MESSAGES.NETWORK
        ) as ApiError;
        apiError.status = 0;
        apiError.statusText = error.name;
        throw apiError;
      }
      
      // 予期しないエラー
      throw new Error(ERROR_MESSAGES.UNKNOWN);
    }
  }

  /**
   * エラーがリトライ対象かチェック
   * @param error - エラー情報
   */
  private shouldRetry(error: ApiError): boolean {
    if (!error.status) {
      // ネットワークエラーやタイムアウトはリトライ
      return true;
    }
    
    // リトライ対象のHTTPステータスコード
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.status);
  }
}

// ===========================================
// 便利な関数
// ===========================================

/**
 * デフォルトAPIクライアントインスタンス
 */
let defaultClient: SpoonacularApiClient | null = null;

/**
 * デフォルトAPIクライアントを取得
 * @param config - クライアント設定
 */
export function getApiClient(config?: Partial<RequestConfig>): SpoonacularApiClient {
  if (!defaultClient || config) {
    defaultClient = new SpoonacularApiClient(config);
  }
  return defaultClient;
}

/**
 * レシピ検索API呼び出し
 * @param params - 検索パラメータ
 */
export async function searchRecipes(params: Record<string, any>): Promise<ApiClientResponse> {
  const client = getApiClient();
  return client.request(SPOONACULAR_API_ENDPOINTS.COMPLEX_SEARCH, params);
}

/**
 * ランダムレシピ取得API呼び出し
 * @param params - リクエストパラメータ
 */
export async function getRandomRecipes(params: Record<string, any>): Promise<ApiClientResponse> {
  const client = getApiClient();
  return client.request(SPOONACULAR_API_ENDPOINTS.RANDOM, params);
}

/**
 * 食材ベースレシピ検索API呼び出し
 * @param params - 検索パラメータ
 */
export async function searchRecipesByIngredients(params: Record<string, any>): Promise<ApiClientResponse> {
  const client = getApiClient();
  return client.request(SPOONACULAR_API_ENDPOINTS.FIND_BY_INGREDIENTS, params);
}

/**
 * レシピオートコンプリートAPI呼び出し
 * @param params - リクエストパラメータ
 */
export async function autocompleteRecipeSearch(params: Record<string, any>): Promise<ApiClientResponse> {
  const client = getApiClient();
  return client.request(SPOONACULAR_API_ENDPOINTS.AUTOCOMPLETE, params);
}

/**
 * レシピ詳細情報取得API呼び出し
 * @param id - レシピID
 * @param params - リクエストパラメータ
 */
export async function getRecipeInformation(id: number, params: Record<string, any> = {}): Promise<ApiClientResponse> {
  const client = getApiClient();
  return client.request(SPOONACULAR_API_ENDPOINTS.RECIPE_INFORMATION, { id, ...params });
}

/**
 * レスポンスに出典情報を追加
 * @param data - レスポンスデータ
 */
export function addAttribution<T extends Record<string, unknown>>(data: T): T & { attribution: string } {
  return {
    ...data,
    attribution: SPOONACULAR_ATTRIBUTION.TEXT_VERSION
  };
}

/**
 * パラメータ検証ヘルパー
 * @param params - 検証するパラメータ
 * @param required - 必須パラメータのリスト
 */
export function validateParams(params: Record<string, any>, required: string[]): void {
  for (const param of required) {
    if (!params[param]) {
      throw new Error(`必須パラメータ '${param}' が不足しています`);
    }
  }
} 
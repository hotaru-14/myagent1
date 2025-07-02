/* eslint-disable @typescript-eslint/no-explicit-any */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// WeatherAPI.com エンドポイント定義
const WEATHER_API_ENDPOINTS = {
  search: "http://api.weatherapi.com/v1/search.json",
};

// 必須の出典表示（WeatherAPI.com利用規約準拠）
const WEATHER_API_ATTRIBUTION = {
  textVersion: `Powered by WeatherAPI.com`,
  linkVersion: `Powered by <a href="https://www.weatherapi.com/" title="Weather API">WeatherAPI.com</a>`,
  requirement: "無料版では絶対必須"
};

// 地名検索結果データ型定義
interface LocationSearchResponse {
  results: Array<{
    id: number;
    name: string;
    region: string;
    country: string;
    coordinates: { lat: number; lon: number };
    url: string;
  }>;
  attribution: string;
}

// WeatherAPI.com Search/Autocomplete データ取得関数
const searchLocation = async (
  query: string,
  maxResults: number = 10
): Promise<LocationSearchResponse> => {
  
  // APIキー確認
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('WEATHER_API_KEY environment variable not set');
  }

  // 検索クエリの検証
  if (!query || query.trim().length < 3) {
    throw new Error('検索クエリは3文字以上で入力してください');
  }

  // URLパラメータ構築
  const params = new URLSearchParams({
    key: apiKey,
    q: query.trim()
  });

  const url = `${WEATHER_API_ENDPOINTS.search}?${params}`;

  try {
    const response = await fetch(url, {
      timeout: 10000
    } as RequestInit);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(`不正なリクエスト: 検索クエリ '${query}' を確認してください`);
      } else if (response.status === 401) {
        throw new Error('WeatherAPI.com APIキーが無効です');
      } else if (response.status === 403) {
        throw new Error('WeatherAPI.com APIアクセスが制限されています');
      } else {
        throw new Error(`WeatherAPI.com API error: ${response.status}`);
      }
    }

    const data = await response.json();
    
    return processSearchData(data, maxResults);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('地名検索に失敗しました');
  }
};

// レスポンスデータ処理
function processSearchData(data: Record<string, any>[], maxResults: number): LocationSearchResponse {
  if (!Array.isArray(data)) {
    throw new Error('無効な検索結果データです');
  }

  // 結果数を制限
  const limitedResults = data.slice(0, maxResults);

  return {
    results: limitedResults.map(location => ({
      id: location.id,
      name: location.name,
      region: location.region || '',
      country: location.country,
      coordinates: {
        lat: location.lat,
        lon: location.lon
      },
      url: location.url || ''
    })),
    attribution: WEATHER_API_ATTRIBUTION.textVersion
  };
}

// ツール定義
export const weatherApiSearchAutocompleteTool = createTool({
  id: 'weatherapi-search-autocomplete',
  description: `
  WeatherAPI.comの地名検索・オートコンプリート機能。サポートされている地名の検索と確認を行います。
  【取得データ】地点ID、地点名、地域名（州/県）、国名、緯度・経度座標、WeatherAPI用URL識別子。
  【検索対象】都市名、地域名、国名、郵便番号、空港コード等で検索可能。
  英語・日本語両対応。
  気象データ取得前の地点特定に必須のツールです。
  `,
  inputSchema: z.object({
    query: z.string().min(3).describe('検索クエリ（3文字以上）。都市名、地域名、国名、郵便番号などを指定'),
    maxResults: z.number().min(1).max(50).default(10).describe('最大検索結果数（1-50、デフォルト10）')
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      id: z.number().describe('地点ID'),
      name: z.string().describe('地点名'),
      region: z.string().describe('地域名・州名'),
      country: z.string().describe('国名'),
      coordinates: z.object({
        lat: z.number().describe('緯度'),
        lon: z.number().describe('経度')
      }),
      url: z.string().describe('WeatherAPI用URL識別子')
    })),
    attribution: z.string().describe('データ提供元')
  }),
  execute: async ({ context }) => {
    return await searchLocation(
      context.query,
      context.maxResults
    );
  }
}); 
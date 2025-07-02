import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// WeatherAPI.com エンドポイント定義
const WEATHER_API_ENDPOINTS = {
  current: "http://api.weatherapi.com/v1/current.json",
};

// 必須の出典表示（WeatherAPI.com利用規約準拠）
const WEATHER_API_ATTRIBUTION = {
  textVersion: `Powered by WeatherAPI.com`,
  linkVersion: `Powered by <a href="https://www.weatherapi.com/" title="Weather API">WeatherAPI.com</a>`,
  requirement: "無料版では絶対必須"
};



// 現在の天気データ型定義
interface RealtimeWeatherResponse {
  location: {
    name: string;
    country: string;
    region: string;
    timezone: string;
    coordinates: { lat: number; lon: number };
    localTime: string;
  };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
    condition: string;
    conditionIcon: string;
    windSpeed: number;
    windDirection: string;
    windDegree: number;
    windGust: number;
    precipitation: number;
    isDay: boolean;
    cloudCover: number;
  };
  attribution: string;
}

// WeatherAPI.com Realtime データ取得関数
const getRealtimeWeather = async (
  location: string,
  includeAirQuality: boolean = false
): Promise<RealtimeWeatherResponse> => {
  
  // APIキー確認
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('WEATHER_API_KEY environment variable not set');
  }

  // URLパラメータ構築
  const params = new URLSearchParams({
    key: apiKey,
    q: location,
    aqi: includeAirQuality ? 'yes' : 'no'
  });

  const url = `${WEATHER_API_ENDPOINTS.current}?${params}`;

  try {
    const response = await fetch(url, {
      timeout: 10000
    } as RequestInit);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(`不正なリクエスト: 地名 '${location}' を確認してください`);
      } else if (response.status === 401) {
        throw new Error('WeatherAPI.com APIキーが無効です');
      } else if (response.status === 403) {
        throw new Error('WeatherAPI.com APIアクセスが制限されています');
      } else {
        throw new Error(`WeatherAPI.com API error: ${response.status}`);
      }
    }

    const data = await response.json();
    
    return processRealtimeData(data);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('現在の天気データの取得に失敗しました');
  }
};

// レスポンスデータ処理
function processRealtimeData(data: any): RealtimeWeatherResponse {
  const location = data.location;
  const current = data.current;

  return {
    location: {
      name: location.name,
      country: location.country,
      region: location.region,
      timezone: location.tz_id,
      coordinates: {
        lat: location.lat,
        lon: location.lon
      },
      localTime: location.localtime
    },
    current: {
      temperature: current.temp_c,
      feelsLike: current.feelslike_c,
      humidity: current.humidity,
      pressure: current.pressure_mb,
      visibility: current.vis_km,
      uvIndex: current.uv,
      condition: current.condition.text,
      conditionIcon: current.condition.icon,
      windSpeed: current.wind_kph,
      windDirection: current.wind_dir,
      windDegree: current.wind_degree,
      windGust: current.gust_kph || 0,
      precipitation: current.precip_mm,
      isDay: current.is_day === 1,
      cloudCover: current.cloud
    },
    attribution: WEATHER_API_ATTRIBUTION.textVersion
  };
}

// ツール定義
export const weatherApiRealtimeTool = createTool({
  id: 'weatherapi-realtime',
  description: `
  WeatherAPI.comのリアルタイム現在天気データ取得。
  【基本気象データ】現在気温、体感温度、天気状況・アイコン、昼夜判定、現地時刻・タイムゾーン。
  【湿度・気圧系】湿度(%)、気圧(hPa)、視界距離(km)、雲量(%)。
  【風データ】風速(km/h)、風向き(方角・度数)、突風速度。
  【降水・UV】現在降水量(mm)、UV指数。
  【位置情報】地点名、国名、地域名、緯度・経度座標。
  【オプション】大気質データ(AQI)対応。リアルタイム更新で気象状況の現在の詳細把握に最適。
  `,
  inputSchema: z.object({
    location: z.string().describe('地名（日本語または英語）。都市名、都道府県名、国名、緯度経度、IPアドレスなどを指定可能'),
    includeAirQuality: z.boolean().default(false).describe('大気質情報を含めるかどうか（オプション）')
  }),
  outputSchema: z.object({
    location: z.object({
      name: z.string().describe('地点名'),
      country: z.string().describe('国名'),
      region: z.string().describe('地域名'),
      timezone: z.string().describe('タイムゾーン'),
      coordinates: z.object({
        lat: z.number().describe('緯度'),
        lon: z.number().describe('経度')
      }),
      localTime: z.string().describe('現地時刻')
    }),
    current: z.object({
      temperature: z.number().describe('気温（摂氏）'),
      feelsLike: z.number().describe('体感温度（摂氏）'),
      humidity: z.number().describe('湿度（%）'),
      pressure: z.number().describe('気圧（hPa）'),
      visibility: z.number().describe('視界（km）'),
      uvIndex: z.number().describe('UV指数'),
      condition: z.string().describe('天気状況'),
      conditionIcon: z.string().describe('天気アイコンURL'),
      windSpeed: z.number().describe('風速（km/h）'),
      windDirection: z.string().describe('風向き'),
      windDegree: z.number().describe('風向き（度）'),
      windGust: z.number().describe('突風（km/h）'),
      precipitation: z.number().describe('降水量（mm）'),
      isDay: z.boolean().describe('昼間かどうか'),
      cloudCover: z.number().describe('雲量（%）')
    }),
    attribution: z.string().describe('データ提供元')
  }),
  execute: async ({ context }) => {
    return await getRealtimeWeather(
      context.location,
      context.includeAirQuality
    );
  }
}); 
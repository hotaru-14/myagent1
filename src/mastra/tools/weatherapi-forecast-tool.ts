/* eslint-disable @typescript-eslint/no-explicit-any */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// WeatherAPI.com エンドポイント定義
const WEATHER_API_ENDPOINTS = {
  forecast: "http://api.weatherapi.com/v1/forecast.json",
};

// 必須の出典表示（WeatherAPI.com利用規約準拠）
const WEATHER_API_ATTRIBUTION = {
  textVersion: `Powered by WeatherAPI.com`,
  linkVersion: `Powered by <a href="https://www.weatherapi.com/" title="Weather API">WeatherAPI.com</a>`,
  requirement: "無料版では絶対必須"
};



// 天気予報データ型定義
interface ForecastWeatherResponse {
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
    condition: string;
    conditionIcon: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
    uvIndex: number;
    visibility: number;
    isDay: boolean;
  };
  forecast: Array<{
    date: string;
    temperature: { max: number; min: number; average: number };
    condition: string;
    conditionIcon: string;
    precipitationChance: number;
    totalPrecipitation: number;
    avgHumidity: number;
    maxWindSpeed: number;
    avgVisibility: number;
    uvIndex: number;
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    moonPhase: string;
    hourlyData?: Array<{
      time: string;
      temperature: number;
      feelsLike: number;
      condition: string;
      conditionIcon: string;
      precipitationChance: number;
      precipitation: number;
      windSpeed: number;
      windDirection: string;
      pressure: number;
      humidity: number;
      visibility: number;
      uvIndex: number;
      isDay: boolean;
    }>;
  }>;
  attribution: string;
}

// WeatherAPI.com Forecast データ取得関数
const getForecastWeather = async (
  location: string,
  days: number = 3,
  includeHourly: boolean = false,
  includeAirQuality: boolean = false
): Promise<ForecastWeatherResponse> => {
  
  // 日数制限チェック（無料版は3日まで）
  if (days > 3) {
    throw new Error('無料版では3日先までの予報のみ利用可能です');
  }

  // APIキー確認
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('WEATHER_API_KEY environment variable not set');
  }

  // URLパラメータ構築
  const params = new URLSearchParams({
    key: apiKey,
    q: location,
    days: days.toString(),
    aqi: includeAirQuality ? 'yes' : 'no',
    alerts: 'no' // 予報ツールでは気象警報は含めない
  });

  const url = `${WEATHER_API_ENDPOINTS.forecast}?${params}`;

  try {
    const response = await fetch(url, {
      timeout: 15000
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
    
    return processForecastData(data, includeHourly);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('天気予報データの取得に失敗しました');
  }
};

// レスポンスデータ処理
function processForecastData(data: Record<string, any>, includeHourly: boolean): ForecastWeatherResponse {
  const location = data.location;
  const current = data.current;
  const forecast = data.forecast;

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
      condition: current.condition.text,
      conditionIcon: current.condition.icon,
      humidity: current.humidity,
      windSpeed: current.wind_kph,
      windDirection: current.wind_dir,
      pressure: current.pressure_mb,
      uvIndex: current.uv,
      visibility: current.vis_km,
      isDay: current.is_day === 1
    },
    forecast: forecast.forecastday.map((day: Record<string, any>) => {
      const dayData = day.day;
      const astro = day.astro;
      
      const forecastDay: Record<string, any> = {
        date: day.date,
        temperature: {
          max: dayData.maxtemp_c,
          min: dayData.mintemp_c,
          average: dayData.avgtemp_c
        },
        condition: dayData.condition.text,
        conditionIcon: dayData.condition.icon,
        precipitationChance: dayData.daily_chance_of_rain,
        totalPrecipitation: dayData.totalprecip_mm,
        avgHumidity: dayData.avghumidity,
        maxWindSpeed: dayData.maxwind_kph,
        avgVisibility: dayData.avgvis_km,
        uvIndex: dayData.uv,
        sunrise: astro.sunrise,
        sunset: astro.sunset,
        moonrise: astro.moonrise,
        moonset: astro.moonset,
        moonPhase: astro.moon_phase
      };

      // 時間別データを含める場合
      if (includeHourly && day.hour) {
        forecastDay.hourlyData = day.hour.map((hour: Record<string, any>) => ({
          time: hour.time,
          temperature: hour.temp_c,
          feelsLike: hour.feelslike_c,
          condition: hour.condition.text,
          conditionIcon: hour.condition.icon,
          precipitationChance: hour.chance_of_rain,
          precipitation: hour.precip_mm,
          windSpeed: hour.wind_kph,
          windDirection: hour.wind_dir,
          pressure: hour.pressure_mb,
          humidity: hour.humidity,
          visibility: hour.vis_km,
          uvIndex: hour.uv,
          isDay: hour.is_day === 1
        }));
      }

      return forecastDay;
    }),
    attribution: WEATHER_API_ATTRIBUTION.textVersion
  };
}

// ツール定義
export const weatherApiForecastTool = createTool({
  id: 'weatherapi-forecast',
  description: `
  WeatherAPI.com天気予報データ取得（最大3日間）。
  【現在データ】リアルタイム気温、体感温度、天気状況、湿度、風速・風向き、気圧、UV指数、視界、昼夜判定。
  【日別予報】最高・最低・平均気温、天気状況・アイコン、降水確率(%)、総降水量(mm)、平均湿度、最大風速、平均視界、UV指数。
  【天体データ】日出・日入時刻、月出・月入時刻、月相情報。
  【時間別予報(オプション)】3時間毎の気温、体感温度、天気状況、降水確率・降水量、風速・風向き、気圧、湿度、視界、UV指数、昼夜判定(24時間×3日分)。
  【位置情報】地点名、国・地域名、タイムゾーン、緯度・経度座標、現地時刻。
  【オプション】大気質情報(AQI)対応。
  `,
  inputSchema: z.object({
    location: z.string().describe('地名（日本語または英語）。都市名、都道府県名、国名、緯度経度、IPアドレスなどを指定可能'),
    days: z.number().min(1).max(3).default(3).describe('予報日数（1-3日、デフォルト3日）'),
    includeHourly: z.boolean().default(false).describe('時間別予報を含めるかどうか（オプション）'),
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
      temperature: z.number().describe('現在の気温（摂氏）'),
      feelsLike: z.number().describe('現在の体感温度（摂氏）'),
      condition: z.string().describe('現在の天気状況'),
      conditionIcon: z.string().describe('現在の天気アイコンURL'),
      humidity: z.number().describe('現在の湿度（%）'),
      windSpeed: z.number().describe('現在の風速（km/h）'),
      windDirection: z.string().describe('現在の風向き'),
      pressure: z.number().describe('現在の気圧（hPa）'),
      uvIndex: z.number().describe('現在のUV指数'),
      visibility: z.number().describe('現在の視界（km）'),
      isDay: z.boolean().describe('現在昼間かどうか')
    }),
    forecast: z.array(z.object({
      date: z.string().describe('予報日'),
      temperature: z.object({
        max: z.number().describe('最高気温（摂氏）'),
        min: z.number().describe('最低気温（摂氏）'),
        average: z.number().describe('平均気温（摂氏）')
      }),
      condition: z.string().describe('天気状況'),
      conditionIcon: z.string().describe('天気アイコンURL'),
      precipitationChance: z.number().describe('降水確率（%）'),
      totalPrecipitation: z.number().describe('総降水量（mm）'),
      avgHumidity: z.number().describe('平均湿度（%）'),
      maxWindSpeed: z.number().describe('最大風速（km/h）'),
      avgVisibility: z.number().describe('平均視界（km）'),
      uvIndex: z.number().describe('UV指数'),
      sunrise: z.string().describe('日の出時刻'),
      sunset: z.string().describe('日の入り時刻'),
      moonrise: z.string().describe('月の出時刻'),
      moonset: z.string().describe('月の入り時刻'),
      moonPhase: z.string().describe('月相'),
      hourlyData: z.array(z.object({
        time: z.string().describe('時刻'),
        temperature: z.number().describe('気温（摂氏）'),
        feelsLike: z.number().describe('体感温度（摂氏）'),
        condition: z.string().describe('天気状況'),
        conditionIcon: z.string().describe('天気アイコンURL'),
        precipitationChance: z.number().describe('降水確率（%）'),
        precipitation: z.number().describe('降水量（mm）'),
        windSpeed: z.number().describe('風速（km/h）'),
        windDirection: z.string().describe('風向き'),
        pressure: z.number().describe('気圧（hPa）'),
        humidity: z.number().describe('湿度（%）'),
        visibility: z.number().describe('視界（km）'),
        uvIndex: z.number().describe('UV指数'),
        isDay: z.boolean().describe('昼間かどうか')
      })).optional().describe('時間別予報データ（オプション）')
    })),
    attribution: z.string().describe('データ提供元')
  }),
  execute: async ({ context }) => {
    return await getForecastWeather(
      context.location,
      context.days,
      context.includeHourly,
      context.includeAirQuality
    );
  }
}); 
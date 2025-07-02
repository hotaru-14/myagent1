import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// WeatherAPI.com エンドポイント定義
const WEATHER_API_ENDPOINTS = {
  history: "http://api.weatherapi.com/v1/history.json",
};

// 必須の出典表示（WeatherAPI.com利用規約準拠）
const WEATHER_API_ATTRIBUTION = {
  textVersion: `Powered by WeatherAPI.com`,
  linkVersion: `Powered by <a href="https://www.weatherapi.com/" title="Weather API">WeatherAPI.com</a>`,
  requirement: "無料版では絶対必須"
};



// 過去天気データ型定義
interface HistoryWeatherResponse {
  location: {
    name: string;
    country: string;
    region: string;
    timezone: string;
    coordinates: { lat: number; lon: number };
  };
  historyData: Array<{
    date: string;
    temperature: { max: number; min: number; average: number };
    condition: string;
    conditionIcon: string;
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

// WeatherAPI.com History データ取得関数
const getHistoryWeather = async (
  location: string,
  startDate: string,
  endDate?: string,
  includeHourly: boolean = false
): Promise<HistoryWeatherResponse> => {
  
  // 日付検証
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(startDate);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  if (start < sevenDaysAgo) {
    throw new Error('無料版では過去7日以内のデータのみ取得可能です');
  }

  if (start > now || end > now) {
    throw new Error('未来の日付は指定できません');
  }

  // APIキー確認
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('WEATHER_API_KEY environment variable not set');
  }

  const historyData: any[] = [];
  let currentDate = new Date(start);
  
  // 日別にデータを取得
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const params = new URLSearchParams({
      key: apiKey,
      q: location,
      dt: dateStr
    });

    const url = `${WEATHER_API_ENDPOINTS.history}?${params}`;

    try {
      const response = await fetch(url, {
        timeout: 10000
      } as RequestInit);

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(`不正なリクエスト: 地名 '${location}' または日付 '${dateStr}' を確認してください`);
        } else if (response.status === 401) {
          throw new Error('WeatherAPI.com APIキーが無効です');
        } else if (response.status === 403) {
          throw new Error('WeatherAPI.com APIアクセスが制限されています');
        } else {
          throw new Error(`WeatherAPI.com API error: ${response.status}`);
        }
      }

      const data = await response.json();
      historyData.push(data);
      
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`過去天気データの取得に失敗しました: ${dateStr}`);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return processHistoryData(historyData, includeHourly);
};

// レスポンスデータ処理
function processHistoryData(dataArray: any[], includeHourly: boolean): HistoryWeatherResponse {
  if (dataArray.length === 0) {
    throw new Error('履歴データが見つかりません');
  }

  const firstData = dataArray[0];
  const location = firstData.location;

  return {
    location: {
      name: location.name,
      country: location.country,
      region: location.region,
      timezone: location.tz_id,
      coordinates: {
        lat: location.lat,
        lon: location.lon
      }
    },
    historyData: dataArray.map(data => {
      const day = data.forecast.forecastday[0];
      const dayData = day.day;
      const astro = day.astro;
      
      const historyDay: any = {
        date: day.date,
        temperature: {
          max: dayData.maxtemp_c,
          min: dayData.mintemp_c,
          average: dayData.avgtemp_c
        },
        condition: dayData.condition.text,
        conditionIcon: dayData.condition.icon,
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
        historyDay.hourlyData = day.hour.map((hour: any) => ({
          time: hour.time,
          temperature: hour.temp_c,
          feelsLike: hour.feelslike_c,
          condition: hour.condition.text,
          conditionIcon: hour.condition.icon,
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

      return historyDay;
    }),
    attribution: WEATHER_API_ATTRIBUTION.textVersion
  };
}

// ツール定義
export const weatherApiHistoryTool = createTool({
  id: 'weatherapi-history',
  description: `
  WeatherAPI.com過去天気データ取得（過去7日以内）。
  【日別履歴データ】最高・最低・平均気温、天気状況・アイコン、総降水量(mm)、平均湿度、最大風速、平均視界、UV指数。
  【天体履歴】日出・日入時刻、月出・月入時刻、月相情報。
  【時間別履歴(オプション)】毎時間の気温、体感温度、天気状況・アイコン、降水量、風速・風向き、気圧、湿度、視界、UV指数、昼夜判定。
  【位置情報】地点名、国名、地域名、タイムゾーン、緯度・経度座標。
  【期間指定】単日または期間指定可能（開始日〜終了日）。
  気象トレンド分析、現在状況との比較に最適。
  `,
  inputSchema: z.object({
    location: z.string().describe('地名（日本語または英語）。都市名、都道府県名、国名、緯度経度、IPアドレスなどを指定可能'),
    startDate: z.string().describe('開始日（YYYY-MM-DD形式、過去7日以内）'),
    endDate: z.string().optional().describe('終了日（YYYY-MM-DD形式、省略時は開始日のみ）'),
    includeHourly: z.boolean().default(false).describe('時間別データを含めるかどうか（オプション）')
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
      })
    }),
    historyData: z.array(z.object({
      date: z.string().describe('日付'),
      temperature: z.object({
        max: z.number().describe('最高気温（摂氏）'),
        min: z.number().describe('最低気温（摂氏）'),
        average: z.number().describe('平均気温（摂氏）')
      }),
      condition: z.string().describe('天気状況'),
      conditionIcon: z.string().describe('天気アイコンURL'),
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
        precipitation: z.number().describe('降水量（mm）'),
        windSpeed: z.number().describe('風速（km/h）'),
        windDirection: z.string().describe('風向き'),
        pressure: z.number().describe('気圧（hPa）'),
        humidity: z.number().describe('湿度（%）'),
        visibility: z.number().describe('視界（km）'),
        uvIndex: z.number().describe('UV指数'),
        isDay: z.boolean().describe('昼間かどうか')
      })).optional().describe('時間別履歴データ（オプション）')
    })),
    attribution: z.string().describe('データ提供元')
  }),
  execute: async ({ context }) => {
    return await getHistoryWeather(
      context.location,
      context.startDate,
      context.endDate,
      context.includeHourly
    );
  }
}); 
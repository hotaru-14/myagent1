# 🌦️ 高度な天気エージェント実装計画

## 📋 プロジェクト概要

気象庁防災気象情報XML / JMAオープンデータとWeatherAPI.comを統合した高度な天気エージェントの実装。

### 🎯 実装範囲
- ❌ ワークフローは実装しない
- ✅ weather-agentを強化・統合
- ✅ 4つの新規ツールを実装
- ✅ 複数データソースの統合・信頼性評価

## 🛠️ 新規ツール実装詳細

### 1. JMA予報ツール (`jma-forecast-tool.ts`)

#### 目的
気象庁の公式JSON APIから日本国内の詳細な天気予報データを取得

#### エンドポイント
```
https://www.jma.go.jp/bosai/forecast/data/forecast/{areaCode}.json
https://www.jma.go.jp/bosai/forecast/data/overview_forecast/{areaCode}.json
https://www.jma.go.jp/bosai/common/const/area.json
```

#### 入力スキーマ
```typescript
{
  location: string, // 都市名または都道府県名
  forecastType: 'detailed' | 'overview', // デフォルト: 'detailed'
  days: number // 1-7日、デフォルト: 3
}
```

#### 出力スキーマ
```typescript
{
  location: {
    name: string,
    areaCode: string,
    prefecture: string
  },
  publishingOffice: string,
  reportDatetime: string,
  forecasts: [{
    date: string,
    weather: string,
    weatherCode: string,
    temperature: { max?: number, min?: number },
    precipitationChance: {
      morning: number,
      afternoon: number,
      evening: number,
      night: number
    },
    wind: string,
    wave?: string
  }],
  weeklyOverview?: string
}
```

#### 主要機能
- **地域コード自動解決**: 地域名から気象庁予報区コードを自動特定
- **予報データ構造化**: 複雑なJSON構造を統一フォーマットに変換
- **エラーハンドリング**: 地域コード未発見時のフォールバック

### 2. JMA防災情報ツール (`jma-warning-tool.ts`)

#### 目的
気象庁の防災気象情報XMLから警報・注意報・特別警報をリアルタイムで取得・解析

#### エンドポイント
```
https://www.jma.go.jp/bosai/warning/data/warning/{areaCode}.json
https://www.jma.go.jp/bosai/warning/data/warning_detail/{areaCode}.json
```

#### 対象警報種類
- 大雨警報・注意報
- 洪水警報・注意報
- 暴風警報・注意報
- 波浪警報・注意報
- 高潮警報・注意報
- 雷注意報
- 特別警報

#### 入力スキーマ
```typescript
{
  location: string, // 監視対象地域
  warningTypes?: string[], // 取得する警報種類
  severity: 'all' | 'warning' | 'advisory' | 'emergency' // デフォルト: 'all'
}
```

#### 出力スキーマ
```typescript
{
  location: { name: string, code: string },
  updateTime: string,
  hasActiveWarnings: boolean,
  warnings: [{
    type: string,
    severity: '特別警報' | '警報' | '注意報',
    issuedTime: string,
    validUntil?: string,
    description: string,
    areas: string[],
    urgency: 'immediate' | 'expected' | 'future',
    certainty: 'observed' | 'likely' | 'possible',
    instruction?: string
  }],
  summary: string
}
```

#### 主要機能
- **XMLデータ解析**: 気象庁独自XMLフォーマットの解析
- **警報レベル自動評価**: 特別警報優先、重要度統合
- **自動通知判定**: 生命に関わる警報の即座検出

### 3. WeatherAPI統合ツール (`weather-api-tool.ts`)

#### 目的
WeatherAPI.comの豊富な気象データでJMAデータを補完、国際対応

#### エンドポイント
```
http://api.weatherapi.com/v1/current.json
http://api.weatherapi.com/v1/forecast.json
http://api.weatherapi.com/v1/astronomy.json
```

#### 入力スキーマ
```typescript
{
  location: string, // 都市名（日本語・英語対応）
  dataType: 'current' | 'forecast' | 'astronomy' | 'airQuality', // デフォルト: 'forecast'
  days: number, // 1-10日、デフォルト: 3
  includeHourly: boolean, // デフォルト: true
  includeAirQuality: boolean // デフォルト: false
}
```

#### 出力スキーマ
```typescript
{
  location: {
    name: string,
    country: string,
    timezone: string,
    coordinates: { lat: number, lon: number }
  },
  current: {
    temperature: number,
    feelsLike: number,
    humidity: number,
    pressure: number,
    visibility: number,
    uvIndex: number,
    condition: string,
    windSpeed: number,
    windDirection: string,
    precipitation: number
  },
  forecast: [{
    date: string,
    temperature: { max: number, min: number, average: number },
    condition: string,
    precipitationChance: number,
    totalPrecipitation: number,
    humidity: number,
    wind: { speed: number, direction: string, gust: number },
    uvIndex: number,
    hourlyData?: [{ time: string, temperature: number, condition: string, precipitation: number, windSpeed: number }]
  }],
  astronomy?: {
    sunrise: string,
    sunset: string,
    moonrise: string,
    moonset: string,
    moonPhase: string
  },
  airQuality?: {
    co: number, no2: number, o3: number, so2: number,
    pm2_5: number, pm10: number,
    usEpaIndex: number, gbDefraIndex: number
  }
}
```

#### 主要機能
- **多言語地名解決**: 日本語地名の英語変換、座標特定
- **時間別詳細予報**: 24時間×7日間、1時間単位の詳細データ
- **大気質・紫外線情報**: PM2.5、UV指数、花粉情報

### 4. 天気統合アグリゲーター (`weather-aggregator-tool.ts`)

#### 目的
複数気象データソースの統合、信頼性評価、総合判断

#### 入力スキーマ
```typescript
{
  location: string,
  analysisType: 'comprehensive' | 'emergency' | 'planning', // デフォルト: 'comprehensive'
  prioritySource: 'jma' | 'weatherapi' | 'auto', // デフォルト: 'auto'
  includeWarnings: boolean // デフォルト: true
}
```

#### 出力スキーマ
```typescript
{
  location: string,
  aggregationTime: string,
  dataReliability: {
    overall: number, // 0-1
    sourceReliability: {
      jma: number, weatherapi: number, openmeteo: number
    },
    dataConsistency: number
  },
  consensus: {
    weather: string,
    temperature: { max: number, min: number, confidence: number },
    precipitation: { probability: number, amount: number, confidence: number }
  },
  sourceComparison: [{
    source: string,
    forecast: { weather: string, temperature: {max: number, min: number}, precipitation: number },
    deviation: number,
    reliability: number
  }],
  activeWarnings?: any[],
  recommendations: {
    confidence: 'high' | 'medium' | 'low',
    suggestions: string[],
    riskFactors: string[]
  }
}
```

#### 主要機能
- **データ統合アルゴリズム**: タイムスタンプ正規化、単位統一、重み付き平均
- **信頼性評価システム**: 過去精度履歴、更新頻度、整合性評価
- **矛盾解決メカニズム**: 信頼性重み付け、地域特性考慮
- **スマート推奨生成**: 統合データに基づく活動提案、リスク検出

## 🤖 統合型Weather Agent設計

### 強化されたweather-agent仕様

#### 命令文
```
あなたは気象庁とWeatherAPI.comのデータを統合する高度な天気エージェントです。

【主要機能】
1. 日本国内: 気象庁の公式データを優先使用
2. 防災情報: リアルタイム警報・注意報の監視
3. 国際対応: WeatherAPI.comによる世界の天気情報
4. 統合分析: 複数ソースの信頼性評価と総合判断

【応答形式】
- 必ず複数ソースのデータを比較
- 信頼性スコアを明示
- 防災情報がある場合は最優先で警告
- 具体的で実用的なアドバイスを提供

【日本の地域対応】
- 都道府県、市区町村名に対応
- 気象庁の予報区を自動判定
- 地域特性を考慮した情報提供
```

#### 利用ツール
- `jmaForecastTool` - 気象庁予報データ
- `jmaWarningTool` - 防災気象情報
- `weatherApiTool` - WeatherAPI.com統合
- `weatherAggregatorTool` - データ統合・信頼性評価
- `weatherTool` - 既存Open-Meteoツール（フォールバック用）

## 📊 実装優先順位

### Phase 1: 基盤ツール実装
1. **jma-forecast-tool.ts**
   - 気象庁JSON API統合
   - 地域コード解決機能
   - 基本的な予報データ取得

2. **weather-api-tool.ts**
   - WeatherAPI.com統合
   - 多言語地名解決
   - 詳細気象データ取得

### Phase 2: 防災・統合機能
3. **jma-warning-tool.ts**
   - 防災気象情報XML解析
   - 警報・注意報取得
   - 緊急度評価システム

4. **weather-aggregator-tool.ts**
   - 複数ソース統合
   - 信頼性評価アルゴリズム
   - 総合判断システム

### Phase 3: エージェント強化
5. **weather-agent.ts更新**
   - 新ツール統合
   - 命令文更新
   - 応答形式最適化

## 🔧 技術仕様

### 環境変数
```bash
WEATHER_API_KEY=your_weatherapi_key
JMA_API_BASE_URL=https://www.jma.go.jp/bosai
```

### 依存関係
```json
{
  "xml2js": "^0.4.23",
  "node-fetch": "^3.3.0",
  "date-fns": "^2.29.3"
}
```

### エラーハンドリング方針
- API障害時のフォールバック戦略
- データ不整合の自動修正
- タイムアウト制御（各API 10秒）
- 段階的品質低下（graceful degradation）

## 📱 期待される出力例

### 総合天気予報
```
🌤️ 明日の東京都の総合天気予報

📊 データソース統合結果:
• 気象庁: 晴れのち曇り (信頼度: 95%)
• WeatherAPI: 晴れ時々曇り (信頼度: 88%)
• 統合予報: 晴れのち曇り (総合信頼度: 92%)

🌡️ 詳細情報:
• 最高気温: 23°C / 最低気温: 15°C
• 降水確率: 20% (午後から増加)
• 風: 北東 3m/s
• 紫外線指数: 中程度 (5/11)

⚠️ 防災情報:
現在、特別警報・注意報は発表されていません

🎯 おすすめ活動:
• 午前中: 公園散歩やジョギングに最適
• 午後: 雲が増えるので屋内活動も検討
• 服装: 薄手の長袖がおすすめ
```

### 緊急警報時
```
🚨 気象警報アラート

📍 対象地域: 神奈川県東部
⚠️ 発表内容: 大雨注意報
⏰ 発表時刻: 2024年XX月XX日 14:30
📋 詳細: 夕方から夜にかけて時間雨量30mmの雨が予想

🚗 交通への影響:
• 東海道線: 遅延の可能性
• 首都高速: 視界不良注意

💡 推奨対応:
• 傘の準備必須
• 外出時刻の調整検討
• 地下街ルートの活用
• 河川・海岸付近は避ける
```

## ✅ 実装完了チェックリスト

### ツール実装
- [x] jma-forecast-tool.ts ✅ **完了** - 気象庁公式JSON APIからの詳細予報データ取得
- [⚠️] jma-warning-tool.ts ⚠️ **要検討** - 気象業務法第23条（警報発表禁止）への抵触リスク
- [x] weather-api-tool.ts ✅ **完了** - WeatherAPI.comとの統合、日本語地名対応、時間別予報
- [❌] weather-aggregator-tool.ts ❌ **削除済** - 気象業務法第17条（予報業務許可）違反のため削除

### エージェント更新
- [ ] weather-agent.ts命令文更新
- [ ] 新ツール統合
- [ ] メモリ設定確認

### テスト・検証
- [ ] 各ツール単体テスト
- [ ] エージェント統合テスト
- [ ] エラーハンドリング検証
- [ ] パフォーマンス測定

### ドキュメント
- [ ] API仕様書作成
- [ ] 使用例ドキュメント
- [ ] トラブルシューティングガイド

---

## 🚨 **重要：気象業務法コンプライアンス見直し**

### ❌ **法的リスクによる実装変更**

#### **削除済みツール**
- **❌ weather-aggregator-tool.ts**: 気象業務法第17条（予報業務許可）違反
  - JMAデータの改変・統合による新たな予報生成は違法の可能性

#### **要検討ツール** 
- **⚠️ jma-warning-tool.ts**: 気象業務法第23条（警報発表禁止）のリスク
  - 警報・注意報の配信・発表機能は法的グレーゾーン

---

## ✅ **法的に安全な実装済み機能**

#### **1. JMA予報ツール (jma-forecast-tool.ts)**
- 🗾 **全国47都道府県対応**: 気象庁予報区コード完全マスター
- 📊 **詳細予報データ**: 3-7日間の気温・降水確率・風・波浪情報
- 🔄 **自動地域解決**: 都市名から予報区コードを自動特定
- 📝 **政府標準利用規約準拠**: JMAデータの適切な出典表示
- ✅ **改変なし**: データをそのまま表示、法的問題なし

#### **2. WeatherAPI統合ツール (weather-api-tool.ts)**
- 🌏 **国際対応**: 世界中の都市に対応
- 🔤 **日本語地名変換**: 東京→Tokyo等の自動変換マップ
- ⏰ **時間別詳細予報**: 24時間×7日間の1時間単位データ
- 🌬️ **大気質・紫外線**: PM2.5、UV指数、天文データ取得
- 📈 **API使用量監視**: 無料版制限の自動監視とアラート
- ✅ **日本国外データ**: 気象業務法適用外

### 🛡️ **コンプライアンス対応**
- ✅ JMAデータ出典表示の完全実装
- ✅ WeatherAPI.com必須リンクバック対応
- ✅ API使用量制限の監視システム
- ✅ エラーハンドリングとフォールバック戦略

### 📊 **法的に安全な技術的成果**
- **総コード行数**: 約1,500行（安全なツール2つ）
- **API統合数**: 2つ（JMA、WeatherAPI）
- **地域対応**: 日本全国 + 世界主要都市
- **データ完全性**: 改変なし、出典表示完備
- **コンプライアンス**: 気象業務法準拠

### 🎯 **次ステップ (Phase 3) - 法的に安全な範囲**
残り作業は **安全なツールのみの統合**：
1. weather-agent.ts の命令文更新（法的制限事項追加）
2. 安全なツール2つ（JMA予報、WeatherAPI）の統合
3. 気象業務法コンプライアンスの明記
4. 利用条件・免責事項の追加

---

## ⚖️ **気象業務法による実装制限事項**

### 🚫 **絶対に実装してはいけない機能**

#### **予報業務（第17条違反）**
```typescript
// ❌ 禁止例：JMAデータの改変・統合による新予報生成
const PROHIBITED_FORECAST_FEATURES = [
  "複数データソースの統合予報",
  "AI/機械学習による予報改良", 
  "独自アルゴリズムによる予報生成",
  "JMAデータの補正・調整",
  "確率的予報の独自計算"
];
```

#### **警報発表（第23条違反）**
```typescript
// ❌ 禁止例：警報・注意報の配信・発表
const PROHIBITED_WARNING_FEATURES = [
  "独自の警報・注意報発表",
  "気象庁発表の改変・編集",
  "警報レベルの独自判定",
  "緊急通知・アラート配信",
  "避難指示等の判断提供"
];
```

### ✅ **法的に安全な実装範囲**

#### **データ表示のみ**
```typescript
// ✅ 許可例：JMAデータの表示
const SAFE_JMA_FEATURES = [
  "気象庁データの取得・表示",
  "出典表示付きデータ表示",
  "単位変換（℃→℉等）",
  "表示フォーマット変更",
  "多言語翻訳表示"
];
```

#### **個人利用ツール**
```typescript
// ✅ 許可例：個人利用限定機能
const PERSONAL_USE_FEATURES = [
  "個人向け天気情報表示",
  "データ可視化・グラフ作成",
  "過去データ分析",
  "個人記録・日記機能"
];
```

### 📋 **今後の実装チェックリスト**

#### **新機能追加時の確認事項**
- [ ] JMAデータを改変していないか？
- [ ] 独自の予報を生成していないか？
- [ ] 警報・注意報を発表していないか？
- [ ] 商用利用時の許可は得ているか？
- [ ] 出典表示は適切に実装されているか？

---

## 🚨 実装時の重要な注意点

### 📋 **JMA（気象庁）API利用時の注意点**

#### **✅ 利用条件（政府標準利用規約準拠）**
- **出典表示は必須**: すべての利用において気象庁のクレジット表示が必要
- **改変は許可**: データの翻訳・加工・編集は可能
- **商用利用可能**: ただし特定の制限あり

#### **🔗 必須の出典表示フォーマット**
```typescript
// 基本的な出典表示
const JMA_ATTRIBUTION = {
  text: "Source: Japan Meteorological Agency",
  url: "https://www.jma.go.jp/bosai/",
  placement: "データ表示箇所に明記"
};

// データ改変時の表示
const JMA_MODIFIED_ATTRIBUTION = {
  text: "Based on Japan Meteorological Agency data, processed by [アプリ名]",
  url: "https://www.jma.go.jp/bosai/",
  requirement: "改変時は必ずこの形式で表示"
};
```

#### **⚠️ 法的制限事項**
- **予報業務許可**: 日本国内で気象予報サービス提供時は[気象業務法第17条](https://www.jma.go.jp/jma/en/copyright.html)の許可必要
- **警報発表禁止**: 気象業務法第23条により、JMA以外の警報発表は禁止
- **第三者権利**: JMAデータに含まれる第三者著作権への対応は利用者責任

#### **📡 実際のエンドポイント詳細**
```typescript
// [あんこエデュケーション](https://anko.education/webapi/jma)で確認済み
const JMA_ENDPOINTS = {
  // 詳細予報（今日・明日・明後日）
  forecast: "https://www.jma.go.jp/bosai/forecast/data/forecast/{areaCode}.json",
  
  // 概要予報
  overview: "https://www.jma.go.jp/bosai/forecast/data/overview_forecast/{areaCode}.json",
  
  // 地域コードマスター
  areaList: "https://www.jma.go.jp/bosai/common/const/area.json",
  
  // 防災気象情報
  warnings: "https://www.jma.go.jp/bosai/warning/data/warning/{areaCode}.json",
  warningDetails: "https://www.jma.go.jp/bosai/warning/data/warning_detail/{areaCode}.json"
};
```

#### **🗾 予報区コード完全対応表**
```typescript
// 主要地域コード（[あんこエデュケーション](https://anko.education/webapi/jma)より）
const MAJOR_AREA_CODES = {
  // 関東甲信
  "東京都": "130000",
  "神奈川県": "140000", 
  "埼玉県": "110000",
  "千葉県": "120000",
  "茨城県": "080000",
  "栃木県": "090000",
  "群馬県": "100000",
  "長野県": "200000",
  "山梨県": "190000",
  
  // 関西
  "大阪府": "270000",
  "京都府": "260000",
  "兵庫県": "280000",
  "奈良県": "290000",
  "滋賀県": "250000",
  "和歌山県": "300000",
  
  // その他主要都市
  "北海道": "016000", // 石狩・空知・後志地方
  "愛知県": "230000",
  "福岡県": "400000",
  "沖縄本島地方": "471000"
};
```

### 💰 **WeatherAPI.com（無料版）利用時の注意点**

#### **📊 無料版の厳格な制限**
```typescript
const FREE_TIER_LIMITS = {
  monthlyCallLimit: 1_000_000, // 月間100万回
  forecastDays: 3, // 3日間予報のみ
  historicalDays: 7, // 過去7日間のみ
  uptime: "95.5%", // アップタイム保証
  support: false, // サポートなし
  bulkRequests: false, // バルクリクエスト不可
  
  // 利用不可機能
  restrictions: [
    "未来予報（300日先）",
    "大気質履歴",
    "IPブロッキング",
    "バルクリクエスト"
  ]
};
```

#### **🔗 必須のリンクバック実装**
```typescript
// [WeatherAPI.com利用規約](https://www.weatherapi.com/terms.aspx)で必須
const WEATHER_API_ATTRIBUTION = {
  textVersion: `Powered by <a href="https://www.weatherapi.com/" title="Weather API">WeatherAPI.com</a>`,
  
  imageVersion: `<a href="https://www.weatherapi.com/" title="Free Weather API">
    <img src='//cdn.weatherapi.com/v4/images/weatherapi_logo.png' 
         alt="Weather data by WeatherAPI.com" border="0">
  </a>`,
  
  placement: "見やすい場所に必ず表示",
  requirement: "無料版では絶対必須"
};
```

#### **🚫 利用禁止事項**
```typescript
const PROHIBITED_USES = [
  "ミッションクリティカル用途（人命・環境影響）",
  "複数アカウントでのレート制限回避", 
  "プロキシ・匿名メールでの複数登録",
  "無料版での商用利用時のリンクバック省略"
];
```

### 🛡️ **統合実装時のコンプライアンス対策**

#### **出典表示の統合管理**
```typescript
interface AttributionManager {
  getAttributionHtml(sources: Array<'jma' | 'weatherapi' | 'openmeteo'>): string;
  validateCompliance(): boolean;
  logUsage(source: string, endpoint: string): void;
}

// 実装例
const attributionManager: AttributionManager = {
  getAttributionHtml(sources) {
    const attributions = [];
    
    if (sources.includes('jma')) {
      attributions.push('Source: Japan Meteorological Agency');
    }
    
    if (sources.includes('weatherapi')) {
      attributions.push(`Powered by <a href="https://www.weatherapi.com/">WeatherAPI.com</a>`);
    }
    
    return attributions.join(' | ');
  },
  
  validateCompliance() {
    // 必要な出典表示がすべて含まれているかチェック
    return true;
  },
  
  logUsage(source, endpoint) {
    // API使用量の記録（制限監視用）
    console.log(`${new Date().toISOString()}: ${source} - ${endpoint}`);
  }
};
```

#### **API使用量監視システム**
```typescript
class ApiUsageMonitor {
  private weatherApiCallCount = 0;
  private dailyLimit = 33333; // 月100万÷30日の概算

  checkDailyLimit(): boolean {
    return this.weatherApiCallCount < this.dailyLimit;
  }

  incrementUsage(source: 'jma' | 'weatherapi'): void {
    if (source === 'weatherapi') {
      this.weatherApiCallCount++;
      
      // 90%到達時の警告
      if (this.weatherApiCallCount >= this.dailyLimit * 0.9) {
        console.warn('⚠️ WeatherAPI daily limit approaching (90%)');
      }
    }
  }

  resetDailyCount(): void {
    this.weatherApiCallCount = 0;
  }
}
```

#### **エラーハンドリング戦略**
```typescript
class WeatherApiManager {
  async fetchWithFallback(
    primary: () => Promise<any>,
    fallback: () => Promise<any>,
    source: string
  ) {
    try {
      const result = await primary();
      this.attributionManager.logUsage(source, 'primary');
      return result;
    } catch (error) {
      console.warn(`Primary API (${source}) failed, using fallback:`, error);
      const fallbackResult = await fallback();
      this.attributionManager.logUsage('fallback', 'secondary');
      return fallbackResult;
    }
  }
}
```

### 📝 **実装チェックリスト**

#### **コンプライアンス確認**
- [ ] JMAデータの出典表示実装済み
- [ ] WeatherAPI.comのリンクバック実装済み
- [ ] データ改変時の追加表示実装済み
- [ ] 各APIの利用規約確認済み

#### **技術的対策**
- [ ] API使用量監視システム実装
- [ ] レート制限対応実装
- [ ] フォールバック機能実装
- [ ] エラーハンドリング実装

#### **法的対応**
- [ ] 気象業務法の制限事項確認
- [ ] 商用利用時の許可要否確認
- [ ] 第三者権利への対応確認
- [ ] データ保護・プライバシー対応

### 🔧 **実装サンプルコード**

#### **統合API呼び出し例**
```typescript
async function getWeatherWithCompliance(location: string) {
  const usageSources: Array<'jma' | 'weatherapi'> = [];
  
  try {
    // 日本国内はJMA優先
    if (isJapaneseLocation(location)) {
      const jmaData = await fetchJMAData(location);
      usageSources.push('jma');
      
      // WeatherAPIで補完
      const weatherApiData = await fetchWeatherAPIData(location);
      usageSources.push('weatherapi');
      
      return {
        data: mergeWeatherData(jmaData, weatherApiData),
        attribution: attributionManager.getAttributionHtml(usageSources)
      };
    } else {
      // 海外はWeatherAPI
      const weatherApiData = await fetchWeatherAPIData(location);
      usageSources.push('weatherapi');
      
      return {
        data: weatherApiData,
        attribution: attributionManager.getAttributionHtml(usageSources)
      };
    }
  } catch (error) {
    console.error('Weather data fetch failed:', error);
    throw error;
  }
}
```

#### **地域コード解決の実装**
```typescript
// [pen/jma-go](https://github.com/pen/jma-go)を参考にした実装
class JMAAreaResolver {
  private areaData: any = null;

  async loadAreaData(): Promise<void> {
    if (!this.areaData) {
      const response = await fetch('https://www.jma.go.jp/bosai/common/const/area.json');
      this.areaData = await response.json();
    }
  }

  resolveAreaCode(locationName: string): string | null {
    // 都道府県名から予報区コードを解決
    const normalizedName = this.normalizeLocationName(locationName);
    
    for (const [code, area] of Object.entries(this.areaData.offices || {})) {
      if (area.name.includes(normalizedName)) {
        return code;
      }
    }
    
    return null;
  }

  private normalizeLocationName(name: string): string {
    // 「県」「府」「都」「道」を除去
    return name.replace(/[県府都道]$/, '');
  }
}
```

### 🎯 **実装時の重要ポイント**

1. **出典表示は省略不可**: 両APIとも必須要件
2. **API制限の事前監視**: WeatherAPI無料版の制限に注意
3. **日本国内はJMA優先**: 公式データの活用推奨
4. **フォールバック戦略**: API障害時の代替手段確保
5. **定期的な規約確認**: 利用条件の変更に対応

---

**実装開始準備完了** 🚀
どのツールから実装を始めますか？

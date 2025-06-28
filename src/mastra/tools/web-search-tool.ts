// ================================================================
// Google Grounding Web Search Tool
// ------------------------------------------------
// このファイルでは、Google Generative AI (Gemini) の "Google Search
// Grounding" 機能を利用してリアルタイム検索を行い、その結果を
// Mastra のツールとして利用できるようにラップしています。
// 各セクションごとに詳細な解説コメントを追加しました。
// ================================================================

// ------------------------------
// 依存ライブラリのインポート
// ------------------------------
import { createTool } from "@mastra/core/tools"; // Mastra フレームワーク: ツール作成ヘルパ
import { z } from "zod";                         // スキーマバリデーション用ライブラリ
import { GoogleGenerativeAI } from '@google/generative-ai'; // Google Generative AI SDK (Gemini)

/* ---------------------------------------------------------------
 * 1. 現在の日時を "YYYY年MM月DD日 (曜日) HH:MM" 形式で取得するヘルパ
 * ------------------------------------------------------------- */
const getCurrentDateTime = (): string => {
  // JavaScript 標準 API でロケールに合わせた日時文字列を生成
  return new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/* ---------------------------------------------------------------
 * 2. Gemini Search API クライアントのシングルトン生成
 * ------------------------------------------------------------- */
let genai: GoogleGenerativeAI | null = null; // プロセス内で共有されるクライアントインスタンス

function getGenAIClient(): GoogleGenerativeAI {
  // 既に生成済みなら再利用
  if (!genai) {
    // 環境変数から API キーを取得 (どちらか一方が設定されていればOK)
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      // キーが未設定の場合は即座にエラー
      throw new Error("Gemini API key not found. Please set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable.");
    }
    // SDK クライアントを初期化
    genai = new GoogleGenerativeAI(apiKey);
  }
  return genai;
}

/* ---------------------------------------------------------------
 * 3. Google Search Grounding を呼び出して検索を実行する関数
 * ------------------------------------------------------------- */
const searchWithGoogleGrounding = async (query: string): Promise<{
  content: string;   // 生成された回答本文 (Markdown)
  citations: string[]; // 参照元 URL の配列
}> => {
  try {
    // ---- 3-1. ログ出力 (デバッグ用) ----
    console.log(`[Web Search 0] Starting Google Grounding search for: "${query}"`);
    console.log(`[Web Search 0] Calling Google Search Grounding API...`);
    
    // ---- 3-2. 必要情報の準備 ----
    const genaiClient = getGenAIClient();          // Gemini クライアント
    const currentDateTime = getCurrentDateTime();  // 現在日時 (プロンプトに埋め込む)
    
    // ---- 3-3. プロンプト構築 ----
    const prompt = `Please search for information about: ${query}

Current date and time: ${currentDateTime}

Please provide a comprehensive and detailed answer based on your search results. Include:

1. **Key Information**: The most important facts and details
2. **Context**: Background information and context
3. **Current Status**: Latest developments or current state (if applicable)
4. **Sources**: Indicate that information is from recent search results
5. **Details**: Relevant statistics, examples, or specific information

Format your response in a clear, informative manner with proper structure and organization.`;
    
    // ---- 3-4. Gemini API 呼び出し ----
    // 正しいモデル名を使用 (gemini-2.5-flash)
    // Google Search Grounding 機能を有効化
    const model = genaiClient.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} } as any], // Google Search Grounding を有効化 (実験的機能のためany型キャスト)
      generationConfig: {
        temperature: 1.0,               // 出力の多様性調整 (0=決定論的, 1=自由)
        maxOutputTokens: 8192,          // 出力トークン上限
      },
    });

    const generationResult = await model.generateContent(prompt);
    const response = await generationResult.response;
    
    // ---- 3-5. 応答テキストの取り出し ----
    const text = response.text() || '';
    
    // ---- 3-6. Grounding メタデータから引用 URL を抽出 (可能な場合) ----
    const citations: string[] = [];
    try {
      // Google Search Grounding のメタデータから引用を取得
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            citations.push(chunk.web.uri);
          }
        });
      }
    } catch (error) {
      // メタデータが取れなくても致命的ではないので警告だけ出力
      console.log(`[Web Search 0] Note: Could not extract grounding metadata:`, error);
    }

    // ---- 3-7. ログ出力 (完了) ----
    console.log(`[Web Search 0] Successful Google Grounding search completed for: "${query}"`);
    console.log(`[Web Search 0] Response length: ${text.length} characters`);
    
    // ---- 3-8. Markdown に引用リストを追加 ----
    let contentResult = text;
    if (citations.length > 0) {
      const uniqueSources = Array.from(new Set(citations)); // 重複排除（ES5互換）
      contentResult += '\n\n**Sources:**\n' + uniqueSources.map((source, i) => `[${i + 1}] ${source}`).join('\n');
    }
    
    // 呼び出し側 (execute) に返すデータ構造を返却
    return { content: contentResult, citations };
  } catch (error) {
    // ---- 3-9. エラーハンドリング ----
    console.error(`[Web Search 0] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: `申し訳ありません。Google Search Grounding API での検索中にエラーが発生しました: ${errorMessage}`,
      citations: []
    };
  }
};

/* ---------------------------------------------------------------
 * 4. Mastra ツール定義 (createTool)
 * ------------------------------------------------------------- */
export const webSearchTool = createTool({
  id: "web-search-google-grounding", // ツール識別子 (一意)
  description: "Google Search Grounding APIを使用してリアルタイムWeb検索を実行し、グラウンディングメタデータ付きで最新の情報を取得します",
  // 4-1. 入力スキーマ (zod)
  inputSchema: z.object({
    query: z.string().describe("検索クエリ"),           // 必須: 検索ワード
    searchId: z.number().default(0).describe("検索ID（並列検索用）"), // 任意: 並列タスク管理用
  }),
  // 4-2. 出力スキーマ (zod)
  outputSchema: z.object({
    searchId: z.number(),          // 入力と同じ searchId を返却
    query: z.string(),             // 実際に検索したクエリ
    content: z.string(),           // Gemini からの回答 (Markdown)
    citations: z.array(z.string()),// Grounding で得た参照 URL (重複あり)
    success: z.boolean(),          // 成功 / 失敗
    error: z.string().optional(),  // 失敗時のメッセージ (success=false の時のみ)
  }),

  /*
   * 4-3. execute: ツールの実行ロジック
   *   - context には inputSchema で定義したパラメータが入る
   *   - searchWithGoogleGrounding を呼び出し、整形して返却
   */
  execute: async ({ context }) => {
    const { query, searchId } = context; // 分割代入でパラメータ取得
    
    try {
      console.log(`[Web Search ${searchId}] Starting Google Grounding search for: "${query}"`);
      
      // 5. 実際の検索処理
      const { content, citations } = await searchWithGoogleGrounding(query);
      
      console.log(`[Web Search ${searchId}] Search completed, found ${citations.length} grounding sources`);
      
      return {
        searchId,
        query,
        content,
        citations,
        success: true,
      };
      
    } catch (error: any) {
      // 6. エラー時: content にメッセージを格納し success=false
      console.error(`[Web Search ${searchId}] Error:`, error);
      return {
        searchId,
        query,
        content: `検索エラー: "${query}"の検索中に問題が発生しました。エラー詳細: ${error.message}`,
        citations: [],
        success: false,
        error: error.message,
      };
    }
  },
});

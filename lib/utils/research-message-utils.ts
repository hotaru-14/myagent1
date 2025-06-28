// ==========================================
// 研究エージェント メッセージ処理ユーティリティ
// ==========================================

/**
 * 検索計画の構造定義（Phase 2のコンポーネントと整合性を保つ）
 */
export interface SearchPlan {
  topic: string;
  goals: string[];
  queries: string[];
  scope: string;
  estimatedTime: string;
  planId: string;
}

/**
 * 検索進捗データの構造定義
 */
export interface ProgressData {
  currentSearch: number;
  totalSearches: number;
  currentQuery: string;
  completedQueries: string[];
  estimatedTimeRemaining?: string;
  status: 'searching' | 'analyzing' | 'complete';
}

/**
 * 引用情報の構造定義
 */
export interface Citation {
  id: string;
  title: string;
  url: string;
  source: string;
  reliability: 'high' | 'medium' | 'low';
  excerpt?: string;
}

/**
 * レポートメタデータの構造定義
 */
export interface ReportMetadata {
  reliabilityScore: 'high' | 'medium' | 'low';
  citations: Citation[];
  citationCount?: number;
  reportId?: string;
  generatedAt?: string;
}

// ==========================================
// メッセージタイプ判定関数
// ==========================================

/**
 * 検索計画メッセージかどうかを判定
 * @param content メッセージ内容
 * @returns 検索計画メッセージの場合true
 */
export function isResearchPlanMessage(content: string): boolean {
  // 複数の判定条件を組み合わせて精度を向上
  const hasTagMarker = content.includes('[PLAN_ID:') || content.includes('[研究計画:');
  const hasApprovalText = content.includes('研究計画の確認') || content.includes('調査計画の確認');
  const hasGoalsSection = content.includes('調査目標') || content.includes('**調査目標**');
  const hasQueriesSection = content.includes('予定検索クエリ') || content.includes('**予定検索クエリ**');
  
  return hasTagMarker && (hasApprovalText || (hasGoalsSection && hasQueriesSection));
}

/**
 * 検索進捗メッセージかどうかを判定
 * @param content メッセージ内容
 * @returns 検索進捗メッセージの場合true
 */
export function isResearchProgressMessage(content: string): boolean {
  const hasProgressMarker = content.includes('[PROGRESS:') || content.includes('[進捗:');
  const hasProgressText = content.includes('検索進行中') || content.includes('調査進行中');
  const hasCurrentSearch = content.includes('現在の検索') || content.includes('**現在の検索**');
  const hasProgressIndicator = /\(\d+\/\d+\)/.test(content);
  
  return hasProgressMarker && (hasProgressText || hasCurrentSearch || hasProgressIndicator);
}

/**
 * 最終レポートメッセージかどうかを判定
 * @param content メッセージ内容
 * @returns 最終レポートメッセージの場合true
 */
export function isResearchReportMessage(content: string): boolean {
  const hasReportMarker = content.includes('[REPORT:') || content.includes('[レポート:');
  const hasReportTitle = content.includes('調査レポート') || content.includes('研究レポート');
  const hasReportHeader = /^#\s.*レポート/m.test(content);
  const hasInfoSources = content.includes('情報ソース') || content.includes('参考文献');
  const hasReliabilityMarker = content.includes('信頼性レベル');
  
  return hasReportMarker || (hasReportTitle && (hasReportHeader || hasInfoSources || hasReliabilityMarker));
}

// ==========================================
// データ抽出関数
// ==========================================

/**
 * 検索計画データを抽出
 * @param content メッセージ内容
 * @returns 抽出された検索計画データ
 */
export function extractPlanData(content: string): SearchPlan {
  try {
    // プランIDの抽出
    const planIdMatch = content.match(/\[(?:PLAN_ID|研究計画):([^\]]+)\]/);
    const planId = planIdMatch?.[1] || `research_plan_${Date.now()}`;

    // 調査対象の抽出
    const topicMatch = content.match(/\*\*調査対象\*\*:\s*(.+?)(?:\n|$)/);
    const topic = topicMatch?.[1]?.trim() || 'トピック不明';

    // 調査目標の抽出
    const goals = extractListItems(content, '調査目標');

    // 検索クエリの抽出
    const queries = extractListItems(content, '予定検索クエリ');

    // 調査範囲の抽出
    const scopeMatch = content.match(/\*\*調査範囲\*\*:\s*(.+?)(?:\n|$)/);
    const scope = scopeMatch?.[1]?.trim() || '範囲指定なし';

    // 予想時間の抽出
    const timeMatch = content.match(/\*\*(?:予想所要時間|予定時間)\*\*:\s*(.+?)(?:\n|$)/);
    const estimatedTime = timeMatch?.[1]?.trim() || '時間未定';

    return {
      planId,
      topic,
      goals,
      queries,
      scope,
      estimatedTime
    };
  } catch (error) {
    console.error('Plan data extraction failed:', error);
    return getDefaultPlanData();
  }
}

/**
 * 検索進捗データを抽出
 * @param content メッセージ内容
 * @returns 抽出された進捗データ
 */
export function extractProgressData(content: string): ProgressData {
  try {
    // 進捗数値の抽出 (例: 2/5, (2/5))
    const progressMatch = content.match(/[\(\[]?(\d+)\/(\d+)[\)\]]?/);
    const currentSearch = progressMatch ? parseInt(progressMatch[1], 10) : 0;
    const totalSearches = progressMatch ? parseInt(progressMatch[2], 10) : 1;

    // 現在の検索クエリの抽出
    const currentQueryMatch = content.match(/\*\*現在の検索\*\*:\s*[""]?(.+?)[""]?(?:\n|$)/);
    const currentQuery = currentQueryMatch?.[1]?.trim() || '検索中...';

    // 完了済み検索の抽出
    const completedQueries = extractCompletedQueries(content);

    // 残り時間の抽出
    const timeMatch = content.match(/\*\*(?:予定残り時間|残り時間)\*\*:\s*(.+?)(?:\n|$)/);
    const estimatedTimeRemaining = timeMatch?.[1]?.trim();

    // ステータスの判定
    const status = determineProgressStatus(content, currentSearch, totalSearches);

    return {
      currentSearch,
      totalSearches,
      currentQuery,
      completedQueries,
      estimatedTimeRemaining,
      status
    };
  } catch (error) {
    console.error('Progress data extraction failed:', error);
    return getDefaultProgressData();
  }
}

/**
 * レポートから引用情報を抽出
 * @param content メッセージ内容
 * @returns 抽出された引用情報の配列
 */
export function extractCitations(content: string): Citation[] {
  try {
    const citations: Citation[] = [];
    
    // パターン1: 番号付きリスト形式の引用 (例: "1. タイトル - https://example.com")
    const numberedMatches = content.match(/(\d+)\.\s+([^-\n]+)(?:\s*-?\s*)(https?:\/\/[^\s\n]+)/g);
    if (numberedMatches) {
      numberedMatches.forEach((match) => {
        const parts = match.match(/(\d+)\.\s+([^-\n]+)(?:\s*-?\s*)(https?:\/\/[^\s\n]+)/);
        if (parts) {
          citations.push({
            id: `citation_${parts[1]}`,
            title: parts[2].trim(),
            url: parts[3].trim(),
            source: extractDomainFromUrl(parts[3].trim()),
            reliability: 'medium', // デフォルト値
            excerpt: undefined
          });
        }
      });
    }

    // パターン2: 参考文献セクション
    const referencesSection = content.match(/##?\s*(?:参考文献|情報ソース|引用|References)([\s\S]*?)(?=##|$)/i);
    if (referencesSection) {
      const referenceContent = referencesSection[1];
      const referenceLinks = referenceContent.match(/(?:[-*]\s*)?([^:\n]+):\s*(https?:\/\/[^\s\n]+)/g);
      
      if (referenceLinks) {
        referenceLinks.forEach((link, index) => {
          const parts = link.match(/(?:[-*]\s*)?([^:\n]+):\s*(https?:\/\/[^\s\n]+)/);
          if (parts) {
            const id = `ref_${index + 1}`;
            if (!citations.find(c => c.id === id)) {
              citations.push({
                id,
                title: parts[1].trim(),
                url: parts[2].trim(),
                source: extractDomainFromUrl(parts[2].trim()),
                reliability: 'medium',
                excerpt: undefined
              });
            }
          }
        });
      }
    }

    // URLのみの場合も抽出
    const urlMatches = content.match(/https?:\/\/[^\s\n)]+/g);
    if (urlMatches && citations.length === 0) {
      urlMatches.slice(0, 5).forEach((url, index) => { // 最大5件
        citations.push({
          id: `url_${index + 1}`,
          title: `参考リンク ${index + 1}`,
          url: url.trim(),
          source: extractDomainFromUrl(url.trim()),
          reliability: 'medium',
          excerpt: undefined
        });
      });
    }

    return citations;
  } catch (error) {
    console.error('Citation extraction failed:', error);
    return [];
  }
}

/**
 * レポートメタデータを抽出
 * @param content メッセージ内容
 * @returns 抽出されたレポートメタデータ
 */
export function extractReportMetadata(content: string): ReportMetadata {
  try {
    // 信頼性レベルの抽出
    let reliabilityScore: 'high' | 'medium' | 'low' = 'medium';
    if (content.includes('🟢') || content.includes('高信頼性') || content.includes('高')) {
      reliabilityScore = 'high';
    } else if (content.includes('🔴') || content.includes('低信頼性') || content.includes('低') || content.includes('要検証')) {
      reliabilityScore = 'low';
    }

    // 引用情報の抽出
    const citations = extractCitations(content);

    // レポートIDの抽出
    const reportIdMatch = content.match(/\[REPORT:([^\]]+)\]/);
    const reportId = reportIdMatch?.[1];

    return {
      reliabilityScore,
      citations,
      citationCount: citations.length,
      reportId,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Report metadata extraction failed:', error);
    return { 
      reliabilityScore: 'medium',
      citations: [],
      citationCount: 0
    };
  }
}

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * リスト項目を抽出（箇条書きや番号付きリスト）
 * @param content メッセージ内容
 * @param sectionName セクション名
 * @returns 抽出されたリスト項目
 */
function extractListItems(content: string, sectionName: string): string[] {
  try {
    // セクションの開始位置を見つける
    const sectionRegex = new RegExp(`\\*\\*${sectionName}\\*\\*:?\\s*`, 'i');
    const sectionMatch = content.match(sectionRegex);
    
    if (!sectionMatch) return [];

    const startIndex = content.indexOf(sectionMatch[0]) + sectionMatch[0].length;
    const afterSection = content.substring(startIndex);
    
    // 次のセクションまでの内容を取得
    const nextSectionMatch = afterSection.match(/\n\*\*[^*]+\*\*/);
    const sectionContent = nextSectionMatch 
      ? afterSection.substring(0, nextSectionMatch.index)
      : afterSection;

    // 箇条書きまたは番号付きリストを抽出
    const listMatches = sectionContent.match(/^[\s]*[-*\d.]+\s+(.+)$/gm);
    
    if (listMatches) {
      return listMatches.map(item => 
        item.replace(/^[\s]*[-*\d.]+\s+/, '').trim()
      ).filter(item => item.length > 0);
    }

    // リスト形式でない場合は改行で分割
    const lines = sectionContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('**'));
    
    return lines.length > 0 ? lines : ['項目なし'];
  } catch (error) {
    console.error(`Error extracting list items for ${sectionName}:`, error);
    return [];
  }
}

/**
 * 完了済み検索クエリを抽出
 * @param content メッセージ内容
 * @returns 完了済みクエリの配列
 */
function extractCompletedQueries(content: string): string[] {
  try {
    const completedSection = content.match(/\*\*完了済み\*\*:([\s\S]*?)(?:\n\*\*|$)/);
    if (!completedSection) return [];

    const completedContent = completedSection[1];
    const completedMatches = completedContent.match(/✅\s*[""]?(.+?)[""]?(?:\n|$)/g);
    
    if (!completedMatches) return [];

    return completedMatches.map(match => 
      match.replace(/✅\s*[""]?/, '').replace(/[""]?(?:\n|$)/, '').trim()
    );
  } catch (error) {
    console.error('Error extracting completed queries:', error);
    return [];
  }
}

/**
 * 進捗ステータスを判定
 * @param content メッセージ内容
 * @param currentSearch 現在の検索番号
 * @param totalSearches 総検索数
 * @returns 進捗ステータス
 */
function determineProgressStatus(
  content: string, 
  currentSearch: number, 
  totalSearches: number
): 'searching' | 'analyzing' | 'complete' {
  if (content.includes('分析中') || content.includes('レポート作成中')) {
    return 'analyzing';
  }
  
  if (currentSearch >= totalSearches) {
    return 'complete';
  }
  
  return 'searching';
}

/**
 * URLからドメイン名を抽出
 * @param url URL文字列
 * @returns ドメイン名
 */
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    console.error('Invalid URL:', url);
    return 'unknown';
  }
}

// ==========================================
// デフォルト値提供関数
// ==========================================

/**
 * デフォルトの検索計画データを取得
 * @returns デフォルトのSearchPlan
 */
function getDefaultPlanData(): SearchPlan {
  return {
    planId: `fallback_plan_${Date.now()}`,
    topic: 'データ抽出に失敗しました',
    goals: ['メッセージの解析に問題が発生しました'],
    queries: [],
    scope: '不明',
    estimatedTime: '不明'
  };
}

/**
 * デフォルトの進捗データを取得
 * @returns デフォルトのProgressData
 */
function getDefaultProgressData(): ProgressData {
  return {
    currentSearch: 0,
    totalSearches: 1,
    currentQuery: 'データ読み込み中...',
    completedQueries: [],
    status: 'searching'
  };
} 
// ================================================================
// arXiv Search Tool
// ------------------------------------------------
// このファイルでは、arXiv API を利用して学術論文を検索し、
// Mastra のツールとして利用できるようにラップしています。
// ================================================================

// ------------------------------
// 依存ライブラリのインポート
// ------------------------------
import { createTool } from "@mastra/core/tools"; // Mastra フレームワーク: ツール作成ヘルパ
import { z } from "zod";                         // スキーマバリデーション用ライブラリ
import { XMLParser } from 'fast-xml-parser';      // XML パーサー (Atom feed 解析用)

/* ---------------------------------------------------------------
 * 1. arXiv API URL 構築関数
 * ------------------------------------------------------------- */
const buildArxivApiUrl = (params: {
  searchQuery?: string;
  idList?: string;
  start?: number;
  maxResults?: number;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  sortOrder?: 'ascending' | 'descending';
}): string => {
  const baseUrl = 'http://export.arxiv.org/api/query';
  const urlParams = new URLSearchParams();

  if (params.searchQuery) {
    urlParams.append('search_query', params.searchQuery);
  }
  if (params.idList) {
    urlParams.append('id_list', params.idList);
  }
  if (params.start !== undefined) {
    urlParams.append('start', params.start.toString());
  }
  if (params.maxResults !== undefined) {
    urlParams.append('max_results', params.maxResults.toString());
  }
  if (params.sortBy) {
    urlParams.append('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    urlParams.append('sortOrder', params.sortOrder);
  }

  return `${baseUrl}?${urlParams.toString()}`;
};

/* ---------------------------------------------------------------
 * 2. 検索クエリ構築ヘルパー関数
 * ------------------------------------------------------------- */
const buildSearchQuery = (params: {
  title?: string;
  author?: string;
  abstract?: string;
  comment?: string;
  journal?: string;
  category?: string;
  allFields?: string;
}): string => {
  const queryParts: string[] = [];

  if (params.title) {
    queryParts.push(`ti:"${params.title}"`);
  }
  if (params.author) {
    queryParts.push(`au:"${params.author}"`);
  }
  if (params.abstract) {
    queryParts.push(`abs:"${params.abstract}"`);
  }
  if (params.comment) {
    queryParts.push(`co:"${params.comment}"`);
  }
  if (params.journal) {
    queryParts.push(`jr:"${params.journal}"`);
  }
  if (params.category) {
    queryParts.push(`cat:"${params.category}"`);
  }
  if (params.allFields) {
    queryParts.push(`all:"${params.allFields}"`);
  }

  return queryParts.join(' AND ');
};

/* ---------------------------------------------------------------
 * 3. arXiv API から論文データを取得する関数
 * ------------------------------------------------------------- */
const searchArxivPapers = async (params: {
  query?: string;
  author?: string;
  title?: string;
  abstract?: string;
  category?: string;
  maxResults?: number;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
}): Promise<{
  papers: Array<{
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    published: string;
    updated: string;
    categories: string[];
    pdfUrl: string;
    abstractUrl: string;
    comment?: string;
    journalRef?: string;
    doi?: string;
  }>;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
}> => {
  try {
    console.log(`[arXiv Search] Starting search with params:`, params);

    // 検索クエリの構築
    let searchQuery = '';
    if (params.query) {
      searchQuery = params.query;
    } else {
      searchQuery = buildSearchQuery({
        title: params.title,
        author: params.author,
        abstract: params.abstract,
        category: params.category,
      });
    }

    if (!searchQuery) {
      throw new Error('検索クエリが指定されていません');
    }

    // API URL の構築
    const apiUrl = buildArxivApiUrl({
      searchQuery,
      maxResults: params.maxResults || 10,
      start: 0,
      sortBy: params.sortBy || 'relevance',
      sortOrder: 'descending',
    });

    console.log(`[arXiv Search] API URL: ${apiUrl}`);

    // API リクエスト
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`arXiv API request failed: ${response.status} ${response.statusText}`);
    }

    const xmlData = await response.text();
    console.log(`[arXiv Search] Received XML data length: ${xmlData.length}`);

    // XML の解析
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: false,
      parseAttributeValue: false,
    });

    const parsed = parser.parse(xmlData);
    const feed = parsed.feed;

    if (!feed) {
      throw new Error('Invalid XML response from arXiv API');
    }

    // フィードメタデータの取得
    const totalResults = parseInt(feed['opensearch:totalResults'] || '0', 10);
    const startIndex = parseInt(feed['opensearch:startIndex'] || '0', 10);
    const itemsPerPage = parseInt(feed['opensearch:itemsPerPage'] || '0', 10);

    // エントリーの解析
    const entries = Array.isArray(feed.entry) ? feed.entry : (feed.entry ? [feed.entry] : []);
    
    const papers = entries.map((entry: any) => {
      // ID の抽出 (http://arxiv.org/abs/xxxx 形式)
      const id = entry.id?.replace('http://arxiv.org/abs/', '') || '';
      
      // 著者の抽出
      const authors: string[] = [];
      if (entry.author) {
        const authorList = Array.isArray(entry.author) ? entry.author : [entry.author];
        authorList.forEach((author: any) => {
          if (author.name) {
            authors.push(author.name);
          }
        });
      }

      // カテゴリーの抽出
      const categories: string[] = [];
      if (entry.category) {
        const categoryList = Array.isArray(entry.category) ? entry.category : [entry.category];
        categoryList.forEach((cat: any) => {
          if (cat['@_term']) {
            categories.push(cat['@_term']);
          }
        });
      }

      // リンクの抽出
      let pdfUrl = '';
      let abstractUrl = '';
      if (entry.link) {
        const linkList = Array.isArray(entry.link) ? entry.link : [entry.link];
        linkList.forEach((link: any) => {
          if (link['@_type'] === 'application/pdf') {
            pdfUrl = link['@_href'] || '';
          } else if (link['@_type'] === 'text/html') {
            abstractUrl = link['@_href'] || '';
          }
        });
      }

      return {
        id,
        title: entry.title || '',
        authors,
        abstract: entry.summary || '',
        published: entry.published || '',
        updated: entry.updated || '',
        categories,
        pdfUrl,
        abstractUrl,
        comment: entry['arxiv:comment'] || undefined,
        journalRef: entry['arxiv:journal_ref'] || undefined,
        doi: entry['arxiv:doi'] || undefined,
      };
    });

    console.log(`[arXiv Search] Found ${papers.length} papers`);

    return {
      papers,
      totalResults,
      startIndex,
      itemsPerPage,
    };

  } catch (error) {
    console.error(`[arXiv Search] Error:`, error);
    throw error;
  }
};

/* ---------------------------------------------------------------
 * 4. Mastra ツール定義 (createTool)
 * ------------------------------------------------------------- */
export const arxivSearchTool = createTool({
  id: "arxiv-search",
  description: "arXiv APIを使用して学術論文を検索し、論文の詳細情報を取得します",
  
  // 4-1. 入力スキーマ
  inputSchema: z.object({
    query: z.string().optional().describe("自由形式の検索クエリ"),
    author: z.string().optional().describe("著者名での検索"),
    title: z.string().optional().describe("タイトルでの検索"),
    abstract: z.string().optional().describe("要約での検索"), 
    category: z.string().optional().describe("カテゴリでの検索 (例: cs.AI, physics.gen-ph)"),
    maxResults: z.number().default(10).describe("取得する最大論文数 (デフォルト: 10)"),
    sortBy: z.enum(['relevance', 'lastUpdatedDate', 'submittedDate']).default('relevance').describe("ソート方法"),
  }),

  // 4-2. 出力スキーマ
  outputSchema: z.object({
    papers: z.array(z.object({
      id: z.string(),
      title: z.string(),
      authors: z.array(z.string()),
      abstract: z.string(),
      published: z.string(),
      updated: z.string(),
      categories: z.array(z.string()),
      pdfUrl: z.string(),
      abstractUrl: z.string(),
      comment: z.string().optional(),
      journalRef: z.string().optional(),
      doi: z.string().optional(),
    })),
    totalResults: z.number(),
    startIndex: z.number(),
    itemsPerPage: z.number(),
    success: z.boolean(),
    error: z.string().optional(),
  }),

  // 4-3. execute: ツールの実行ロジック
  execute: async ({ context }) => {
    try {
      console.log(`[arXiv Search] Starting search with context:`, context);
      
      const result = await searchArxivPapers(context);
      
      console.log(`[arXiv Search] Search completed, found ${result.papers.length} papers`);
      
      return {
        ...result,
        success: true,
      };
      
    } catch (error: any) {
      console.error(`[arXiv Search] Error:`, error);
      return {
        papers: [],
        totalResults: 0,
        startIndex: 0,
        itemsPerPage: 0,
        success: false,
        error: error.message,
      };
    }
  },
}); 
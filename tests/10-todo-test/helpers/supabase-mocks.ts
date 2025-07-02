/**
 * Supabase モック関数とヘルパー
 * テストで共通利用するモック機能を提供
 */

// 基本的なSupabaseレスポンス型
export interface MockSupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// モック関数群
export const createMockSupabaseClient = () => {
  const mockRpc = jest.fn();
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockDelete = jest.fn();
  const mockUpdate = jest.fn();
  const mockGetUser = jest.fn();

  const mockQueryBuilder = {
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  };

  const mockClient = {
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn(() => mockQueryBuilder),
    rpc: mockRpc,
  };

  return {
    client: mockClient,
    mocks: {
      rpc: mockRpc,
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
      update: mockUpdate,
      getUser: mockGetUser,
      queryBuilder: mockQueryBuilder,
    },
  };
};

// 成功レスポンスの作成
export const createSuccessResponse = <T>(data: T): MockSupabaseResponse<T> => ({
  data,
  error: null,
});

// エラーレスポンスの作成
export const createErrorResponse = <T>(error: string | Error): MockSupabaseResponse<T> => ({
  data: null,
  error: typeof error === 'string' ? new Error(error) : error,
});

// 空の会話削除テスト用のデータ
export const mockConversationData = {
  // 通常の会話
  validConversation: {
    id: 'conv-valid-123',
    title: 'Valid Conversation',
    user_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    messages: [
      { content: 'Hello', created_at: '2024-01-01T00:00:00Z' }
    ],
  },
  
  // 空の会話
  emptyConversation: {
    id: 'conv-empty-123',
    title: 'Empty Conversation',
    user_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    messages: [],
  },
  
  // ユーザー情報
  mockUser: {
    id: 'user-123',
    email: 'test@example.com',
  },
};

// タイマーモック用のヘルパー
export const withFakeTimers = (testFn: () => void | Promise<void>) => {
  return async () => {
    jest.useFakeTimers();
    try {
      await testFn();
    } finally {
      jest.useRealTimers();
    }
  };
};

// 非同期処理のテスト用ヘルパー
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0)); 
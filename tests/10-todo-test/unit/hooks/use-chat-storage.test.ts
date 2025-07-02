import { renderHook, act } from '@testing-library/react';
import { useChatStorage } from '@/lib/hooks/use-chat-storage';

// Supabaseクライアントのモック
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockUpdate = jest.fn();
const mockRpc = jest.fn();
const mockGetUser = jest.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser
  },
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  })),
  rpc: mockRpc
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// 空会話クリーンアップフックのモック
jest.mock('@/lib/hooks/use-empty-conversation-cleanup', () => ({
  useEmptyConversationCleanup: () => ({
    manualCleanup: jest.fn().mockResolvedValue(2),
    lastCleanupTime: Date.now(),
    isEnabled: true
  })
}));

describe('useChatStorage', () => {
  const mockUser = { id: 'user-123' };
  const mockConversations = [
    {
      id: 'conv-1',
      title: 'Test Conversation 1',
      user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      messages: [
        { content: 'Hello', created_at: '2024-01-01T00:00:00Z' }
      ]
    },
    {
      id: 'conv-2',
      title: 'Test Conversation 2',
      user_id: 'user-123',
      created_at: '2024-01-01T01:00:00Z',
      updated_at: '2024-01-01T01:00:00Z',
      messages: [
        { content: 'Hi there', created_at: '2024-01-01T01:00:00Z' }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useChatStorage());
    
    expect(result.current.currentConversation).toBeNull();
    expect(result.current.conversations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load conversations with filtering', async () => {
    mockRpc.mockResolvedValue({ data: 2, error: null }); // cleanup returns 2 deleted
    mockSelect.mockResolvedValue({ data: mockConversations, error: null });
    
    const { result } = renderHook(() => useChatStorage());
    
    await act(async () => {
      const conversations = await result.current.loadConversations();
      expect(conversations).toHaveLength(2);
      expect(conversations[0].message_count).toBe(1);
    });
    
    // クリーンアップが呼ばれることを確認
    expect(mockRpc).toHaveBeenCalledWith('cleanup_empty_conversations');
  });

  it('should filter out conversations with no messages', async () => {
    const conversationsWithEmpty = [
      ...mockConversations,
      {
        id: 'conv-empty',
        title: 'Empty Conversation',
        user_id: 'user-123',
        messages: [] // 空のメッセージ
      }
    ];
    
    mockRpc.mockResolvedValue({ data: 1, error: null });
    mockSelect.mockResolvedValue({ data: conversationsWithEmpty, error: null });
    
    const { result } = renderHook(() => useChatStorage());
    
    await act(async () => {
      const conversations = await result.current.loadConversations();
      // 空の会話は除外される
      expect(conversations).toHaveLength(2);
      expect(conversations.find(c => c.id === 'conv-empty')).toBeUndefined();
    });
  });

  it('should handle authentication errors', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    
    const { result } = renderHook(() => useChatStorage());
    
    await act(async () => {
      const conversations = await result.current.loadConversations();
      expect(conversations).toEqual([]);
      expect(result.current.error).toContain('認証されていません');
    });
  });

  it('should delete conversation and trigger cleanup', async () => {
    mockDelete.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ data: 1, error: null });
    mockSelect.mockResolvedValue({ data: [], error: null });
    
    const { result } = renderHook(() => useChatStorage());
    
    await act(async () => {
      const success = await result.current.deleteConversation('conv-1');
      expect(success).toBe(true);
    });
    
    // 削除とクリーンアップが呼ばれることを確認
    expect(mockDelete).toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith('cleanup_empty_conversations');
  });

  it('should ensure conversation exists with timeout monitoring', async () => {
    const conversationId = 'new-conv-123';
    mockRpc.mockResolvedValue({ data: conversationId, error: null });
    
    // タイマーをモック
    jest.useFakeTimers();
    const { result } = renderHook(() => useChatStorage());
    
    await act(async () => {
      const id = await result.current.ensureConversationExists('Test Title');
      expect(id).toBe(conversationId);
    });
    
    // 5分後のタイムアウトが設定されることを確認
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    
    jest.useRealTimers();
  });

  it('should expose manual cleanup function', () => {
    const { result } = renderHook(() => useChatStorage());
    
    expect(typeof result.current.manualCleanup).toBe('function');
  });
}); 
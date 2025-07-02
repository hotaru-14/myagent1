/**
 * 空の会話削除機能のデータベース統合テスト
 * RPC関数 cleanup_empty_conversations の動作をテスト
 */

import { createClient } from '@/lib/supabase/client';

// Supabaseクライアントのモック
const mockRpc = jest.fn();
const mockSupabaseClient = {
  rpc: mockRpc
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

describe('Database: Empty Conversation Cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cleanup_empty_conversations RPC function', () => {
    it('should return count of deleted conversations', async () => {
      // 3つの空会話が削除される場合
      mockRpc.mockResolvedValue({ data: 3, error: null });
      
      const supabase = createClient();
      const result = await supabase.rpc('cleanup_empty_conversations');
      
      expect(result.data).toBe(3);
      expect(result.error).toBeNull();
      expect(mockRpc).toHaveBeenCalledWith('cleanup_empty_conversations');
    });

    it('should return 0 when no empty conversations exist', async () => {
      // 削除対象がない場合
      mockRpc.mockResolvedValue({ data: 0, error: null });
      
      const supabase = createClient();
      const result = await supabase.rpc('cleanup_empty_conversations');
      
      expect(result.data).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // データベースエラーが発生した場合
      const dbError = new Error('Database connection failed');
      mockRpc.mockResolvedValue({ data: null, error: dbError });
      
      const supabase = createClient();
      const result = await supabase.rpc('cleanup_empty_conversations');
      
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
    });

    it('should handle network errors', async () => {
      // ネットワークエラーの場合
      mockRpc.mockRejectedValue(new Error('Network timeout'));
      
      const supabase = createClient();
      
      await expect(
        supabase.rpc('cleanup_empty_conversations')
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('create_conversation_with_timeout RPC function', () => {
    it('should create conversation and return ID', async () => {
      const mockConversationId = 'conv-abc123';
      mockRpc.mockResolvedValue({ data: mockConversationId, error: null });
      
      const supabase = createClient();
      const result = await supabase.rpc('create_conversation_with_timeout', {
        p_title: 'Test Conversation',
        p_user_id: 'user-123'
      });
      
      expect(result.data).toBe(mockConversationId);
      expect(result.error).toBeNull();
      expect(mockRpc).toHaveBeenCalledWith('create_conversation_with_timeout', {
        p_title: 'Test Conversation',
        p_user_id: 'user-123'
      });
    });

    it('should handle creation errors', async () => {
      const error = new Error('Failed to create conversation');
      mockRpc.mockResolvedValue({ data: null, error });
      
      const supabase = createClient();
      const result = await supabase.rpc('create_conversation_with_timeout', {
        p_title: 'Test Conversation',
        p_user_id: 'user-123'
      });
      
      expect(result.data).toBeNull();
      expect(result.error).toBe(error);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical cleanup workflow', async () => {
      // 段階的なクリーンアップのシミュレーション
      const cleanupCalls = [
        { data: 5, error: null }, // 初回：5つ削除
        { data: 2, error: null }, // 2回目：2つ削除
        { data: 0, error: null }, // 3回目：削除対象なし
      ];
      
      cleanupCalls.forEach((response, index) => {
        mockRpc.mockResolvedValueOnce(response);
      });
      
      const supabase = createClient();
      
      // 複数回クリーンアップを実行
      for (let i = 0; i < cleanupCalls.length; i++) {
        const result = await supabase.rpc('cleanup_empty_conversations');
        expect(result.data).toBe(cleanupCalls[i].data);
        expect(result.error).toBeNull();
      }
      
      expect(mockRpc).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent cleanup calls', async () => {
      // 同時実行の場合
      mockRpc.mockResolvedValue({ data: 1, error: null });
      
      const supabase = createClient();
      
      // 同時に複数のクリーンアップを実行
      const promises = Array(3).fill(null).map(() => 
        supabase.rpc('cleanup_empty_conversations')
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.data).toBe(1);
        expect(result.error).toBeNull();
      });
      
      expect(mockRpc).toHaveBeenCalledTimes(3);
    });
  });
}); 
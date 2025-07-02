import { renderHook, act } from '@testing-library/react';
import { useEmptyConversationCleanup } from '@/lib/hooks/use-empty-conversation-cleanup';

// Supabaseクライアントのモック
const mockRpc = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    rpc: mockRpc,
  })),
}));

describe('useEmptyConversationCleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should be enabled by default', () => {
    const { result } = renderHook(() => useEmptyConversationCleanup());
    
    expect(result.current.isEnabled).toBe(true);
  });

  it('should be disabled when enabled=false', () => {
    const { result } = renderHook(() => 
      useEmptyConversationCleanup({ enabled: false })
    );
    
    expect(result.current.isEnabled).toBe(false);
  });

  it('should execute manual cleanup successfully', async () => {
    mockRpc.mockResolvedValue({ data: 3, error: null });
    
    const { result } = renderHook(() => useEmptyConversationCleanup());
    
    await act(async () => {
      const deletedCount = await result.current.manualCleanup();
      expect(deletedCount).toBe(3);
    });
    
    expect(mockRpc).toHaveBeenCalledWith('cleanup_empty_conversations');
  });

  it('should handle cleanup errors gracefully', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('Database error') });
    
    const { result } = renderHook(() => useEmptyConversationCleanup());
    
    await act(async () => {
      const deletedCount = await result.current.manualCleanup();
      expect(deletedCount).toBe(0);
    });
  });

  it('should call onCleanup callback when cleanup succeeds', async () => {
    mockRpc.mockResolvedValue({ data: 2, error: null });
    const onCleanupMock = jest.fn();
    
    const { result } = renderHook(() => 
      useEmptyConversationCleanup({ onCleanup: onCleanupMock })
    );
    
    await act(async () => {
      await result.current.manualCleanup();
    });
    
    expect(onCleanupMock).toHaveBeenCalledWith(2);
  });

  it('should not call onCleanup callback when no conversations deleted', async () => {
    mockRpc.mockResolvedValue({ data: 0, error: null });
    const onCleanupMock = jest.fn();
    
    const { result } = renderHook(() => 
      useEmptyConversationCleanup({ onCleanup: onCleanupMock })
    );
    
    await act(async () => {
      await result.current.manualCleanup();
    });
    
    expect(onCleanupMock).not.toHaveBeenCalled();
  });
}); 
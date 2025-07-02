"use client";

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseEmptyConversationCleanupProps {
  enabled?: boolean;
  intervalMinutes?: number;
  onCleanup?: (deletedCount: number) => void;
}

export function useEmptyConversationCleanup({
  enabled = true,
  intervalMinutes = 5, // デフォルト5分間隔
  onCleanup
}: UseEmptyConversationCleanupProps = {}) {
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCleanupRef = useRef<number>(0);

  // 空会話クリーンアップ実行
  const executeCleanup = useCallback(async (): Promise<number> => {
    try {
      console.log('🧹 [Empty Conversation Cleanup] Starting cleanup...');
      
      const { data, error } = await supabase.rpc('cleanup_empty_conversations');
      
      if (error) {
        console.error('❌ [Empty Conversation Cleanup] Error:', error);
        throw error;
      }
      
      const deletedCount = data || 0;
      
      if (deletedCount > 0) {
        console.log(`✅ [Empty Conversation Cleanup] Cleaned up ${deletedCount} empty conversations`);
        onCleanup?.(deletedCount);
      } else {
        console.log('✨ [Empty Conversation Cleanup] No empty conversations found');
      }
      
      lastCleanupRef.current = Date.now();
      return deletedCount;
    } catch (error) {
      console.error('❌ [Empty Conversation Cleanup] Failed:', error);
      return 0;
    }
  }, [supabase, onCleanup]);

  // 手動クリーンアップ（即座実行）
  const manualCleanup = useCallback(async (): Promise<number> => {
    console.log('🧹 [Empty Conversation Cleanup] Manual cleanup triggered');
    return executeCleanup();
  }, [executeCleanup]);

  // 定期実行の設定
  useEffect(() => {
    if (!enabled) {
      console.log('⏸️ [Empty Conversation Cleanup] Disabled');
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    
    console.log(`⏰ [Empty Conversation Cleanup] Setting up interval: ${intervalMinutes} minutes`);
    
    // 初回実行（1秒後）
    const initialTimeout = setTimeout(() => {
      executeCleanup();
    }, 1000);

    // 定期実行
    intervalRef.current = setInterval(() => {
      executeCleanup();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearTimeout(initialTimeout);
      console.log('🛑 [Empty Conversation Cleanup] Cleanup interval stopped');
    };
  }, [enabled, intervalMinutes, executeCleanup]);

  // ページが非アクティブになった時のクリーンアップ
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        // ページが再びアクティブになった時、最後のクリーンアップから5分以上経過していたら実行
        const timeSinceLastCleanup = Date.now() - lastCleanupRef.current;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceLastCleanup > fiveMinutes) {
          console.log('👁️ [Empty Conversation Cleanup] Page visible again, running cleanup');
          executeCleanup();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, executeCleanup]);

  // ページ離脱時のクリーンアップ
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (enabled) {
        // 非同期だが、ベストエフォートでクリーンアップを試行
        executeCleanup();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, executeCleanup]);

  return {
    manualCleanup,
    lastCleanupTime: lastCleanupRef.current,
    isEnabled: enabled
  };
} 
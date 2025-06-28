"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SidebarState, SidebarConfig } from '@/lib/types/sidebar';

const DEFAULT_CONFIG: SidebarConfig = {
  position: 'left',
  preferences: {
    defaultVisible: true,
    width: 320,
    animationDuration: 300,
    autoHideOnMobile: true,
  },
  storageKey: 'chat-sidebar-visible',
};

export function useSidebarState(config: Partial<SidebarConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { preferences, storageKey } = finalConfig;
  
  // アニメーション制御用のref
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 初期状態の設定
  const getInitialState = useCallback((): SidebarState => {
    // SSR対応：サーバーサイドでは常にfalseを返す
    if (typeof window === 'undefined') {
      return {
        isVisible: false,
        isAnimating: false,
        width: preferences.width,
        isMobile: false,
      };
    }

    // ローカルストレージから設定を読み込み
    const saved = localStorage.getItem(storageKey);
    let isVisible = preferences.defaultVisible;
    
    if (saved !== null) {
      isVisible = saved === 'true';
    }

    // モバイル検知
    const isMobile = window.innerWidth < 768;
    
    // モバイルでの自動非表示
    if (isMobile && preferences.autoHideOnMobile) {
      isVisible = false;
    }

    return {
      isVisible,
      isAnimating: false,
      width: preferences.width,
      isMobile,
    };
  }, [preferences, storageKey]);

  const [state, setState] = useState<SidebarState>(getInitialState);

  // ローカルストレージに状態を保存
  const saveToStorage = useCallback((visible: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(visible));
    }
  }, [storageKey]);

  // レスポンシブ対応：画面サイズ変更の監視
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      
      setState(prev => {
        // モバイルに変わった場合、自動非表示設定があれば隠す
        if (isMobile && !prev.isMobile && preferences.autoHideOnMobile) {
          return {
            ...prev,
            isMobile,
            isVisible: false,
          };
        }
        
        return {
          ...prev,
          isMobile,
        };
      });
    };

    window.addEventListener('resize', handleResize);
    
    // 初期化時にも実行
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [preferences.autoHideOnMobile]);

  // サイドバーの切り替え
  const toggleSidebar = useCallback(() => {
    setState(prev => {
      if (prev.isAnimating) return prev; // アニメーション中は無視

      const newVisible = !prev.isVisible;
      
      // ローカルストレージに保存
      saveToStorage(newVisible);

      return {
        ...prev,
        isVisible: newVisible,
        isAnimating: true,
      };
    });

    // アニメーション終了後にisAnimatingをfalseに
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isAnimating: false,
      }));
    }, preferences.animationDuration);
  }, [saveToStorage, preferences.animationDuration]);

  // キーボードショートカット（Ctrl + \）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '\\') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar]);

  // サイドバーを表示
  const showSidebar = useCallback(() => {
    setState(prev => {
      if (prev.isVisible || prev.isAnimating) return prev;

      saveToStorage(true);

      return {
        ...prev,
        isVisible: true,
        isAnimating: true,
      };
    });

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isAnimating: false,
      }));
    }, preferences.animationDuration);
  }, [saveToStorage, preferences.animationDuration]);

  // サイドバーを隠す
  const hideSidebar = useCallback(() => {
    setState(prev => {
      if (!prev.isVisible || prev.isAnimating) return prev;

      saveToStorage(false);

      return {
        ...prev,
        isVisible: false,
        isAnimating: true,
      };
    });

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isAnimating: false,
      }));
    }, preferences.animationDuration);
  }, [saveToStorage, preferences.animationDuration]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    toggleSidebar,
    showSidebar,
    hideSidebar,
    config: finalConfig,
  };
} 
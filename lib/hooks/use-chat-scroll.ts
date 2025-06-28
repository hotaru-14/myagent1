"use client";

import { useRef, useEffect, MutableRefObject } from 'react';

/**
 * チャットメッセージの自動スクロール機能を提供するカスタムフック
 * 
 * @param dep - スクロールをトリガーする依存値（通常はメッセージ配列やローディング状態）
 * @param options - スクロール動作のオプション
 * @returns スクロールコンテナに設定するref
 * 
 * 使用例:
 * const ref = useChatScroll(messages, { 
 *   behavior: 'smooth', 
 *   block: 'end' 
 * });
 * <div ref={ref}>...</div>
 */
export function useChatScroll<T>(
  dep: T,
  options: boolean | ScrollIntoViewOptions = { 
    behavior: 'smooth', 
    block: 'end' 
  }
): MutableRefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      // ScrollAreaコンポーネント（Radix UI）の場合、実際のスクロール要素は子要素
      const scrollContainer = ref.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      
      if (scrollContainer) {
        // Radix UIのScrollAreaの場合
        if (typeof options === 'boolean') {
          // boolean値の場合：false = 下端にスクロール, true = 上端にスクロール
          if (!options) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          } else {
            scrollContainer.scrollTop = 0;
          }
        } else {
          // ScrollIntoViewOptionsの場合、最後の子要素にスクロール
          const lastChild = scrollContainer.lastElementChild;
          if (lastChild) {
            lastChild.scrollIntoView(options);
          }
        }
      } else {
        // 通常のdiv要素の場合
        if (typeof options === 'boolean') {
          if (!options) {
            ref.current.scrollTop = ref.current.scrollHeight;
          } else {
            ref.current.scrollTop = 0;
          }
        } else {
          ref.current.scrollIntoView(options);
        }
      }
    }
  }, [dep, options]);

  return ref;
}

/**
 * ユーザーが手動でスクロールしている時は自動スクロールを無効にする
 * より高度な自動スクロール機能を提供するフック
 * 
 * @param dep - スクロールをトリガーする依存値
 * @param threshold - 底部からの距離の閾値（px）。この範囲内にいる時のみ自動スクロール
 * @returns スクロールコンテナに設定するrefと手動制御関数
 */
export function useSmartChatScroll<T>(
  dep: T,
  threshold = 100
): {
  ref: MutableRefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
  isNearBottom: boolean;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = () => {
    if (ref.current) {
      const scrollContainer = ref.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      } else {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
      isNearBottomRef.current = true;
    }
  };

  const checkIfNearBottom = () => {
    if (ref.current) {
      const scrollContainer = ref.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      const element = scrollContainer || ref.current;
      
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      isNearBottomRef.current = distanceFromBottom <= threshold;
    }
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const scrollContainer = element.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    const targetElement = scrollContainer || element;

    // スクロール位置の監視
    const handleScroll = () => {
      checkIfNearBottom();
    };

    targetElement.addEventListener('scroll', handleScroll);

    // 依存値が変更された時、ユーザーが底部近くにいる場合のみ自動スクロール
    if (isNearBottomRef.current) {
      scrollToBottom();
    }

    return () => {
      targetElement.removeEventListener('scroll', handleScroll);
    };
  }, [dep, threshold]);

  return {
    ref,
    scrollToBottom,
    isNearBottom: isNearBottomRef.current
  };
} 
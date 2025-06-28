// ==========================================
// サイドバー関連の型定義
// ==========================================

export interface SidebarState {
  /** サイドバーの表示状態 */
  isVisible: boolean;
  /** アニメーション実行中かどうか */
  isAnimating: boolean;
  /** サイドバーの幅（px） */
  width: number;
  /** モバイル表示かどうか */
  isMobile: boolean;
}

export interface SidebarPreferences {
  /** デフォルトの表示状態 */
  defaultVisible: boolean;
  /** サイドバーの幅 */
  width: number;
  /** アニメーション時間（ms） */
  animationDuration: number;
  /** モバイルでの自動非表示 */
  autoHideOnMobile: boolean;
}

export interface SidebarAnimationState {
  /** 現在のアニメーション状態 */
  status: 'idle' | 'expanding' | 'collapsing';
  /** アニメーション開始時刻 */
  startTime: number;
  /** アニメーション継続時間 */
  duration: number;
}

export type SidebarPosition = 'left' | 'right';

export interface SidebarConfig {
  /** サイドバーの位置 */
  position: SidebarPosition;
  /** 設定 */
  preferences: SidebarPreferences;
  /** ローカルストレージのキー */
  storageKey: string;
} 
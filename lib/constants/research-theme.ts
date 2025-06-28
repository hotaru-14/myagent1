// ==========================================
// 研究エージェント専用テーマカラーシステム
// ==========================================

export interface ResearchThemeColors {
  // 基本色
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryMuted: string;
  
  // セカンダリ色
  secondary: string;
  secondaryHover: string;
  secondaryMuted: string;
  
  // 背景色
  background: string;
  backgroundSecondary: string;
  backgroundMuted: string;
  
  // 境界線
  border: string;
  borderHover: string;
  
  // テキスト
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // 状態色
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // 進捗・アニメーション色
  progress: string;
  progressTrack: string;
  glow: string;
  accent: string;
}

// ==========================================
// ライトモード紫色テーマ
// ==========================================
export const LIGHT_RESEARCH_THEME: ResearchThemeColors = {
  // 基本色 - 紫のバリエーション
  primary: '#8B5CF6',           // purple-500
  primaryHover: '#7C3AED',      // purple-600
  primaryActive: '#6D28D9',     // purple-700
  primaryMuted: '#A78BFA',      // purple-400
  
  // セカンダリ色
  secondary: '#C4B5FD',         // purple-300
  secondaryHover: '#DDD6FE',    // purple-200
  secondaryMuted: '#EDE9FE',    // purple-100
  
  // 背景色
  background: '#FAF5FF',        // purple-50
  backgroundSecondary: '#F3E8FF', // purple-100
  backgroundMuted: '#E9D5FF',   // purple-200
  
  // 境界線
  border: '#D8B4FE',           // purple-300
  borderHover: '#C084FC',      // purple-400
  
  // テキスト
  text: '#581C87',             // purple-900
  textSecondary: '#6B21A8',    // purple-800
  textMuted: '#7C2D92',        // purple-700
  
  // 状態色
  success: '#059669',          // emerald-600
  warning: '#D97706',          // amber-600
  error: '#DC2626',            // red-600
  info: '#2563EB',             // blue-600
  
  // 進捗・アニメーション色
  progress: '#8B5CF6',         // purple-500
  progressTrack: '#E9D5FF',    // purple-200
  glow: '#A78BFA',             // purple-400 (半透明で使用)
  accent: '#F59E0B',           // amber-500 (アクセント)
};

// ==========================================
// ダークモード紫色テーマ
// ==========================================
export const DARK_RESEARCH_THEME: ResearchThemeColors = {
  // 基本色
  primary: '#A78BFA',          // purple-400
  primaryHover: '#8B5CF6',     // purple-500
  primaryActive: '#7C3AED',    // purple-600
  primaryMuted: '#6D28D9',     // purple-700
  
  // セカンダリ色
  secondary: '#6B21A8',        // purple-800
  secondaryHover: '#581C87',   // purple-900
  secondaryMuted: '#4C1D95',   // purple-950
  
  // 背景色
  background: '#1E1B2E',       // カスタム紫暗色
  backgroundSecondary: '#2D1B69', // purple-950変更
  backgroundMuted: '#4C1D95',  // purple-950
  
  // 境界線
  border: '#6B21A8',          // purple-800
  borderHover: '#7C3AED',     // purple-600
  
  // テキスト
  text: '#E9D5FF',            // purple-200
  textSecondary: '#DDD6FE',   // purple-300
  textMuted: '#C4B5FD',       // purple-400
  
  // 状態色
  success: '#10B981',         // emerald-500
  warning: '#F59E0B',         // amber-500
  error: '#EF4444',           // red-500
  info: '#3B82F6',            // blue-500
  
  // 進捗・アニメーション色
  progress: '#A78BFA',        // purple-400
  progressTrack: '#4C1D95',   // purple-950
  glow: '#C4B5FD',            // purple-300 (半透明で使用)
  accent: '#F59E0B',          // amber-500
};

// ==========================================
// グラデーション定義
// ==========================================
export const RESEARCH_GRADIENTS = {
  // メイングラデーション
  primary: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C4B5FD 100%)',
  primaryReverse: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%)',
  
  // 背景グラデーション
  background: 'linear-gradient(180deg, #FAF5FF 0%, #F3E8FF 100%)',
  backgroundDark: 'linear-gradient(180deg, #1E1B2E 0%, #2D1B69 100%)',
  
  // 進捗グラデーション
  progress: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
  
  // アニメーション用グラデーション
  shimmer: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)',
  glow: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
};

// ==========================================
// 影定義
// ==========================================
export const RESEARCH_SHADOWS = {
  small: '0 1px 2px 0 rgba(139, 92, 246, 0.1)',
  medium: '0 4px 6px -1px rgba(139, 92, 246, 0.1), 0 2px 4px -1px rgba(139, 92, 246, 0.06)',
  large: '0 10px 15px -3px rgba(139, 92, 246, 0.1), 0 4px 6px -2px rgba(139, 92, 246, 0.05)',
  glow: '0 0 20px rgba(139, 92, 246, 0.4)',
  glowLarge: '0 0 40px rgba(139, 92, 246, 0.3)',
};

// ==========================================
// アニメーション設定
// ==========================================
export const RESEARCH_ANIMATIONS = {
  // 基本トランジション
  transition: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
  
  // 専用イージング
  easing: {
    research: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // キーフレーム名
  keyframes: {
    pulse: 'research-pulse',
    shimmer: 'research-shimmer',
    progress: 'research-progress',
    typing: 'research-typing',
    bounce: 'research-bounce',
    fadeIn: 'research-fade-in',
    slideUp: 'research-slide-up',
  },
};

// ==========================================
// テーマ取得ヘルパー関数
// ==========================================
export function getResearchTheme(isDark: boolean = false): ResearchThemeColors {
  return isDark ? DARK_RESEARCH_THEME : LIGHT_RESEARCH_THEME;
}

// ==========================================
// CSS変数生成ヘルパー
// ==========================================
export function generateResearchCSSVariables(isDark: boolean = false): Record<string, string> {
  const theme = getResearchTheme(isDark);
  const variables: Record<string, string> = {};
  
  // テーマカラーをCSS変数に変換
  Object.entries(theme).forEach(([key, value]) => {
    variables[`--research-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });
  
  // グラデーション変数
  Object.entries(RESEARCH_GRADIENTS).forEach(([key, value]) => {
    variables[`--research-gradient-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });
  
  // 影変数
  Object.entries(RESEARCH_SHADOWS).forEach(([key, value]) => {
    variables[`--research-shadow-${key}`] = value;
  });
  
  return variables;
}

// ==========================================
// Tailwind CSS クラス生成ヘルパー
// ==========================================
export function getResearchClasses(element: 'button' | 'card' | 'input' | 'progress' | 'badge') {
  const baseClasses = {
    button: {
      primary: 'bg-research-primary hover:bg-research-primary-hover text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 shadow-research-medium hover:shadow-research-large',
      secondary: 'bg-research-secondary hover:bg-research-secondary-hover text-research-text font-medium px-4 py-2 rounded-lg transition-all duration-300',
      ghost: 'text-research-primary hover:bg-research-background-secondary font-medium px-4 py-2 rounded-lg transition-all duration-300',
    },
    card: {
      default: 'bg-research-background border border-research-border rounded-lg shadow-research-medium',
      hover: 'bg-research-background border border-research-border rounded-lg shadow-research-medium hover:shadow-research-large hover:border-research-border-hover transition-all duration-300',
    },
    input: {
      default: 'bg-research-background border border-research-border text-research-text rounded-lg px-3 py-2 focus:border-research-primary focus:ring-2 focus:ring-research-primary focus:ring-opacity-20 transition-all duration-300',
    },
    progress: {
      container: 'bg-research-progress-track rounded-full overflow-hidden',
      bar: 'bg-gradient-to-r from-research-primary to-research-primary-muted h-full transition-all duration-500 ease-out',
    },
    badge: {
      default: 'bg-research-secondary text-research-text-secondary px-2 py-1 rounded-full text-xs font-medium',
      success: 'bg-research-success text-white px-2 py-1 rounded-full text-xs font-medium',
      warning: 'bg-research-warning text-white px-2 py-1 rounded-full text-xs font-medium',
      error: 'bg-research-error text-white px-2 py-1 rounded-full text-xs font-medium',
    },
  };
  
  return baseClasses[element];
}

// ==========================================
// レスポンシブ設定
// ==========================================
export const RESEARCH_BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ==========================================
// エクスポート
// ==========================================
export default {
  light: LIGHT_RESEARCH_THEME,
  dark: DARK_RESEARCH_THEME,
  gradients: RESEARCH_GRADIENTS,
  shadows: RESEARCH_SHADOWS,
  animations: RESEARCH_ANIMATIONS,
  getTheme: getResearchTheme,
  generateCSSVariables: generateResearchCSSVariables,
  getClasses: getResearchClasses,
  breakpoints: RESEARCH_BREAKPOINTS,
}; 
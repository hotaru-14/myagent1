# 📝 **チャットMarkdown対応機能 実装TODO**

## 🎯 **概要**
チャットメッセージでMarkdown記法をサポートし、リッチテキストとして表示する機能を実装します。

**参考**: [react-markdown GitHub](https://github.com/remarkjs/react-markdown) - 最新バージョン v10.1.0

## 📦 **Phase 1: 依存関係の追加**

### ✅ ✔️ COMPLETED: パッケージインストール
```bash
npm install react-markdown@^10.1.0 remark-gfm@^4.0.0 rehype-highlight@^7.0.0 rehype-raw@^7.0.0
```

### 📋 必要な依存関係詳細
- `react-markdown@^10.1.0` - メインのMarkdownレンダラー
- `remark-gfm@^4.0.0` - GitHub Flavored Markdown対応
- `rehype-highlight@^7.0.0` - シンタックスハイライト
- `rehype-raw@^7.0.0` - HTMLタグサポート（信頼できる環境用）

## 🏗️ **Phase 2: コアコンポーネント実装**

### ✅ ✔️ COMPLETED: MarkdownRenderer コンポーネント作成
**ファイル**: `components/features/chat/message/markdown-renderer.tsx`
**進捗**: 基本実装完了（型エラーあり - 要修正）

```tsx
"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // シンタックスハイライト用CSS

interface MarkdownRendererProps {
  content: string;
  className?: string;
  role?: "user" | "assistant";
}

export function MarkdownRenderer({ 
  content, 
  className = "",
  role = "assistant"
}: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${
      role === "user" ? "prose-invert" : ""
    } ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // カスタムコンポーネントマッピング
          h1: ({children}) => (
            <h1 className="text-xl font-bold mb-2 mt-0 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({children}) => (
            <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({children}) => (
            <h3 className="text-base font-medium mb-1 mt-2 first:mt-0">
              {children}
            </h3>
          ),
          p: ({children}) => (
            <p className="mb-2 last:mb-0 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({children}) => (
            <ul className="list-disc ml-4 mb-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({children}) => (
            <ol className="list-decimal ml-4 mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({children}) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          code: ({inline, children, className, ...props}) => 
            inline ? (
              <code 
                className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                  role === "user" 
                    ? "bg-white bg-opacity-20 text-green-100" 
                    : "bg-gray-100 text-gray-800"
                }`} 
                {...props}
              >
                {children}
              </code>
            ) : (
              <div className="my-3">
                <pre className={`p-3 rounded-lg overflow-x-auto text-sm ${
                  role === "user" 
                    ? "bg-white bg-opacity-10" 
                    : "bg-gray-100"
                }`}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ),
          blockquote: ({children}) => (
            <blockquote className={`border-l-4 pl-4 italic my-3 ${
              role === "user" 
                ? "border-green-300 text-green-100" 
                : "border-gray-300 text-gray-600"
            }`}>
              {children}
            </blockquote>
          ),
          a: ({href, children}) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`underline hover:no-underline ${
                role === "user" 
                  ? "text-green-200 hover:text-green-100" 
                  : "text-blue-600 hover:text-blue-800"
              }`}
            >
              {children}
            </a>
          ),
          table: ({children}) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({children}) => (
            <th className={`border border-gray-300 px-3 py-2 text-left font-semibold ${
              role === "user" 
                ? "bg-white bg-opacity-20" 
                : "bg-gray-50"
            }`}>
              {children}
            </th>
          ),
          td: ({children}) => (
            <td className="border border-gray-300 px-3 py-2">
              {children}
            </td>
          ),
          // GitHub Flavored Markdown: タスクリスト
          input: ({type, checked, disabled}) => 
            type === 'checkbox' ? (
              <input 
                type="checkbox" 
                checked={checked} 
                disabled={disabled}
                className="mr-2 pointer-events-none"
              />
            ) : null,
          // GitHub Flavored Markdown: 取り消し線
          del: ({children}) => (
            <del className="opacity-75">
              {children}
            </del>
          ),
        }}
        // セキュリティ設定
        linkTarget="_blank"
        transformLinkUri={(uri) => {
          // URLの検証とサニタイズ
          if (uri.startsWith('http://') || uri.startsWith('https://')) {
            return uri;
          }
          if (uri.startsWith('mailto:')) {
            return uri;
          }
          return '#';
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

### ✅ ✔️ COMPLETED: MessageContent コンポーネント拡張
**ファイル**: `components/features/chat/message/message-content.tsx`
**進捗**: 実装完了

既存のコンポーネントに以下の変更を追加：

```tsx
// インポートを追加
import { MarkdownRenderer } from "./markdown-renderer";

// MessageContentProps に新しいプロパティを追加
interface MessageContentProps {
  content: string;
  role: "user" | "assistant";
  agentId?: string;
  isStreaming?: boolean;
  conversationId?: string;
  enableMarkdown?: boolean; // 新規追加
  className?: string;
}

// 通常のメッセージ表示部分を修正（研究エージェント処理の後）
const baseClasses = "rounded-lg px-4 py-2";
const roleClasses = role === "user" 
  ? "bg-green-500 text-white" 
  : "bg-gray-100 text-gray-900";

return (
  <div className={`${baseClasses} ${roleClasses} ${className}`}>
    {enableMarkdown ? (
      <MarkdownRenderer 
        content={content} 
        role={role}
        className="text-sm"
      />
    ) : (
      <div className="text-sm whitespace-pre-wrap break-words">
        {content}
      </div>
    )}
    {isStreaming && role === "assistant" && (
      <span className="inline-block w-2 h-4 bg-gray-600 ml-1 animate-pulse" />
    )}
  </div>
);
```

## 🎨 **Phase 3: スタイリング強化**

### ✅ ✔️ COMPLETED: CSS追加
**ファイル**: `app/globals.css`
**進捗**: 実装完了

```css
/* Markdownスタイリング */
.prose-invert h1,
.prose-invert h2,
.prose-invert h3,
.prose-invert h4,
.prose-invert h5,
.prose-invert h6 {
  color: white;
  margin-top: 0;
}

.prose-invert p,
.prose-invert li {
  color: white;
}

.prose-invert strong {
  color: white;
  font-weight: 600;
}

.prose-invert em {
  color: rgba(255, 255, 255, 0.9);
}

.prose-invert code {
  background-color: rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.prose-invert pre {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.prose-invert blockquote {
  border-left-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
}

.prose-invert a {
  color: #93c5fd;
  text-decoration: underline;
}

.prose-invert a:hover {
  color: #bfdbfe;
  text-decoration: none;
}

/* テーブルスタイリング */
.prose-invert table {
  border-color: rgba(255, 255, 255, 0.2);
}

.prose-invert th,
.prose-invert td {
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.prose-invert th {
  background-color: rgba(255, 255, 255, 0.1);
}

/* シンタックスハイライト - ユーザーメッセージ用調整 */
.prose-invert .hljs {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #e2e8f0 !important;
}

/* タスクリストのスタイリング */
.prose-invert input[type="checkbox"] {
  margin-right: 0.5rem;
  accent-color: #10b981;
}

/* モバイル対応 */
@media (max-width: 640px) {
  .prose-invert table {
    font-size: 0.875rem;
  }
  
  .prose-invert pre {
    font-size: 0.75rem;
  }
}
```

### ✅ ✔️ COMPLETED: Tailwind CSS拡張
**ファイル**: `tailwind.config.ts`
**進捗**: 実装完了

```typescript
// typography プラグインの設定を追加
module.exports = {
  // ... 既存の設定
  plugins: [
    require('@tailwindcss/typography'),
    // ... 他のプラグイン
  ],
  theme: {
    extend: {
      typography: {
        sm: {
          css: {
            fontSize: '0.875rem',
            lineHeight: '1.5',
            h1: {
              fontSize: '1.25rem',
              marginTop: '0',
              marginBottom: '0.5rem',
            },
            h2: {
              fontSize: '1.125rem',
              marginTop: '0.75rem',
              marginBottom: '0.5rem',
            },
            h3: {
              fontSize: '1rem',
              marginTop: '0.5rem',
              marginBottom: '0.25rem',
            },
            p: {
              marginTop: '0',
              marginBottom: '0.5rem',
            },
            ul: {
              marginTop: '0',
              marginBottom: '0.5rem',
            },
            ol: {
              marginTop: '0',
              marginBottom: '0.5rem',
            },
            li: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
            code: {
              fontSize: '0.8125rem',
            },
            pre: {
              fontSize: '0.8125rem',
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
            },
          },
        },
      },
    },
  },
};
```

## 🔧 **Phase 4: 入力支援機能**

### ✅ TODO: Markdown入力ヘルパー
**ファイル**: `components/features/chat/ui/markdown-input-helper.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  Code, 
  Link, 
  List, 
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Eye,
  EyeOff,
  Table,
  CheckSquare,
  Strikethrough
} from "lucide-react";
import { MarkdownRenderer } from "../message/markdown-renderer";

interface MarkdownInputHelperProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownInputHelper({ 
  value, 
  onChange, 
  className = "" 
}: MarkdownInputHelperProps) {
  const [showPreview, setShowPreview] = useState(false);

  const insertMarkdown = (before: string, after: string = "", newLine: boolean = false) => {
    const textarea = document.querySelector('textarea[data-markdown-input]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const prefix = newLine && start > 0 && value[start - 1] !== '\n' ? '\n' : '';
    const suffix = newLine ? '\n' : '';
    
    const newText = 
      value.substring(0, start) + 
      prefix +
      before + 
      selectedText + 
      after + 
      suffix +
      value.substring(end);
    
    onChange(newText);
    
    // カーソル位置を調整
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const markdownActions = [
    { 
      icon: Bold, 
      action: () => insertMarkdown("**", "**"), 
      tooltip: "太字 (Ctrl+B)",
      shortcut: "Ctrl+B"
    },
    { 
      icon: Italic, 
      action: () => insertMarkdown("*", "*"), 
      tooltip: "斜体 (Ctrl+I)",
      shortcut: "Ctrl+I"
    },
    { 
      icon: Strikethrough, 
      action: () => insertMarkdown("~~", "~~"), 
      tooltip: "取り消し線",
      shortcut: null
    },
    { 
      icon: Code, 
      action: () => insertMarkdown("`", "`"), 
      tooltip: "インラインコード",
      shortcut: null
    },
    { 
      icon: Link, 
      action: () => insertMarkdown("[", "](url)"), 
      tooltip: "リンク",
      shortcut: null
    },
    { 
      icon: List, 
      action: () => insertMarkdown("- ", "", true), 
      tooltip: "箇条書き",
      shortcut: null
    },
    { 
      icon: ListOrdered, 
      action: () => insertMarkdown("1. ", "", true), 
      tooltip: "番号付きリスト",
      shortcut: null
    },
    { 
      icon: CheckSquare, 
      action: () => insertMarkdown("- [ ] ", "", true), 
      tooltip: "タスクリスト",
      shortcut: null
    },
    { 
      icon: Quote, 
      action: () => insertMarkdown("> ", "", true), 
      tooltip: "引用",
      shortcut: null
    },
    { 
      icon: Heading1, 
      action: () => insertMarkdown("# ", "", true), 
      tooltip: "見出し1",
      shortcut: null
    },
    { 
      icon: Heading2, 
      action: () => insertMarkdown("## ", "", true), 
      tooltip: "見出し2",
      shortcut: null
    },
    { 
      icon: Table, 
      action: () => insertMarkdown(
        "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |", 
        "", 
        true
      ), 
      tooltip: "テーブル",
      shortcut: null
    },
  ];

  // キーボードショートカット
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertMarkdown("**", "**");
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown("*", "*");
          break;
      }
    }
  };

  return (
    <div className={`border-t bg-gray-50 dark:bg-gray-800 ${className}`}>
      {/* ツールバー */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 flex-wrap">
          {markdownActions.map(({ icon: Icon, action, tooltip }, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action}
              title={tooltip}
              className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:block">
            Ctrl+Enter で送信
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {showPreview ? "編集" : "プレビュー"}
            </span>
          </Button>
        </div>
      </div>
      
      {/* プレビュー */}
      {showPreview && (
        <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-2">プレビュー:</div>
          <MarkdownRenderer content={value || "*メッセージを入力してください...*"} />
        </div>
      )}
      
      {/* ヘルプ */}
      <div className="p-2 text-xs text-gray-500 dark:text-gray-400">
        <details className="cursor-pointer">
          <summary className="hover:text-gray-700 dark:hover:text-gray-200">
            Markdownヘルプ
          </summary>
          <div className="mt-2 space-y-1 font-mono text-xs">
            <div><code>**太字**</code> → <strong>太字</strong></div>
            <div><code>*斜体*</code> → <em>斜体</em></div>
            <div><code>`コード`</code> → <code>コード</code></div>
            <div><code>[リンク](URL)</code> → リンク</div>
            <div><code>- リスト</code> → • リスト</div>
            <div><code>## 見出し</code> → 見出し</div>
            <div><code>- [ ] タスク</code> → ☐ タスク</div>
          </div>
        </details>
      </div>
    </div>
  );
}
```

### ✅ TODO: ChatInput コンポーネント拡張
**ファイル**: `components/features/chat/chat-input.tsx`

```tsx
// インポートを追加
import { MarkdownInputHelper } from "./ui/markdown-input-helper";

// ChatInputProps に新しいプロパティを追加
interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  agentId?: string;
  enableMarkdownHelper?: boolean; // 新規追加
  className?: string;
}

// コンポーネントの修正
export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "メッセージを入力してください...",
  agentId,
  enableMarkdownHelper = true, // デフォルトで有効
  className = ""
}: ChatInputProps) {
  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="space-y-0">
        <div className="relative border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <textarea
            data-markdown-input // Markdownヘルパー用のセレクタ
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            className="w-full px-4 py-3 pr-12 border-0 focus:outline-none resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSubmit(e as any);
              }
            }}
          />
          <Button
            type="submit"
            disabled={disabled || !value.trim()}
            className="absolute bottom-3 right-3"
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {enableMarkdownHelper && (
          <MarkdownInputHelper 
            value={value} 
            onChange={onChange}
          />
        )}
      </form>
    </div>
  );
}
```

## ⚙️ **Phase 5: 設定と最適化**

### ✅ TODO: Markdown設定ファイル
**ファイル**: `lib/config/markdown-config.ts`

```typescript
export const markdownConfig = {
  // 基本設定
  enableMarkdown: true,
  enableGfm: true, // GitHub Flavored Markdown
  enableCodeHighlight: true,
  enableTables: true,
  enableTaskLists: true,
  enableStrikethrough: true,
  
  // セキュリティ設定
  allowHtml: false, // HTMLタグを許可するか
  maxContentLength: 10000, // Markdownコンテンツの最大長
  
  // パフォーマンス設定
  enableLazyLoading: true, // 大きなコンテンツの遅延読み込み
  
  // UI設定
  showMarkdownHelper: true, // 入力ヘルパーを表示するか
  showPreviewByDefault: false, // デフォルトでプレビューを表示するか
  enableKeyboardShortcuts: true, // キーボードショートカットを有効にするか
  
  // 許可されるHTMLタグ（allowHtml: trueの場合）
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  
  // コードハイライト設定
  highlightTheme: 'github', // highlight.jsのテーマ
  supportedLanguages: [
    'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
    'csharp', 'php', 'ruby', 'go', 'rust', 'sql', 'html', 'css',
    'json', 'yaml', 'markdown', 'bash', 'shell'
  ]
};

// 設定の型定義
export type MarkdownConfigType = typeof markdownConfig;
```

### ✅ TODO: パフォーマンス最適化Hook
**ファイル**: `lib/hooks/use-markdown-performance.ts`

```typescript
"use client";

import { useMemo, useCallback } from 'react';
import { markdownConfig } from '@/lib/config/markdown-config';

interface UseMarkdownPerformanceProps {
  content: string;
  enableMarkdown: boolean;
}

export function useMarkdownPerformance({
  content,
  enableMarkdown
}: UseMarkdownPerformanceProps) {
  // コンテンツの長さチェック
  const isContentTooLong = useMemo(() => {
    return content.length > markdownConfig.maxContentLength;
  }, [content]);
  
  // Markdownが有効かどうかの判定
  const shouldRenderMarkdown = useMemo(() => {
    if (!enableMarkdown) return false;
    if (isContentTooLong) return false;
    
    // 簡単なMarkdown記法が含まれているかチェック
    const markdownPatterns = [
      /#{1,6}\s/, // 見出し
      /\*\*.*\*\*/, // 太字
      /\*.*\*/, // 斜体
      /`.*`/, // インラインコード
      /```[\s\S]*```/, // コードブロック
      /^\s*[-*+]\s/m, // リスト
      /^\s*\d+\.\s/m, // 番号付きリスト
      /^\s*>\s/m, // 引用
      /\[.*\]\(.*\)/, // リンク
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
  }, [enableMarkdown, isContentTooLong, content]);
  
  // 警告メッセージの生成
  const getWarningMessage = useCallback(() => {
    if (isContentTooLong) {
      return `コンテンツが長すぎます（${content.length}/${markdownConfig.maxContentLength}文字）。Markdownレンダリングは無効になっています。`;
    }
    return null;
  }, [isContentTooLong, content.length]);
  
  return {
    shouldRenderMarkdown,
    isContentTooLong,
    warningMessage: getWarningMessage()
  };
}
```

## 🧪 **Phase 6: テスト実装**

### ✅ TODO: テストファイル作成
**ファイル**: `__tests__/markdown-renderer.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '@/components/features/chat/message/markdown-renderer';

describe('MarkdownRenderer', () => {
  test('基本的なMarkdownをレンダリングする', () => {
    const content = '# 見出し\n\n**太字**と*斜体*のテスト';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('見出し');
    expect(screen.getByText('太字')).toBeInTheDocument();
    expect(screen.getByText('斜体')).toBeInTheDocument();
  });
  
  test('コードブロックがハイライトされる', () => {
    const content = '```javascript\nconst test = "hello";\n```';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByText('const test = "hello";')).toBeInTheDocument();
  });
  
  test('リンクが正しく処理される', () => {
    const content = '[テストリンク](https://example.com)';
    render(<MarkdownRenderer content={content} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });
  
  test('タスクリストがレンダリングされる', () => {
    const content = '- [x] 完了済みタスク\n- [ ] 未完了タスク';
    render(<MarkdownRenderer content={content} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });
});
```

## 📱 **Phase 7: モバイル対応**

### ✅ TODO: レスポンシブ調整
- テーブルの横スクロール対応
- モバイルでのMarkdownツールバー最適化
- タッチデバイスでの選択操作改善

### ✅ TODO: PWA対応
- オフライン時のMarkdownレンダリング
- キャッシュ戦略の最適化

## 🔒 **Phase 8: セキュリティ強化**

### ✅ TODO: セキュリティ監査
- XSS攻撃の防止確認
- URL検証の強化
- ユーザー生成コンテンツのサニタイズ

### ✅ TODO: 追加セキュリティパッケージ（オプション）
```bash
npm install rehype-sanitize dompurify
```

## 🚀 **実装優先順位**

### 🥇 **優先度: 高**
1. Phase 1: 依存関係の追加
2. Phase 2: MarkdownRendererコンポーネント
3. Phase 2: MessageContent拡張
4. Phase 3: 基本スタイリング

### 🥈 **優先度: 中**
5. Phase 4: 入力支援機能
6. Phase 5: 設定システム
7. Phase 6: テスト実装

### 🥉 **優先度: 低**
8. Phase 7: モバイル最適化
9. Phase 8: セキュリティ強化

## 📊 **実装進捗メモ**

### 🎯 **現在のステータス（Phase 3完了時点）**
- ✅ **Phase 1: 依存関係の追加** - 完了
- ✅ **Phase 2: コアコンポーネント実装** - 基本実装完了
- ✅ **Phase 3: スタイリング強化** - 完了
- ⏸️ **Phase 4以降** - 未実装

### ✅ **解決済みの課題**
1. **MarkdownRendererの型エラー** - ✔️ 修正完了
   - ~~react-markdown v10.1.0との型定義不整合~~ → `urlTransform`に修正
   - ~~`transformLinkUri`プロパティの型問題~~ → プロパティ名変更で解決
   - Hydrationエラー対策として`suppressHydrationWarning`追加

### 🔄 **次の推奨アクション**
1. 動作確認（開発サーバー起動）
2. 型エラーの修正
3. Phase 4: 入力支援機能の実装

## 📝 **実装メモ**

### 参考リンク
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) - 公式ドキュメント
- [remark plugins](https://github.com/remarkjs/remark/blob/main/doc/plugins.md) - remarkプラグイン一覧
- [rehype plugins](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md) - rehypeプラグイン一覧

### 注意事項
- セキュリティを最優先に考慮
- 既存機能を破壊しないよう段階的実装
- パフォーマンスを考慮した最適化
- ユーザビリティを重視した設計

### 今後の拡張予定
- 数式表示（KaTeX）
- 図表作成（Mermaid）
- ファイル添付時のMarkdown表示
- カスタムMarkdown記法の追加 
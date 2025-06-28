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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: ({inline, children, className, ...props}: any) => 
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
              <div className="my-3" suppressHydrationWarning>
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
        urlTransform={(uri: string) => {
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
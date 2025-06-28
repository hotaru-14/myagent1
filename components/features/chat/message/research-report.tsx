"use client";

import { FileText, ExternalLink, Star, Shield, AlertTriangle, ChevronDown, ChevronUp, Copy, Download, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface Citation {
  id: string;
  title: string;
  url: string;
  source: string;
  reliability: 'high' | 'medium' | 'low';
  excerpt?: string;
}

interface ResearchReportProps {
  content: string;
  citations: Citation[];
  reliabilityScore: 'high' | 'medium' | 'low';
  downloadable?: boolean;
  title?: string;
  summary?: string;
  className?: string;
}

export function ResearchReport({
  content,
  citations,
  reliabilityScore,
  downloadable = false,
  title = "調査レポート",
  summary,
  className = ""
}: ResearchReportProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCitations, setShowCitations] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const getReliabilityIcon = (reliability: 'high' | 'medium' | 'low') => {
    switch (reliability) {
      case 'high':
        return (
          <div className="p-1.5 bg-green-100 rounded-full dark:bg-green-800">
            <Shield className="w-3 h-3 text-green-600 dark:text-green-300" />
          </div>
        );
      case 'medium':
        return (
          <div className="p-1.5 bg-yellow-100 rounded-full dark:bg-yellow-800">
            <Star className="w-3 h-3 text-yellow-600 dark:text-yellow-300" />
          </div>
        );
      case 'low':
        return (
          <div className="p-1.5 bg-red-100 rounded-full dark:bg-red-800">
            <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-300" />
          </div>
        );
    }
  };

  const getReliabilityColor = (reliability: 'high' | 'medium' | 'low') => {
    switch (reliability) {
      case 'high':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700 dark:text-green-200';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-yellow-800 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-700 dark:text-yellow-200';
      case 'low':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-700 dark:text-red-200';
    }
  };

  const getReliabilityText = (reliability: 'high' | 'medium' | 'low') => {
    switch (reliability) {
      case 'high':
        return '高信頼性';
      case 'medium':
        return '中信頼性';
      case 'low':
        return '要検証';
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('コピーに失敗しました:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // マークダウン風の基本的なレンダリング（簡易版）
  const renderContent = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // ヘッダー処理
        if (line.startsWith('### ')) {
          return (
            <h3 key={index} className="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b border-purple-200 pb-1">
              {line.substring(4)}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl font-bold text-gray-900 mt-8 mb-4 border-b border-purple-300 pb-2">
              {line.substring(3)}
            </h2>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-6">
              {line.substring(2)}
            </h1>
          );
        }
        
        // リスト処理
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={index} className="ml-4 mb-1 text-gray-700">
              {line.substring(2)}
            </li>
          );
        }
        
        // 番号付きリスト
        if (/^\d+\.\s/.test(line)) {
          return (
            <li key={index} className="ml-4 mb-1 text-gray-700 list-decimal">
              {line.replace(/^\d+\.\s/, '')}
            </li>
          );
        }
        
        // 通常のパラグラフ
        if (line.trim()) {
          return (
            <p key={index} className="mb-3 text-gray-700 leading-relaxed">
              {line}
            </p>
          );
        }
        
        // 空行
        return <br key={index} />;
      });
  };

  return (
    <Card className={`
      research-report-appear research-card-hover
      bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30
      dark:from-gray-900 dark:via-purple-950/20 dark:to-indigo-950/20
      border-2 border-purple-200 dark:border-purple-700
      shadow-xl hover:shadow-2xl transition-all duration-500
      ${className}
    `}>
      <CardHeader className="
        bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-700
        text-white rounded-t-lg relative overflow-hidden
      ">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 research-shimmer"></div>
        <CardTitle className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 research-slide-up">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <FileText className="w-5 h-5 research-pulse" />
            </div>
            <span className="flex items-center gap-2 font-bold">
              {title}
              <Sparkles className="w-4 h-4 text-yellow-300 research-glow" />
            </span>
          </div>
          <div className="flex items-center gap-3 research-slide-up" style={{ animationDelay: '0.2s' }}>
            {/* 信頼性バッジ */}
            <div className={`
              px-3 py-2 rounded-lg text-xs font-semibold 
              flex items-center gap-2 
              bg-white/20 text-white border border-white/30 
              backdrop-blur-sm shadow-lg
              research-pulse
            `}>
              {getReliabilityIcon(reliabilityScore)}
              {getReliabilityText(reliabilityScore)}
            </div>
            
            {/* 折りたたみボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="
                text-white hover:bg-white/20 p-2 rounded-lg
                backdrop-blur-sm border border-white/30
                transition-all duration-300 research-button-hover
              "
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-6 space-y-6">
          {/* サマリー */}
          {summary && (
            <div className="
              bg-gradient-to-r from-purple-50 to-indigo-50 
              dark:from-purple-900/20 dark:to-indigo-900/20
              border-l-4 border-purple-500 p-5 rounded-r-lg
              shadow-sm hover:shadow-md transition-all duration-300
              research-slide-up research-button-hover
            " style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-purple-100 rounded-full dark:bg-purple-800">
                  <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                </div>
                <h3 className="font-bold text-purple-900 dark:text-purple-100">調査サマリー</h3>
              </div>
              <p className="text-purple-800 dark:text-purple-200 text-sm leading-relaxed">{summary}</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="
            flex flex-wrap gap-3 pb-6 
            border-b-2 border-purple-100 dark:border-purple-800
            research-slide-up
          " style={{ animationDelay: '0.2s' }}>
            <Button
              onClick={handleCopyContent}
              className="
                bg-gradient-to-r from-purple-50 to-purple-100 
                hover:from-purple-100 hover:to-purple-200
                dark:from-purple-900/50 dark:to-purple-800/50
                dark:hover:from-purple-800/60 dark:hover:to-purple-700/60
                text-purple-700 dark:text-purple-200 font-semibold
                border-2 border-purple-300 dark:border-purple-600
                hover:border-purple-400 dark:hover:border-purple-500
                shadow-md hover:shadow-lg transition-all duration-300
                research-button-hover
                flex items-center gap-2
              "
            >
              <Copy className={`w-3 h-3 ${isCopied ? 'research-bounce' : ''}`} />
              {isCopied ? 'コピー済み!' : 'コピー'}
            </Button>
            
            {downloadable && (
              <Button
                onClick={handleDownload}
                className="
                  bg-gradient-to-r from-blue-50 to-blue-100 
                  hover:from-blue-100 hover:to-blue-200
                  dark:from-blue-900/50 dark:to-blue-800/50
                  dark:hover:from-blue-800/60 dark:hover:to-blue-700/60
                  text-blue-700 dark:text-blue-200 font-semibold
                  border-2 border-blue-300 dark:border-blue-600
                  hover:border-blue-400 dark:hover:border-blue-500
                  shadow-md hover:shadow-lg transition-all duration-300
                  research-button-hover
                  flex items-center gap-2
                "
              >
                <Download className="w-3 h-3" />
                ダウンロード
              </Button>
            )}
            
            <Button
              onClick={() => setShowCitations(!showCitations)}
              className="
                bg-gradient-to-r from-green-50 to-green-100 
                hover:from-green-100 hover:to-green-200
                dark:from-green-900/50 dark:to-green-800/50
                dark:hover:from-green-800/60 dark:hover:to-green-700/60
                text-green-700 dark:text-green-200 font-semibold
                border-2 border-green-300 dark:border-green-600
                hover:border-green-400 dark:hover:border-green-500
                shadow-md hover:shadow-lg transition-all duration-300
                research-button-hover
                flex items-center gap-2
              "
            >
              <ExternalLink className="w-3 h-3" />
              引用 ({citations.length})
            </Button>
          </div>

          {/* レポート内容 */}
          <div className="research-slide-up" style={{ animationDelay: '0.3s' }}>
            <ScrollArea className="max-h-96 pr-2">
              <div className="
                prose max-w-none 
                bg-gradient-to-r from-white to-gray-50 
                dark:from-gray-800 dark:to-gray-700
                p-6 rounded-lg border border-gray-200 dark:border-gray-600
                shadow-sm hover:shadow-md transition-all duration-300
                research-button-hover
              ">
                {renderContent(content)}
              </div>
            </ScrollArea>
          </div>

          {/* 引用セクション */}
          {showCitations && citations.length > 0 && (
            <div className="
              space-y-4 pt-6 
              border-t-2 border-purple-100 dark:border-purple-800
              research-slide-up
            " style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-green-100 rounded-lg dark:bg-green-800">
                  <ExternalLink className="w-4 h-4 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">参考資料・引用</h3>
                <Badge className="
                  bg-green-100 text-green-700 border border-green-200
                  dark:bg-green-800 dark:text-green-200 dark:border-green-700
                  text-xs font-semibold research-pulse
                ">
                  {citations.length}件
                </Badge>
              </div>
              
              <div className="space-y-3">
                {citations.map((citation, index) => (
                  <div 
                    key={citation.id}
                    className="
                      bg-gradient-to-r from-gray-50 to-blue-50 
                      dark:from-gray-800 dark:to-blue-900/20
                      rounded-lg p-4 border border-gray-200 dark:border-gray-600
                      shadow-sm hover:shadow-md transition-all duration-300
                      research-button-hover research-fade-in
                    "
                    style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getReliabilityIcon(citation.reliability)}
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {citation.title}
                          </h4>
                          <Badge className={`
                            text-xs font-semibold border
                            ${getReliabilityColor(citation.reliability)}
                          `}>
                            {getReliabilityText(citation.reliability)}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                          出典: {citation.source}
                        </p>
                        
                        {citation.excerpt && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2 leading-relaxed">
                            &ldquo;{citation.excerpt}&rdquo;
                          </p>
                        )}
                      </div>
                      
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          flex-shrink-0 p-2 
                          bg-purple-100 hover:bg-purple-200 
                          dark:bg-purple-800 dark:hover:bg-purple-700
                          text-purple-600 dark:text-purple-300 
                          hover:text-purple-800 dark:hover:text-purple-100
                          rounded-lg transition-all duration-300
                          research-button-hover
                        "
                        title="外部リンクを開く"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* フッター */}
          <div className="
            pt-6 border-t-2 border-purple-100 dark:border-purple-800 
            text-xs text-gray-500 dark:text-gray-400
            research-slide-up
          " style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full research-pulse"></div>
                <span className="font-medium">
                  生成日時: {new Date().toLocaleString('ja-JP')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  文字数: {content.length.toLocaleString()}字
                </span>
                <div className="w-2 h-2 bg-blue-400 rounded-full research-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 
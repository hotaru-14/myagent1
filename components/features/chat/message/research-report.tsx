"use client";

import { FileText, ExternalLink, Star, Shield, AlertTriangle, ChevronDown, ChevronUp, Copy, Download } from "lucide-react";
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
        return <Shield className="w-4 h-4 text-green-600" />;
      case 'medium':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getReliabilityColor = (reliability: 'high' | 'medium' | 'low') => {
    switch (reliability) {
      case 'high':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-red-50 border-red-200 text-red-800';
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
    <Card className={`bg-white border-purple-200 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {title}
          </div>
          <div className="flex items-center gap-2">
            {/* 信頼性バッジ */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getReliabilityColor(reliabilityScore)} bg-white/20 text-white border-white/30`}>
              {getReliabilityIcon(reliabilityScore)}
              {getReliabilityText(reliabilityScore)}
            </div>
            
            {/* 折りたたみボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:bg-white/20 p-1"
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
            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-md">
              <h3 className="font-semibold text-purple-900 mb-2">調査サマリー</h3>
              <p className="text-purple-800 text-sm leading-relaxed">{summary}</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100">
            <Button
              onClick={handleCopyContent}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="w-3 h-3" />
              {isCopied ? 'コピー済み!' : 'コピー'}
            </Button>
            
            {downloadable && (
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                ダウンロード
              </Button>
            )}
            
            <Button
              onClick={() => setShowCitations(!showCitations)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-3 h-3" />
              引用 ({citations.length})
            </Button>
          </div>

          {/* レポート内容 */}
          <ScrollArea className="max-h-96">
            <div className="prose max-w-none">
              {renderContent(content)}
            </div>
          </ScrollArea>

          {/* 引用セクション */}
          {showCitations && citations.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                参考資料・引用
                <Badge variant="outline" className="text-xs">
                  {citations.length}件
                </Badge>
              </h3>
              
              <div className="space-y-3">
                {citations.map((citation) => (
                  <div 
                    key={citation.id}
                    className="bg-gray-50 rounded-lg p-4 border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getReliabilityIcon(citation.reliability)}
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {citation.title}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getReliabilityColor(citation.reliability)} border-current`}
                          >
                            {getReliabilityText(citation.reliability)}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">
                          出典: {citation.source}
                        </p>
                        
                        {citation.excerpt && (
                          <p className="text-xs text-gray-700 italic line-clamp-2">
                            "{citation.excerpt}"
                          </p>
                        )}
                      </div>
                      
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-1 text-purple-600 hover:text-purple-800 transition-colors"
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
          <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>
                生成日時: {new Date().toLocaleString('ja-JP')}
              </span>
              <span>
                文字数: {content.length.toLocaleString()}字
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 
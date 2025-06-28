"use client";

import { Search, CheckCircle, Clock, Globe, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProgressData {
  currentSearch: number;
  totalSearches: number;
  currentQuery: string;
  completedQueries: string[];
  estimatedTimeRemaining?: string;
  status: 'searching' | 'analyzing' | 'complete';
}

interface ResearchProgressProps {
  progressData: ProgressData;
  className?: string;
}

export function ResearchProgress({
  progressData,
  className = ""
}: ResearchProgressProps) {
  const {
    currentSearch,
    totalSearches,
    currentQuery,
    completedQueries,
    estimatedTimeRemaining,
    status
  } = progressData;

  const progressPercentage = totalSearches > 0 
    ? Math.round((currentSearch / totalSearches) * 100) 
    : 0;

  const getStatusIcon = () => {
    switch (status) {
      case 'searching':
        return <Search className="w-4 h-4 text-purple-600 animate-pulse" />;
      case 'analyzing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Search className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'searching':
        return '情報を検索中...';
      case 'analyzing':
        return '検索結果を分析中...';
      case 'complete':
        return '調査完了！';
      default:
        return '準備中...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'searching':
        return 'bg-purple-500';
      case 'analyzing':
        return 'bg-blue-500';
      case 'complete':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            調査進捗状況
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {currentSearch}/{totalSearches}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* 全体進捗バー */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              全体進捗
            </span>
            <span className="text-sm text-gray-600">
              {progressPercentage}%
            </span>
          </div>
          
          {/* カスタムプログレスバー */}
          <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>開始</span>
            <span>完了</span>
          </div>
        </div>

        {/* 現在の状況 */}
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className="font-medium text-gray-900">{getStatusText()}</span>
          </div>
          
          {currentQuery && status === 'searching' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Search className="w-3 h-3" />
                現在の検索クエリ
              </div>
              <div className="bg-purple-50 p-3 rounded-md border-l-4 border-purple-400">
                <p className="text-sm font-medium text-purple-800">
                  {currentQuery}
                </p>
              </div>
            </div>
          )}

          {status === 'analyzing' && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Globe className="w-3 h-3" />
              検索結果を統合・分析しています...
            </div>
          )}
        </div>

        {/* 推定残り時間 */}
        {estimatedTimeRemaining && status !== 'complete' && (
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              推定残り時間: <span className="font-medium">{estimatedTimeRemaining}</span>
            </span>
          </div>
        )}

        {/* 完了済み検索履歴 */}
        {completedQueries.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              完了済み検索
              <Badge variant="outline" className="text-xs">
                {completedQueries.length}件
              </Badge>
            </h4>
            
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {completedQueries.map((query, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 p-2 bg-green-50 rounded-md border-l-2 border-green-300"
                  >
                    <CheckCircle className="w-3 h-3 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-xs text-green-800 line-clamp-2">
                      {query}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 調査完了メッセージ */}
        {status === 'complete' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">調査が完了しました！</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              レポートを生成しています...
            </p>
          </div>
        )}

        {/* 詳細統計 */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {completedQueries.length}
            </div>
            <div className="text-xs text-gray-500">完了</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {totalSearches - completedQueries.length}
            </div>
            <div className="text-xs text-gray-500">残り</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
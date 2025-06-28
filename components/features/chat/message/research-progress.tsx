"use client";

import { Search, CheckCircle, Clock, Globe, Loader2, Activity, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getResearchTheme } from '@/lib/constants/research-theme';

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
  
  // テーマ取得
  const theme = getResearchTheme();

  const progressPercentage = totalSearches > 0 
    ? Math.round((currentSearch / totalSearches) * 100) 
    : 0;

  const getStatusIcon = () => {
    switch (status) {
      case 'searching':
        return (
          <div className="p-2 bg-purple-100 rounded-full dark:bg-purple-800">
            <Search className="w-4 h-4 text-purple-600 dark:text-purple-300 research-pulse" />
          </div>
        );
      case 'analyzing':
        return (
          <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-800">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-300 research-spin" />
          </div>
        );
      case 'complete':
        return (
          <div className="p-2 bg-green-100 rounded-full dark:bg-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-300 research-bounce" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 rounded-full dark:bg-gray-800">
            <Search className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
        );
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
    <Card className={`
      research-fade-in research-card-hover
      bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50
      dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950
      border-2 border-purple-200 dark:border-purple-700
      shadow-lg hover:shadow-xl transition-all duration-500
      ${className}
    `}>
      <CardHeader className="
        bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-700
        text-white rounded-t-lg relative overflow-hidden
      ">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 research-shimmer"></div>
        <CardTitle className="flex items-center justify-between text-lg font-semibold relative z-10">
          <div className="flex items-center gap-3 research-slide-up">
            {getStatusIcon()}
            <span className="flex items-center gap-2">
              調査進捗状況
              <TrendingUp className="w-4 h-4 text-yellow-300 research-glow" />
            </span>
          </div>
          <div className="research-slide-up" style={{ animationDelay: '0.2s' }}>
            <Badge className="
              bg-white/20 text-white border border-white/30 
              backdrop-blur-sm font-semibold px-3 py-1
              research-pulse
            ">
              {currentSearch}/{totalSearches}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* 全体進捗バー */}
        <div className="space-y-4 research-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-purple-100 rounded dark:bg-purple-800">
                <TrendingUp className="w-3 h-3 text-purple-600 dark:text-purple-300" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                全体進捗
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 research-pulse">
                {progressPercentage}%
              </span>
            </div>
          </div>
          
          {/* カスタムプログレスバー */}
          <div className="relative">
            <div className="w-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="
                  h-full bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 
                  rounded-full transition-all duration-1000 ease-out
                  research-progress-bar research-shimmer
                  relative overflow-hidden
                "
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent research-wave"></div>
              </div>
            </div>
            
            {/* プログレス数値オーバーレイ */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-md">
                {currentSearch} / {totalSearches}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              <span>開始</span>
            </div>
            <div className="flex items-center gap-1">
              <span>完了</span>
              <div className="w-2 h-2 bg-green-400 rounded-full research-pulse"></div>
            </div>
          </div>
        </div>

        {/* 現在の状況 */}
        <div className="
          bg-gradient-to-r from-white to-purple-50 
          dark:from-gray-800 dark:to-purple-900/20
          rounded-lg p-5 border border-purple-200 dark:border-purple-700
          shadow-md hover:shadow-lg transition-all duration-300
          research-button-hover research-slide-up
        " style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} research-pulse`} />
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
              {getStatusText()}
            </span>
          </div>
          
          {currentQuery && status === 'searching' && (
            <div className="space-y-3 research-fade-in">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-1 bg-purple-100 rounded dark:bg-purple-800">
                  <Search className="w-3 h-3 text-purple-600 dark:text-purple-300" />
                </div>
                現在の検索クエリ
              </div>
              <div className="
                bg-gradient-to-r from-purple-50 to-purple-100 
                dark:from-purple-900/50 dark:to-purple-800/50
                p-4 rounded-lg border-l-4 border-purple-500
                shadow-sm research-typing
              ">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200 leading-relaxed">
                  {currentQuery}
                </p>
              </div>
            </div>
          )}

          {status === 'analyzing' && (
            <div className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 research-fade-in">
              <div className="p-1 bg-blue-100 rounded dark:bg-blue-800">
                <Globe className="w-3 h-3 research-spin" />
              </div>
              <span className="font-medium">検索結果を統合・分析しています</span>
              <div className="research-progress-dots"></div>
            </div>
          )}

          {status === 'complete' && (
            <div className="flex items-center gap-3 text-sm text-green-600 dark:text-green-400 research-search-complete">
              <div className="p-1 bg-green-100 rounded dark:bg-green-800">
                <CheckCircle className="w-3 h-3" />
              </div>
              <span className="font-medium">すべての調査が完了しました！</span>
            </div>
          )}
        </div>

        {/* 推定残り時間 */}
        {estimatedTimeRemaining && status !== 'complete' && (
          <div className="
            bg-gradient-to-r from-amber-50 to-orange-50 
            dark:from-amber-900/20 dark:to-orange-900/20
            rounded-lg p-4 border border-amber-200 dark:border-amber-700
            shadow-sm hover:shadow-md transition-all duration-300
            research-button-hover research-slide-up
          " style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full dark:bg-amber-800">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-300 research-pulse" />
              </div>
              <div className="flex-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  推定残り時間
                </span>
                <div className="font-bold text-amber-700 dark:text-amber-300 text-lg">
                  {estimatedTimeRemaining}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 完了済み検索履歴 */}
        {completedQueries.length > 0 && (
          <div className="space-y-4 research-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-green-100 rounded-lg dark:bg-green-800">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-300" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                完了済み検索
              </h4>
              <Badge className="
                bg-green-100 text-green-700 border border-green-200
                dark:bg-green-800 dark:text-green-200 dark:border-green-700
                text-xs font-semibold research-pulse
              ">
                {completedQueries.length}件
              </Badge>
            </div>
            
            <ScrollArea className="h-36 pr-2">
              <div className="space-y-2">
                {completedQueries.map((query, index) => (
                  <div 
                    key={index}
                    className="
                      flex items-start gap-3 p-3 
                      bg-gradient-to-r from-green-50 to-emerald-50
                      dark:from-green-900/20 dark:to-emerald-900/20
                      rounded-lg border border-green-200 dark:border-green-700
                      shadow-sm hover:shadow-md transition-all duration-300
                      research-button-hover research-fade-in
                    "
                    style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                  >
                    <div className="p-1 bg-green-200 rounded-full dark:bg-green-700 mt-0.5">
                      <CheckCircle className="w-2.5 h-2.5 text-green-700 dark:text-green-200" />
                    </div>
                    <span className="text-xs text-green-800 dark:text-green-200 line-clamp-2 leading-relaxed flex-1">
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
          <div className="
            bg-gradient-to-r from-green-50 to-emerald-50 
            dark:from-green-900/20 dark:to-emerald-900/20
            border-2 border-green-200 dark:border-green-700 rounded-lg p-5
            shadow-lg research-search-complete research-glow
          ">
            <div className="flex items-center gap-3 text-green-800 dark:text-green-200">
              <div className="p-2 bg-green-200 rounded-full dark:bg-green-700">
                <CheckCircle className="w-5 h-5 research-bounce" />
              </div>
              <div>
                <span className="font-bold text-lg">調査が完了しました！</span>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  レポートを生成しています
                  <span className="research-progress-dots ml-1"></span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 詳細統計 */}
        <div className="
          grid grid-cols-2 gap-6 pt-6 
          border-t-2 border-purple-100 dark:border-purple-800
          research-slide-up
        " style={{ animationDelay: '0.5s' }}>
          <div className="
            text-center p-4 
            bg-gradient-to-r from-purple-50 to-purple-100 
            dark:from-purple-900/20 dark:to-purple-800/20
            rounded-lg border border-purple-200 dark:border-purple-700
            shadow-sm hover:shadow-md transition-all duration-300
            research-card-hover
          ">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 research-pulse">
              {completedQueries.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">完了</div>
          </div>
          <div className="
            text-center p-4 
            bg-gradient-to-r from-blue-50 to-blue-100 
            dark:from-blue-900/20 dark:to-blue-800/20
            rounded-lg border border-blue-200 dark:border-blue-700
            shadow-sm hover:shadow-md transition-all duration-300
            research-card-hover
          ">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 research-pulse">
              {totalSearches - completedQueries.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">残り</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
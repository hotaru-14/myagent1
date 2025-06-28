"use client";

import { CheckCircle, Edit, XCircle, Clock, Search, Target, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { getResearchTheme } from '@/lib/constants/research-theme';

interface SearchPlan {
  topic: string;
  goals: string[];
  queries: string[];
  scope: string;
  estimatedTime: string;
  planId: string;
}

interface ResearchApprovalMessageProps {
  searchPlan: SearchPlan;
  onApprove?: (planId: string) => void;
  onModify?: (planId: string, modifications: string) => void;
  onCancel?: (planId: string) => void;
  isInteractive?: boolean;
  className?: string;
}

export function ResearchApprovalMessage({
  searchPlan,
  onApprove,
  onModify,
  onCancel,
  isInteractive = true,
  className = ""
}: ResearchApprovalMessageProps) {
  const [isModifying, setIsModifying] = useState(false);
  const [modifications, setModifications] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 研究テーマの取得（今後ダークモード対応で使用）
  const theme = getResearchTheme();

  const handleApprove = async () => {
    if (!onApprove || isLoading) return;
    setIsLoading(true);
    try {
      await onApprove(searchPlan.planId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = async () => {
    if (!onModify || !modifications.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await onModify(searchPlan.planId, modifications);
      setIsModifying(false);
      setModifications("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel || isLoading) return;
    setIsLoading(true);
    try {
      await onCancel(searchPlan.planId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`
      research-fade-in research-card-hover
      bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100 
      border-purple-200 shadow-lg hover:shadow-xl 
      transition-all duration-500 ease-out
      dark:from-purple-950 dark:via-purple-900 dark:to-purple-800 
      dark:border-purple-700
      ${className}
    `}>
      <CardHeader className="
        bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 
        text-white rounded-t-lg relative overflow-hidden
        research-shimmer
      ">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold relative z-10">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Search className="w-5 h-5 research-pulse" />
          </div>
          <span className="flex items-center gap-2">
            調査計画の確認
            <Sparkles className="w-4 h-4 text-yellow-300 research-glow" />
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* 調査対象 */}
        <div className="space-y-3 research-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-purple-100 rounded-lg dark:bg-purple-800">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">調査対象</h3>
          </div>
          <div className="
            bg-gradient-to-r from-white to-purple-50 
            dark:from-gray-800 dark:to-purple-900/20
            p-4 rounded-lg border border-purple-200 dark:border-purple-700
            shadow-sm hover:shadow-md transition-all duration-300
            research-button-hover
          ">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {searchPlan.topic}
            </p>
          </div>
        </div>

        {/* 調査目標 */}
        <div className="space-y-3 research-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-purple-100 rounded-lg dark:bg-purple-800">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">調査目標</h3>
          </div>
          <ul className="space-y-2">
            {searchPlan.goals.map((goal, index) => (
              <li 
                key={index}
                className="
                  flex items-start gap-3 
                  bg-gradient-to-r from-white to-green-50 
                  dark:from-gray-800 dark:to-green-900/20
                  p-3 rounded-lg border border-green-200 dark:border-green-700
                  shadow-sm hover:shadow-md transition-all duration-300
                  research-button-hover research-fade-in
                "
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="p-1 bg-green-100 rounded-full dark:bg-green-800 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-300" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                  {goal}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 予定検索クエリ */}
        <div className="space-y-3 research-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-purple-100 rounded-lg dark:bg-purple-800">
              <Search className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              予定検索クエリ
              <Badge 
                variant="secondary" 
                className="
                  ml-3 bg-purple-100 text-purple-700 border border-purple-200
                  dark:bg-purple-800 dark:text-purple-200 dark:border-purple-700
                  research-pulse
                "
              >
                {searchPlan.queries.length}件
              </Badge>
            </h3>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {searchPlan.queries.map((query, index) => (
              <div 
                key={index}
                className="
                  flex items-center gap-3 
                  bg-gradient-to-r from-white to-blue-50 
                  dark:from-gray-800 dark:to-blue-900/20
                  p-3 rounded-lg border border-blue-200 dark:border-blue-700
                  shadow-sm hover:shadow-md transition-all duration-300
                  research-button-hover research-fade-in
                "
                style={{ animationDelay: `${0.4 + index * 0.05}s` }}
              >
                <div className="
                  flex items-center justify-center w-7 h-7 
                  bg-purple-500 text-white text-xs font-bold rounded-full
                  research-pulse
                  dark:bg-purple-600
                ">
                  {index + 1}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                  {query}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 調査範囲と予想時間 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 research-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-purple-100 rounded-lg dark:bg-purple-800">
                <Eye className="w-4 h-4 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">調査範囲</h3>
            </div>
            <div className="
              bg-gradient-to-r from-white to-amber-50 
              dark:from-gray-800 dark:to-amber-900/20
              p-4 rounded-lg border border-amber-200 dark:border-amber-700
              shadow-sm hover:shadow-md transition-all duration-300
              research-button-hover
            ">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {searchPlan.scope}
              </p>
            </div>
          </div>
          
          <div className="space-y-3 research-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-purple-100 rounded-lg dark:bg-purple-800">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-300 research-pulse" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">予想所要時間</h3>
            </div>
            <div className="
              bg-gradient-to-r from-white to-indigo-50 
              dark:from-gray-800 dark:to-indigo-900/20
              p-4 rounded-lg border border-indigo-200 dark:border-indigo-700
              shadow-sm hover:shadow-md transition-all duration-300
              research-button-hover
            ">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                {searchPlan.estimatedTime}
              </p>
            </div>
          </div>
        </div>

        {/* 修正入力フィールド */}
        {isModifying && (
          <div className="space-y-3 research-slide-up research-fade-in">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <Edit className="w-4 h-4 text-purple-600 dark:text-purple-300" />
              修正要求・追加指示
            </label>
            <textarea
              value={modifications}
              onChange={(e) => setModifications(e.target.value)}
              placeholder="調査計画への修正要求や追加指示をお書きください..."
              className="
                w-full p-4 
                bg-gradient-to-r from-white to-purple-50 
                dark:from-gray-800 dark:to-purple-900/20
                border-2 border-purple-200 dark:border-purple-700 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                dark:focus:ring-purple-400 dark:focus:border-purple-400
                transition-all duration-300 resize-none
                text-gray-700 dark:text-gray-300
                research-input-focus
              "
              rows={4}
              disabled={isLoading}
            />
          </div>
        )}

        {/* アクションボタン */}
        {isInteractive && (
          <div className="
            flex flex-col sm:flex-row gap-4 pt-6 
            border-t-2 border-purple-100 dark:border-purple-800
            research-slide-up
          " style={{ animationDelay: '0.6s' }}>
            {!isModifying ? (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="
                    bg-gradient-to-r from-green-500 to-emerald-600 
                    hover:from-green-600 hover:to-emerald-700
                    text-white font-semibold px-6 py-3 rounded-lg
                    flex items-center justify-center gap-2
                    shadow-lg hover:shadow-xl
                    transition-all duration-300 transform
                    research-button-hover research-glow
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex-1 sm:flex-none
                  "
                >
                  <CheckCircle className={`w-5 h-5 ${isLoading ? 'research-spin' : ''}`} />
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      承認中
                      <div className="research-progress-dots"></div>
                    </span>
                  ) : "承認して調査開始"}
                </Button>
                
                <Button
                  onClick={() => setIsModifying(true)}
                  disabled={isLoading}
                  className="
                    bg-gradient-to-r from-purple-50 to-purple-100 
                    hover:from-purple-100 hover:to-purple-200
                    dark:from-purple-900/50 dark:to-purple-800/50
                    dark:hover:from-purple-800/60 dark:hover:to-purple-700/60
                    text-purple-700 dark:text-purple-200 font-semibold px-6 py-3 rounded-lg
                    border-2 border-purple-300 dark:border-purple-600
                    hover:border-purple-400 dark:hover:border-purple-500
                    flex items-center justify-center gap-2
                    shadow-md hover:shadow-lg
                    transition-all duration-300 transform
                    research-button-hover
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex-1 sm:flex-none
                  "
                >
                  <Edit className="w-4 h-4" />
                  修正を要求
                </Button>
                
                <Button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="
                    bg-gradient-to-r from-red-50 to-red-100 
                    hover:from-red-100 hover:to-red-200
                    dark:from-red-900/50 dark:to-red-800/50
                    dark:hover:from-red-800/60 dark:hover:to-red-700/60
                    text-red-700 dark:text-red-200 font-semibold px-6 py-3 rounded-lg
                    border-2 border-red-300 dark:border-red-600
                    hover:border-red-400 dark:hover:border-red-500
                    flex items-center justify-center gap-2
                    shadow-md hover:shadow-lg
                    transition-all duration-300 transform
                    research-button-hover
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex-1 sm:flex-none
                  "
                >
                  <XCircle className="w-4 h-4" />
                  調査を中止
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleModify}
                  disabled={isLoading || !modifications.trim()}
                  className="
                    bg-gradient-to-r from-purple-500 to-purple-600 
                    hover:from-purple-600 hover:to-purple-700
                    text-white font-semibold px-6 py-3 rounded-lg
                    flex items-center justify-center gap-2
                    shadow-lg hover:shadow-xl
                    transition-all duration-300 transform
                    research-button-hover research-glow
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex-1 sm:flex-none
                  "
                >
                  <Edit className={`w-5 h-5 ${isLoading ? 'research-spin' : ''}`} />
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      送信中
                      <div className="research-progress-dots"></div>
                    </span>
                  ) : "修正要求を送信"}
                </Button>
                
                <Button
                  onClick={() => {
                    setIsModifying(false);
                    setModifications("");
                  }}
                  disabled={isLoading}
                  className="
                    bg-gradient-to-r from-gray-50 to-gray-100 
                    hover:from-gray-100 hover:to-gray-200
                    dark:from-gray-800 dark:to-gray-700
                    dark:hover:from-gray-700 dark:hover:to-gray-600
                    text-gray-700 dark:text-gray-200 font-semibold px-6 py-3 rounded-lg
                    border-2 border-gray-300 dark:border-gray-600
                    hover:border-gray-400 dark:hover:border-gray-500
                    flex items-center justify-center gap-2
                    shadow-md hover:shadow-lg
                    transition-all duration-300 transform
                    research-button-hover
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex-1 sm:flex-none
                  "
                >
                  キャンセル
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
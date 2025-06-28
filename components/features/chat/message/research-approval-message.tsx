"use client";

import { CheckCircle, Edit, XCircle, Clock, Search, Target, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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
    <Card className={`bg-purple-50 border-purple-200 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="w-5 h-5" />
          調査計画の確認
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* 調査対象 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900">調査対象</h3>
          </div>
          <p className="text-gray-700 bg-white p-3 rounded-md border">
            {searchPlan.topic}
          </p>
        </div>

        {/* 調査目標 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900">調査目標</h3>
          </div>
          <ul className="space-y-1">
            {searchPlan.goals.map((goal, index) => (
              <li 
                key={index}
                className="flex items-start gap-2 text-gray-700 bg-white p-2 rounded-md border"
              >
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{goal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 予定検索クエリ */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900">
              予定検索クエリ
              <Badge variant="secondary" className="ml-2">
                {searchPlan.queries.length}件
              </Badge>
            </h3>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {searchPlan.queries.map((query, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded-md border"
              >
                <span className="text-purple-500 font-medium min-w-[2rem]">
                  {index + 1}.
                </span>
                <span>{query}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 調査範囲と予想時間 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-gray-900">調査範囲</h3>
            </div>
            <p className="text-sm text-gray-700 bg-white p-3 rounded-md border">
              {searchPlan.scope}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-gray-900">予想所要時間</h3>
            </div>
            <p className="text-sm text-gray-700 bg-white p-3 rounded-md border">
              {searchPlan.estimatedTime}
            </p>
          </div>
        </div>

        {/* 修正入力フィールド */}
        {isModifying && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              修正要求・追加指示
            </label>
            <textarea
              value={modifications}
              onChange={(e) => setModifications(e.target.value)}
              placeholder="調査計画への修正要求や追加指示をお書きください..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              disabled={isLoading}
            />
          </div>
        )}

        {/* アクションボタン */}
        {isInteractive && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {!isModifying ? (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isLoading ? "承認中..." : "承認して調査開始"}
                </Button>
                
                <Button
                  onClick={() => setIsModifying(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  修正を要求
                </Button>
                
                <Button
                  onClick={handleCancel}
                  disabled={isLoading}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2"
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
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {isLoading ? "送信中..." : "修正要求を送信"}
                </Button>
                
                <Button
                  onClick={() => {
                    setIsModifying(false);
                    setModifications("");
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
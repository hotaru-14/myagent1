"use client";

import { 
  isResearchPlanMessage, 
  isResearchProgressMessage, 
  isResearchReportMessage,
  extractPlanData,
  extractProgressData,
  extractReportMetadata
} from "@/lib/utils/research-message-utils";
import { ResearchApprovalMessage } from "./research-approval-message";
import { ResearchProgress } from "./research-progress";
import { ResearchReport } from "./research-report";
import { useResearchInteraction } from "@/lib/hooks/use-research-interaction";

interface MessageContentProps {
  content: string;
  role: "user" | "assistant";
  agentId?: string;
  isStreaming?: boolean;
  conversationId?: string;
  className?: string;
}

export function MessageContent({ 
  content, 
  role, 
  agentId,
  isStreaming = false,
  conversationId,
  className = "" 
}: MessageContentProps) {
  // 研究エージェント用インタラクション機能（Phase 4.1実装）
  const researchInteraction = useResearchInteraction({
    conversationId,
    autoSave: true
  });
  const baseClasses = "rounded-lg px-4 py-2";
  const roleClasses = role === "user" 
    ? "bg-green-500 text-white" 
    : "bg-gray-100 text-gray-900";

  // 研究エージェントからのメッセージの場合、特殊な処理を行う
  if (role === "assistant" && agentId === "researchAgent") {
    // 🔍 検索計画メッセージの場合
    if (isResearchPlanMessage(content)) {
      try {
        const planData = extractPlanData(content);
        return (
          <div className={className}>
            <ResearchApprovalMessage 
              searchPlan={planData}
              isInteractive={true}
              onApprove={researchInteraction.handleApproval}
              onModify={researchInteraction.handleModification}
              onCancel={researchInteraction.handleCancellation}
            />
          </div>
        );
      } catch (error) {
        console.error("Error rendering research approval message:", error);
        // フォールバック: 通常のメッセージ表示
      }
    }
    
    // 📊 検索進捗メッセージの場合
    if (isResearchProgressMessage(content)) {
      try {
        const progressData = extractProgressData(content);
        return (
          <div className={className}>
            <ResearchProgress progressData={progressData} />
          </div>
        );
      } catch (error) {
        console.error("Error rendering research progress message:", error);
        // フォールバック: 通常のメッセージ表示
      }
    }
    
    // 📋 最終レポートメッセージの場合
    if (isResearchReportMessage(content)) {
      try {
        const reportMetadata = extractReportMetadata(content);
        return (
          <div className={className}>
            <ResearchReport 
              content={content}
              citations={reportMetadata.citations}
              reliabilityScore={reportMetadata.reliabilityScore}
              downloadable={true}
              title="調査レポート"
            />
          </div>
        );
      } catch (error) {
        console.error("Error rendering research report message:", error);
        // フォールバック: 通常のメッセージ表示
      }
    }
  }
  
  // 通常のメッセージ表示（研究エージェント以外 または 特殊メッセージではない場合）
  return (
    <div className={`${baseClasses} ${roleClasses} ${className}`}>
      <div className="text-sm whitespace-pre-wrap break-words">
        {content}
        {isStreaming && role === "assistant" && (
          <span className="inline-block w-2 h-4 bg-gray-600 ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
} 
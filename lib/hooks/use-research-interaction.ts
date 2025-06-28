// ==========================================
// 研究エージェント インタラクション管理フック
// ==========================================

"use client";

import { useCallback, useState } from 'react';
import { useChatInputManager } from './use-chat-input-manager';

interface UseResearchInteractionProps {
  conversationId?: string;
  autoSave?: boolean;
}

interface InteractionState {
  isProcessing: boolean;
  lastAction?: 'approve' | 'modify' | 'cancel';
  error?: string;
}

/**
 * 研究エージェントのインタラクション機能を管理するフック
 * 
 * @param props - 設定オプション
 * @returns インタラクション関数と状態
 */
export function useResearchInteraction({
  conversationId,
  autoSave = true
}: UseResearchInteractionProps = {}) {
  
  const [state, setState] = useState<InteractionState>({
    isProcessing: false
  });

  const chatInputManager = useChatInputManager({
    conversationId,
    autoSave
  });

  /**
   * 検索計画を承認して調査を開始
   * 
   * @param planId - 計画ID
   */
  const handleApproval = useCallback(async (planId: string): Promise<void> => {
    if (state.isProcessing) {
      console.warn('Another interaction is already in progress');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      lastAction: 'approve',
      error: undefined 
    }));

    try {
      // 承認メッセージを構築
      const approvalMessage = `[USER_ACTION:APPROVE] [PLAN_ID:${planId}]

承認します。この調査計画で研究を開始してください。`;

      console.log('Sending approval for plan:', planId);
      
      // チャット入力管理を通じてメッセージを送信
      // 入力値を設定してフォームサブミットをトリガー
      chatInputManager.handleInputChange(approvalMessage);
      
      // FormEventをシミュレート
      const fakeEvent = {
        preventDefault: () => {},
        target: {},
        currentTarget: {}
      } as React.FormEvent<HTMLFormElement>;
      
      await chatInputManager.handleSubmit(fakeEvent);
      
      console.log('Research approval sent successfully');
      
    } catch (error) {
      console.error('Failed to send research approval:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '承認の送信に失敗しました' 
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.isProcessing, chatInputManager]);

  /**
   * 検索計画の修正を要求
   * 
   * @param planId - 計画ID
   * @param modifications - 修正内容
   */
  const handleModification = useCallback(async (
    planId: string, 
    modifications: string
  ): Promise<void> => {
    if (state.isProcessing) {
      console.warn('Another interaction is already in progress');
      return;
    }

    if (!modifications.trim()) {
      throw new Error('修正内容を入力してください');
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      lastAction: 'modify',
      error: undefined 
    }));

    try {
      // 修正要求メッセージを構築
      const modificationMessage = `[USER_ACTION:MODIFY] [PLAN_ID:${planId}]

以下の修正を要求します：

${modifications.trim()}

修正後の調査計画を再提示してください。`;

      console.log('Sending modification request for plan:', planId);
      
      // チャット入力管理を通じてメッセージを送信
      // 入力値を設定してフォームサブミットをトリガー
      chatInputManager.handleInputChange(modificationMessage);
      
      // FormEventをシミュレート
      const fakeEvent = {
        preventDefault: () => {},
        target: {},
        currentTarget: {}
      } as React.FormEvent<HTMLFormElement>;
      
      await chatInputManager.handleSubmit(fakeEvent);
      
      console.log('Research modification request sent successfully');
      
    } catch (error) {
      console.error('Failed to send research modification:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '修正要求の送信に失敗しました' 
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.isProcessing, chatInputManager]);

  /**
   * 研究を中止
   * 
   * @param planId - 計画ID
   * @param reason - 中止理由（オプション）
   */
  const handleCancellation = useCallback(async (
    planId: string, 
    reason?: string
  ): Promise<void> => {
    if (state.isProcessing) {
      console.warn('Another interaction is already in progress');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      lastAction: 'cancel',
      error: undefined 
    }));

    try {
      // 中止メッセージを構築
      const cancellationMessage = `[USER_ACTION:CANCEL] [PLAN_ID:${planId}]

この調査を中止します。${reason ? `\n\n中止理由: ${reason}` : ''}`;

      console.log('Sending cancellation for plan:', planId);
      
      // チャット入力管理を通じてメッセージを送信
      // 入力値を設定してフォームサブミットをトリガー
      chatInputManager.handleInputChange(cancellationMessage);
      
      // FormEventをシミュレート
      const fakeEvent = {
        preventDefault: () => {},
        target: {},
        currentTarget: {}
      } as React.FormEvent<HTMLFormElement>;
      
      await chatInputManager.handleSubmit(fakeEvent);
      
      console.log('Research cancellation sent successfully');
      
    } catch (error) {
      console.error('Failed to send research cancellation:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '中止要求の送信に失敗しました' 
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.isProcessing, chatInputManager]);

  /**
   * エラー状態をクリア
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  /**
   * 処理状態をリセット
   */
  const resetState = useCallback(() => {
    setState({
      isProcessing: false
    });
  }, []);

  return {
    // 状態
    isProcessing: state.isProcessing,
    lastAction: state.lastAction,
    error: state.error,
    
    // インタラクション関数
    handleApproval,
    handleModification,
    handleCancellation,
    
    // ユーティリティ関数
    clearError,
    resetState,
    
    // 基盤となるチャット管理オブジェクト（デバッグ用）
    chatInputManager: chatInputManager
  };
} 
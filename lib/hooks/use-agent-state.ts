// ==========================================
// エージェント状態管理フック
// ==========================================

"use client"

import { useState, useCallback, useEffect } from 'react'
import type { Agent, AgentState, AgentChangeEvent } from '@/lib/types/agent'
import { DEFAULT_AGENT_ID, getAgentById, getAllAgents } from '@/lib/constants/agents'

interface UseAgentStateProps {
  initialAgentId?: string
  onAgentChange?: (event: AgentChangeEvent) => void
}

export function useAgentState({ 
  initialAgentId = DEFAULT_AGENT_ID, 
  onAgentChange 
}: UseAgentStateProps = {}) {
  
  const [state, setState] = useState<AgentState>({
    currentAgentId: initialAgentId,
    lastAgentId: null,
    isChanging: false
  })

  const [availableAgents] = useState<Agent[]>(getAllAgents())

  // 現在のエージェント情報を取得
  const currentAgent = getAgentById(state.currentAgentId)
  const lastAgent = state.lastAgentId ? getAgentById(state.lastAgentId) : null

  // エージェントを変更する
  const changeAgent = useCallback((newAgentId: string, conversationId?: string) => {
    const newAgent = getAgentById(newAgentId)
    if (!newAgent || newAgentId === state.currentAgentId) {
      return
    }

    setState(prev => ({ ...prev, isChanging: true }))

    // 短い遅延でUI反応を改善
    setTimeout(() => {
      setState(prev => ({
        currentAgentId: newAgentId,
        lastAgentId: prev.currentAgentId,
        isChanging: false
      }))

      // コールバック実行
      onAgentChange?.({
        fromAgentId: state.currentAgentId,
        toAgentId: newAgentId,
        conversationId,
        timestamp: new Date()
      })
    }, 100)
  }, [state.currentAgentId, onAgentChange])

  // エージェントを初期化/リセット
  const resetAgent = useCallback((agentId: string = DEFAULT_AGENT_ID) => {
    setState({
      currentAgentId: agentId,
      lastAgentId: null,
      isChanging: false
    })
  }, [])

  // ローカルストレージからエージェント設定を復元
  const restoreFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('last-selected-agent')
      if (saved && getAgentById(saved)) {
        setState(prev => ({
          ...prev,
          currentAgentId: saved
        }))
      }
    } catch (error) {
      console.warn('Failed to restore agent from storage:', error)
    }
  }, [])

  // ローカルストレージにエージェント設定を保存
  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem('last-selected-agent', state.currentAgentId)
    } catch (error) {
      console.warn('Failed to save agent to storage:', error)
    }
  }, [state.currentAgentId])

  // マウント時に設定を復元
  useEffect(() => {
    restoreFromStorage()
  }, [restoreFromStorage])

  // エージェント変更時に保存
  useEffect(() => {
    if (state.currentAgentId !== initialAgentId) {
      saveToStorage()
    }
  }, [state.currentAgentId, initialAgentId, saveToStorage])

  return {
    // 状態
    currentAgent,
    lastAgent,
    availableAgents,
    isChanging: state.isChanging,
    currentAgentId: state.currentAgentId,
    lastAgentId: state.lastAgentId,
    
    // アクション
    changeAgent,
    resetAgent,
    restoreFromStorage,
    saveToStorage
  }
} 
// ==========================================
// エージェント関連ユーティリティ関数
// ==========================================

import type { Message, ConversationWithDetails } from '@/lib/types/chat'
import type { Agent, ConversationAgent } from '@/lib/types/agent'
import { DEFAULT_AGENT_ID, getAgentById, AVAILABLE_AGENTS } from '@/lib/constants/agents'
import { createClient } from '@/lib/supabase/client'



/**
 * メッセージ配列から最後のエージェントを取得（ローカル版）
 * @param messages メッセージ配列
 * @returns 最後のエージェントID
 */
export function getLastAgentFromMessages(messages: Message[]): string {
  if (!messages.length) return DEFAULT_AGENT_ID
  
  // 最新のメッセージから逆順で探索
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.agent_id && getAgentById(message.agent_id)) {
      return message.agent_id
    }
  }
  
  return DEFAULT_AGENT_ID
}





/**
 * エージェント別のメッセージ統計を取得
 * @param userId ユーザーID
 * @param days 過去何日分のデータを取得するか（デフォルト: 30日）
 * @returns エージェント別統計
 */
export async function getAgentUsageStats(userId: string, days: number = 30) {
  try {
    const supabase = createClient()
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        agent_id,
        created_at,
        conversations!inner(user_id)
      `)
      .eq('conversations.user_id', userId)
      .gte('created_at', since.toISOString())

    if (error || !messages) {
      console.error('Error getting agent usage stats:', error)
      return []
    }

    const stats = messages.reduce((acc, message) => {
      const agentId = message.agent_id
      if (!acc[agentId]) {
        acc[agentId] = {
          agentId,
          agent: getAgentById(agentId),
          messageCount: 0,
          lastUsedAt: message.created_at,
          firstUsedAt: message.created_at
        }
      }
      acc[agentId].messageCount++
      acc[agentId].lastUsedAt = message.created_at
      
      // 最初の使用日時を更新
      if (new Date(message.created_at) < new Date(acc[agentId].firstUsedAt)) {
        acc[agentId].firstUsedAt = message.created_at
      }
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(stats).sort((a: any, b: any) => b.messageCount - a.messageCount)
    
  } catch (error) {
    console.error('Error getting agent usage stats:', error)
    return []
  }
}

/**
 * 会話に参加した全エージェントのリストを取得
 * @param conversationId 会話ID
 * @returns 参加エージェントのリスト
 */
export async function getConversationAgents(conversationId: string): Promise<Agent[]> {
  try {
    const supabase = createClient()
    
    const { data: agentIds, error } = await supabase
      .from('messages')
      .select('agent_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error || !agentIds) {
      console.error('Error getting conversation agents:', error)
      return []
    }

    // 重複を除去して、エージェント情報を取得
    const uniqueAgentIds = [...new Set(agentIds.map(item => item.agent_id))]
    const agents = uniqueAgentIds
      .map(id => getAgentById(id))
      .filter((agent): agent is Agent => agent !== null)

    return agents
    
  } catch (error) {
    console.error('Error getting conversation agents:', error)
    return []
  }
} 
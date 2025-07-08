// ==========================================
// 利用可能エージェント定数定義
// ==========================================

import type { Agent } from '@/lib/types/agent'

export const AVAILABLE_AGENTS: Record<string, Agent> = {
  weatherAgent: {
    id: 'weatherAgent',
    name: '天気エージェント',
    description: '天気情報と活動提案を提供します',
    icon: '🌤️',
    color: 'blue',
    placeholder: '',
    instructions: `
      天気情報の提供と、その日の天気に基づいた活動提案を行います。
      - リアルタイムの天気データを取得
      - 詳細な天気予報の説明
      - 天気に適したアクティビティの提案
      - 服装やお出かけのアドバイス
    `
  },
  researchAgent: {
    id: 'researchAgent',
    name: '自律的研究エージェント',
    description: '包括的調査とレポート作成を提供します',
    icon: '🔍',
    color: 'purple',
    placeholder: '調査したいトピックを入力してください（例：AI市場の動向、最新のWebフレームワーク比較）',
    instructions: `
      高度な自律研究エージェントです。複数角度からの情報収集と分析レポートを提供します。
      - リアルタイムWeb検索による情報収集
      - 多角的視点での包括的調査  
      - 信頼性評価付きの詳細レポート作成
      - 検索計画の事前確認システム
    `
  },
  culinaryAgent: {
    id: 'culinaryAgent',
    name: '料理エージェント',
    description: '料理レシピ検索と調理アドバイスを提供します',
    icon: '🍳',
    color: 'red',
    placeholder: '料理に関する質問を入力してください（例：鶏胸肉を使った簡単レシピ、糖質制限レシピ）',
    instructions: `
      専門的な料理研究家として包括的な料理サポートを提供します。
      - 30万件以上のレシピデータベースから最適なレシピを検索
      - 手持ち食材から作れる料理を提案
      - 食事制限（糖質制限、アレルギー対応）に対応
      - 栄養バランスと調理のコツを詳しく解説
      - 日本の食文化に合わせたアレンジを提案
    `
  }
} as const

export const DEFAULT_AGENT_ID = 'weatherAgent'

export const AGENT_COLORS = {
  blue: 'bg-blue-500 text-white border-blue-200 hover:bg-blue-600',
  gray: 'bg-gray-500 text-white border-gray-200 hover:bg-gray-600',
  green: 'bg-green-500 text-white border-green-200 hover:bg-green-600',
  purple: 'bg-purple-500 text-white border-purple-200 hover:bg-purple-600',
  red: 'bg-red-500 text-white border-red-200 hover:bg-red-600',
  yellow: 'bg-yellow-500 text-white border-yellow-200 hover:bg-yellow-600'
} as const

export const getAgentById = (agentId: string): Agent | null => {
  return AVAILABLE_AGENTS[agentId] || null
}

export const getAllAgents = (): Agent[] => {
  return Object.values(AVAILABLE_AGENTS)
}

export const getAgentOptions = () => {
  return getAllAgents().map(agent => ({
    value: agent.id,
    label: agent.name,
    description: agent.description,
    icon: agent.icon,
    color: agent.color
  }))
} 
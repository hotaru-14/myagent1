// ==========================================
// エージェント関連の型定義
// ==========================================

export interface Agent {
  id: string
  name: string
  description: string
  icon: string
  color: string
  placeholder: string
  instructions: string
  isActive?: boolean
}

export interface AgentOption {
  value: string
  label: string
  description?: string
  icon?: string
  color?: string
}

export interface AgentState {
  currentAgentId: string
  lastAgentId: string | null
  isChanging: boolean
}

export interface AgentSelector {
  selectedAgent: Agent
  onAgentChange: (agentId: string) => void
  availableAgents: Agent[]
  disabled?: boolean
}

export interface ConversationAgent {
  conversationId: string
  lastAgentId: string
  lastMessageAt: string
}

// エージェント切り替え時のイベント型
export interface AgentChangeEvent {
  fromAgentId: string | null
  toAgentId: string
  conversationId?: string
  timestamp: Date
}

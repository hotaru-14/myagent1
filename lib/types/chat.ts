// ==========================================
// チャット機能の型定義
// ==========================================

// データベーステーブルの型定義（agent_id削除後）
export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  // agent_id は削除済み（メッセージ単位で管理）
}

// 一時的な会話の型（DB保存前の状態）
export interface TemporaryConversation {
  id: string  // temp-で始まる一時ID
  title: string
  isTemporary: true
  user_id?: string  // 認証前は不明な場合がある
}

// 会話の状態を表すユニオン型
export type ConversationState = Conversation | TemporaryConversation

export interface Message {
  id: string
  conversation_id: string
  agent_id: string  // エージェント情報はメッセージ単位で管理
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// 新規作成用の型
export interface NewConversation {
  user_id: string
  title: string
  // agent_id は不要（メッセージ単位で管理）
}

export interface NewMessage {
  conversation_id: string
  agent_id: string  // 必須フィールドとして追加
  role: 'user' | 'assistant'
  content: string
}

// 更新用の型
export interface UpdateConversation {
  title?: string
  updated_at?: string
}

// AI-SDK React用のメッセージ型（エージェント情報付き）
export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  agentId?: string  // エージェント情報を追加
  createdAt?: string
}

// 会話リスト表示用の拡張型（最後のエージェント情報付き）
export interface ConversationWithDetails extends Conversation {
  last_message: string | null
  last_message_at: string | null
  last_agent_id: string | null  // 最後に使用されたエージェント
}

// 会話の詳細（メッセージ含む）
export interface ConversationDetail extends Conversation {
  messages: Message[]
}

// チャットフック用の型（エージェント情報付き）
export interface ChatState {
  currentConversation: Conversation | null
  conversations: ConversationWithDetails[]
  currentAgentId: string  // 現在選択中のエージェント
  isLoading: boolean
  error: string | null
}

// API レスポンス用の型
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// チャット設定の型（エージェント情報付き）
export interface ChatConfig {
  maxMessages?: number
  autoSave?: boolean
  title?: string
  defaultAgentId?: string  // デフォルトエージェント
}

// エージェント別メッセージ統計用の型
export interface AgentMessageStats {
  agentId: string
  messageCount: number
  lastUsedAt: string
  conversationId: string
} 
// ==========================================
// チャット機能の型定義
// ==========================================

// データベーステーブルの型定義（agent_id削除後）
export interface Conversation {
  id: string  // UUID形式の永続ID
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

// 新しいメッセージ作成用のデータ型
export interface NewMessage {
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  agent_id: string;
}

// メッセージの型定義
export interface Message {
  id: string  // UUID形式の永続ID
  conversation_id: string
  agent_id: string  // メッセージを生成したエージェントのID
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// 新しい会話作成用のデータ型
export interface NewConversation {
  user_id: string;
  title: string;
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

// UI用の拡張メッセージ型
export interface UIMessage extends Message {
  isLoading?: boolean;
  error?: string;
}

// エラーハンドリング用の型
export interface ChatError {
  message: string;
  code?: string;
  timestamp: string;
}

// チャット状態の型定義
export interface ChatState {
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: ChatError | null;
}

// 詳細情報付きの会話型（会話一覧表示用）
export interface ConversationWithDetails extends Conversation {
  last_message?: string;
  last_message_at?: string;
  message_count?: number;
}

// 会話の詳細（メッセージ含む）
export interface ConversationDetail extends Conversation {
  messages: Message[]
}

// チャットフック用の型（エージェント情報付き）
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
// ==========================================
// チャットストレージフック
// Supabaseとの連携を管理
// ==========================================

"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmptyConversationCleanup } from './use-empty-conversation-cleanup'
import type { 
  Conversation, 
  Message, 
  NewConversation, 
  NewMessage, 
  ConversationWithDetails
} from '@/lib/types/chat'

// ストレージ専用のState型（エージェント状態は別途管理）
interface StorageState {
  currentConversation: Conversation | null
  conversations: ConversationWithDetails[]
  isLoading: boolean
  error: string | null
}

export function useChatStorage() {
  const supabase = createClient()
  
  const [state, setState] = useState<StorageState>({
    currentConversation: null,
    conversations: [],
    isLoading: false,
    error: null
  })

  // 空会話の自動クリーンアップを有効化
  const { manualCleanup } = useEmptyConversationCleanup({
    enabled: true,
    intervalMinutes: 5, // 5分間隔
    onCleanup: (deletedCount) => {
      if (deletedCount > 0) {
        console.log(`🧹 [ChatStorage] Auto-cleaned ${deletedCount} empty conversations`);
        // クリーンアップ後、会話リストを再読み込み
        loadConversations();
      }
    }
  })

  // エラーハンドリング
  const handleError = useCallback((error: Error | unknown, action: string) => {
    console.error(`Error in ${action}:`, error)
    const errorMessage = error instanceof Error ? error.message : `Failed to ${action}`
    setState(prev => ({ 
      ...prev, 
      error: errorMessage,
      isLoading: false 
    }))
  }, [])

  // 新しい会話を作成
  const createConversation = useCallback(async (title: string): Promise<Conversation | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ユーザーが認証されていません')
      }

      const newConversation: NewConversation = {
        user_id: user.id,
        title: title || '新しい会話'
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert(newConversation)
        .select()
        .single()

      if (error) throw error

      setState(prev => ({ 
        ...prev, 
        currentConversation: data,
        isLoading: false 
      }))

      // 会話リストを更新
      await loadConversations()
      
      return data
    } catch (error) {
      handleError(error, 'create conversation')
      return null
    }
  }, [supabase, handleError])

  // メッセージを保存
  const saveMessage = useCallback(async (
    conversationId: string, 
    role: 'user' | 'assistant', 
    content: string,
    agentId: string
  ): Promise<Message | null> => {
    try {
      const newMessage: NewMessage = {
        conversation_id: conversationId,
        role,
        content,
        agent_id: agentId
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single()

      if (error) throw error

      // 会話の更新日時を更新
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      return data
    } catch (error) {
      handleError(error, 'save message')
      return null
    }
  }, [supabase, handleError])

  // 空の会話をクリーンアップ
  const cleanupEmptyConversations = useCallback(async (): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('cleanup_empty_conversations')
      
      if (error) throw error
      
      console.log(`🧹 Cleaned up ${data} empty conversations`)
      
      return data || 0
    } catch (error) {
      handleError(error, 'cleanup empty conversations')
      return 0
    }
  }, [supabase, handleError])

  // 会話ID事前確定（一時ID廃止用）
  const ensureConversationExists = useCallback(async (title?: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ユーザーが認証されていません')
      }

      const { data, error } = await supabase.rpc('ensure_conversation_exists', {
        p_user_id: user.id,
        p_title: title || '新しい会話'
      })

      if (error) throw error

      console.log(`✅ Conversation exists: ${data}`)
      
      // 5分後に空の場合は自動削除するためのタイムアウトを設定
      setTimeout(async () => {
        try {
          console.log(`⏰ [ChatStorage] Checking if conversation ${data} is still empty after 5 minutes...`);
          await manualCleanup();
        } catch (err) {
          console.warn('Failed to cleanup conversation after timeout:', err);
        }
      }, 5 * 60 * 1000); // 5分

      return data
    } catch (error) {
      handleError(error, 'ensure conversation exists')
      return null
    }
  }, [supabase, handleError, manualCleanup])

  // 会話リストを取得
  const loadConversations = useCallback(async (): Promise<ConversationWithDetails[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ユーザーが認証されていません')
      }

      // 空会話の事前クリーンアップを実行
      console.log('🧹 Cleaning up empty conversations before loading...')
      await cleanupEmptyConversations()

      // メッセージがある会話のみを取得（空会話を自動的に除外）
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!inner(
            content,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // 会話の詳細情報を計算
      const conversationsWithDetails: ConversationWithDetails[] = (data || []).map((conv) => {
        const messages = conv.messages || []
        const lastMessage = messages[messages.length - 1]
        
        return {
          ...conv,
          last_message: lastMessage?.content || null,
          last_message_at: lastMessage?.created_at || null,
          message_count: messages.length // メッセージ数を明示的に追加
        }
      })

      // 追加の安全チェック: メッセージ数が0の会話を除外
      const validConversations = conversationsWithDetails.filter(conv => 
        conv.message_count && conv.message_count > 0
      )

      setState(prev => ({ 
        ...prev, 
        conversations: validConversations,
        isLoading: false 
      }))

      console.log(`✅ Loaded ${validConversations.length} valid conversations (${conversationsWithDetails.length - validConversations.length} empty conversations filtered out)`)
      return validConversations
    } catch (error) {
      console.error('❌ Error loading conversations:', error)
      handleError(error, 'load conversations')
      return []
    }
  }, [supabase, handleError, cleanupEmptyConversations])

  // 会話とメッセージを同時に保存（新しい会話の場合）
  const saveMessageWithConversation = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    agentId: string,
    title?: string
  ): Promise<{ conversation: Conversation; message: Message } | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ユーザーが認証されていません')
      }

      // トランザクション的な処理: まず会話を作成
      const newConversation: NewConversation = {
        user_id: user.id,
        title: title || content.slice(0, 30) || '新しい会話'
      }

      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert(newConversation)
        .select()
        .single()

      if (conversationError) throw conversationError

      // 次にメッセージを保存
      const newMessage: NewMessage = {
        conversation_id: conversationData.id,
        role,
        content,
        agent_id: agentId
      }

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single()

      if (messageError) {
        // メッセージ保存に失敗した場合、作成した会話を削除
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationData.id)
        throw messageError
      }

      // 状態を更新
      setState(prev => ({ 
        ...prev, 
        currentConversation: conversationData,
        isLoading: false 
      }))

      // 会話リストを更新
      await loadConversations()

      return {
        conversation: conversationData,
        message: messageData
      }
    } catch (error) {
      handleError(error, 'save message with conversation')
      return null
    }
  }, [supabase, handleError, loadConversations])

  // 新機能：メッセージペア保存（競合状態解決用）
  const saveMessagePair = useCallback(async (
    conversationId: string,
    userContent: string,
    aiContent: string,
    agentId: string
  ): Promise<{ userMessage: Message; aiMessage: Message } | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // トランザクション開始
      const { data, error } = await supabase.rpc('save_message_pair', {
        p_conversation_id: conversationId,
        p_user_content: userContent,
        p_ai_content: aiContent,
        p_agent_id: agentId
      })

      if (error) throw error

      console.log(`✅ Message pair saved to conversation: ${conversationId}`)
      
      // 会話の更新日時を更新
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      setState(prev => ({ ...prev, isLoading: false }))
      
      return data
    } catch (error) {
      console.error('❌ Error saving message pair:', error)
      handleError(error, 'save message pair')
      return null
    }
  }, [supabase, handleError])

  // 新機能：会話作成とメッセージペア保存を一つのトランザクションで実行
  const createConversationWithMessagePair = useCallback(async (
    userContent: string,
    aiContent: string,
    agentId: string,
    title?: string
  ): Promise<{ conversation: Conversation; userMessage: Message; aiMessage: Message } | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ユーザーが認証されていません')
      }

      // RPC関数を使用してトランザクション処理
      const { data, error } = await supabase.rpc('create_conversation_with_message_pair', {
        p_user_id: user.id,
        p_title: title || userContent.slice(0, 30) || '新しい会話',
        p_user_content: userContent,
        p_ai_content: aiContent,
        p_agent_id: agentId
      })

      if (error) throw error

      console.log(`✅ New conversation created with message pair:`, {
        conversationId: data.conversation.id,
        userMessageId: data.userMessage.id,
        aiMessageId: data.aiMessage.id
      })

      // 状態を更新
      setState(prev => ({ 
        ...prev, 
        currentConversation: data.conversation,
        isLoading: false 
      }))

      // 会話リストを更新 (削除し、useEffectで自動的に更新される)
      
      return data
    } catch (error) {
      console.error('❌ Error creating conversation with message pair:', error)
      handleError(error, 'create conversation with message pair')
      return null
    }
  }, [supabase, handleError])

  // 特定の会話のメッセージを取得
  const loadMessages = useCallback(async (conversationId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      handleError(error, 'load messages')
      return []
    }
  }, [supabase, handleError])

  // 会話を削除
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error

      // 現在の会話が削除された場合はクリア
      setState(prev => ({
        ...prev,
        currentConversation: prev.currentConversation?.id === conversationId 
          ? null 
          : prev.currentConversation,
        isLoading: false
      }))

      // 削除後に空会話クリーンアップを実行
      console.log('🧹 [ChatStorage] Running cleanup after conversation deletion...');
      await manualCleanup();

      // 会話リストを更新 (削除し、useEffectで自動的に更新される)
      
      return true
    } catch (error) {
      handleError(error, 'delete conversation')
      return false
    }
  }, [supabase, handleError, manualCleanup])

  // 会話のタイトルを更新
  const updateConversationTitle = useCallback(async (
    conversationId: string, 
    title: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId)

      if (error) throw error

      // 現在の会話タイトルを更新
      setState(prev => ({
        ...prev,
        currentConversation: prev.currentConversation?.id === conversationId
          ? { ...prev.currentConversation, title }
          : prev.currentConversation
      }))

      // 会話リストを更新 (削除し、useEffectで自動的に更新される)
      
      return true
    } catch (error) {
      handleError(error, 'update conversation title')
      return false
    }
  }, [supabase, handleError])

  // 初期化
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    ...state,
    createConversation,
    saveMessage,
    saveMessageWithConversation,
    saveMessagePair,
    createConversationWithMessagePair,
    ensureConversationExists,
    loadConversations,
    loadMessages,
    deleteConversation,
    updateConversationTitle,
    setCurrentConversation: (conversation: Conversation | null) => 
      setState(prev => ({ ...prev, currentConversation: conversation })),
    cleanupEmptyConversations,
    manualCleanup // 手動クリーンアップ機能を追加
  }
} 
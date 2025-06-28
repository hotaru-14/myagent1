// ==========================================
// チャットストレージフック
// Supabaseとの連携を管理
// ==========================================

"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
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

  // 空の会話をクリーンアップする専用関数
  const cleanupEmptyConversations = useCallback(async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // ステップ1: ユーザーの全会話を取得
      const { data: allConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
      
      if (!allConversations || allConversations.length === 0) return
      
      // ステップ2: メッセージがある会話のIDを取得
      const { data: messagesData } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', allConversations.map(c => c.id))
      
      const conversationIdsWithMessages = messagesData?.map(m => m.conversation_id) || []
      
      // ステップ3: メッセージがない会話を特定
      const emptyConversationIds = allConversations
        .filter(c => !conversationIdsWithMessages.includes(c.id))
        .map(c => c.id)
      
      // ステップ4: 空の会話を削除
      if (emptyConversationIds.length > 0) {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .in('id', emptyConversationIds)
        
        if (!error) {
          console.log(`🧹 Cleaned up ${emptyConversationIds.length} empty conversations`)
        } else {
          console.warn('Failed to cleanup empty conversations:', error)
        }
      }
    } catch (error) {
      console.warn('Warning: Failed to cleanup empty conversations:', error)
      // エラーが発生しても処理は続行
    }
  }, [supabase])

  // 会話リストを取得
  const loadConversations = useCallback(async (): Promise<ConversationWithDetails[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('ユーザーが認証されていません')
      }

      // シンプルに：メッセージがある会話のみを取得
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
          last_message_at: lastMessage?.created_at || null
        }
      })

      setState(prev => ({ 
        ...prev, 
        conversations: conversationsWithDetails,
        isLoading: false 
      }))

      console.log(`✅ Loaded ${conversationsWithDetails.length} conversations`)
      return conversationsWithDetails
    } catch (error) {
      console.error('❌ Error loading conversations:', error)
      handleError(error, 'load conversations')
      return []
    }
  }, [supabase, handleError])

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

      // 会話リストを更新
      await loadConversations()
      
      return true
    } catch (error) {
      handleError(error, 'delete conversation')
      return false
    }
  }, [supabase, handleError, loadConversations])

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

      // 会話リストを更新
      await loadConversations()
      
      return true
    } catch (error) {
      handleError(error, 'update conversation title')
      return false
    }
  }, [supabase, handleError, loadConversations])

  // 初期化
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    ...state,
    createConversation,
    saveMessage,
    saveMessageWithConversation,
    loadConversations,
    loadMessages,
    deleteConversation,
    updateConversationTitle,
    setCurrentConversation: (conversation: Conversation | null) => 
      setState(prev => ({ ...prev, currentConversation: conversation })),
    cleanupEmptyConversations
  }
} 
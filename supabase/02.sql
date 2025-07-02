-- ==========================================
-- Database error saving new user の修正
-- ==========================================

-- 既存の問題のあるトリガーと関数を削除
DROP TRIGGER IF EXISTS trigger_create_default_agent_settings ON auth.users;
DROP FUNCTION IF EXISTS public.ensure_default_agent_settings() CASCADE;

-- SECURITY DEFINERを追加した修正版関数
CREATE OR REPLACE FUNCTION public.ensure_default_agent_settings()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER  -- ★これが重要★
AS $$
BEGIN
    -- プロジェクトで実際に使用しているエージェントIDに修正
    INSERT INTO public.agent_settings (user_id, agent_id, is_enabled)
    VALUES 
        (NEW.id, 'weatherAgent', true),     -- weather → weatherAgent
        (NEW.id, 'researchAgent', true)     -- research用エージェント
    ON CONFLICT (user_id, agent_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- トリガーを再作成
CREATE TRIGGER trigger_create_default_agent_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_default_agent_settings();

-- ==========================================
-- 競合状態解決のためのRPC関数（PostgreSQLトランザクション活用）
-- ==========================================

-- メッセージペア保存関数（既存会話用）
CREATE OR REPLACE FUNCTION public.save_message_pair(
    p_conversation_id UUID,
    p_user_content TEXT,
    p_ai_content TEXT,
    p_agent_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_message public.messages%ROWTYPE;
    v_ai_message public.messages%ROWTYPE;
    v_result JSON;
BEGIN
    -- トランザクション内でメッセージペアを保存
    
    -- ユーザーメッセージを挿入
    INSERT INTO public.messages (conversation_id, role, content, agent_id)
    VALUES (p_conversation_id, 'user', p_user_content, p_agent_id)
    RETURNING * INTO v_user_message;
    
    -- AI応答メッセージを挿入
    INSERT INTO public.messages (conversation_id, role, content, agent_id)
    VALUES (p_conversation_id, 'assistant', p_ai_content, p_agent_id)
    RETURNING * INTO v_ai_message;
    
    -- 結果をJSONで返す
    SELECT json_build_object(
        'userMessage', row_to_json(v_user_message),
        'aiMessage', row_to_json(v_ai_message)
    ) INTO v_result;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- エラー時はロールバック（自動）
        RAISE EXCEPTION 'Failed to save message pair: %', SQLERRM;
END;
$$;

-- 会話作成とメッセージペア保存を一つのトランザクションで実行
CREATE OR REPLACE FUNCTION public.create_conversation_with_message_pair(
    p_user_id UUID,
    p_title TEXT,
    p_user_content TEXT,
    p_ai_content TEXT,
    p_agent_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation public.conversations%ROWTYPE;
    v_user_message public.messages%ROWTYPE;
    v_ai_message public.messages%ROWTYPE;
    v_result JSON;
BEGIN
    -- トランザクション内で会話作成とメッセージペア保存
    
    -- 会話を作成
    INSERT INTO public.conversations (user_id, title)
    VALUES (p_user_id, p_title)
    RETURNING * INTO v_conversation;
    
    -- ユーザーメッセージを挿入
    INSERT INTO public.messages (conversation_id, role, content, agent_id)
    VALUES (v_conversation.id, 'user', p_user_content, p_agent_id)
    RETURNING * INTO v_user_message;
    
    -- AI応答メッセージを挿入
    INSERT INTO public.messages (conversation_id, role, content, agent_id)
    VALUES (v_conversation.id, 'assistant', p_ai_content, p_agent_id)
    RETURNING * INTO v_ai_message;
    
    -- 結果をJSONで返す
    SELECT json_build_object(
        'conversation', row_to_json(v_conversation),
        'userMessage', row_to_json(v_user_message),
        'aiMessage', row_to_json(v_ai_message)
    ) INTO v_result;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- エラー時はロールバック（自動）
        RAISE EXCEPTION 'Failed to create conversation with message pair: %', SQLERRM;
END;
$$;

-- 会話ID事前確定関数（一時ID廃止用）
CREATE OR REPLACE FUNCTION public.ensure_conversation_exists(
    p_user_id UUID,
    p_title TEXT DEFAULT '新しい会話'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- 新しい会話を作成
    INSERT INTO public.conversations (user_id, title)
    VALUES (p_user_id, p_title)
    RETURNING id INTO v_conversation_id;
    
    RETURN v_conversation_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to ensure conversation exists: %', SQLERRM;
END;
$$;

-- 空の会話を自動削除する関数
CREATE OR REPLACE FUNCTION public.cleanup_empty_conversations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- メッセージが0件の会話を削除
    DELETE FROM public.conversations 
    WHERE id NOT IN (
        SELECT DISTINCT conversation_id 
        FROM public.messages 
        WHERE conversation_id IS NOT NULL
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- データベース制約の追加（競合状態防止）
-- メッセージの重複を防ぐ制約
DO $$
BEGIN
    -- 同一会話内での重複メッセージを防ぐ制約（内容とタイムスタンプで判定）
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_message_per_conversation'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT unique_message_per_conversation 
        UNIQUE (conversation_id, role, content, created_at);
    END IF;
END
$$;

-- パフォーマンス向上のためのインデックス追加
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON public.conversations(user_id, updated_at DESC);

-- コメント追加
COMMENT ON FUNCTION public.save_message_pair IS 'メッセージペア保存（競合状態解決）';
COMMENT ON FUNCTION public.create_conversation_with_message_pair IS '会話作成とメッセージペア保存を一つのトランザクションで実行';
COMMENT ON FUNCTION public.ensure_conversation_exists IS '会話ID事前確定（一時ID廃止用）';
COMMENT ON FUNCTION public.cleanup_empty_conversations IS '空の会話を自動削除';
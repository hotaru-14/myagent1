-- ==========================================
-- Week 2: データベーススキーマ改善
-- ==========================================

-- メッセージ順序保証のためのsequence_numberカラム追加
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sequence_number INTEGER;

-- 既存メッセージにsequence_numberを設定
DO $$
DECLARE
    conv_id UUID;
    msg_id UUID;
    seq_num INTEGER;
BEGIN
    -- 各会話ごとにsequence_numberを設定
    FOR conv_id IN 
        SELECT DISTINCT conversation_id FROM public.messages WHERE sequence_number IS NULL
    LOOP
        seq_num := 1;
        FOR msg_id IN 
            SELECT id FROM public.messages 
            WHERE conversation_id = conv_id 
            ORDER BY created_at ASC
        LOOP
            UPDATE public.messages 
            SET sequence_number = seq_num 
            WHERE id = msg_id;
            seq_num := seq_num + 1;
        END LOOP;
    END LOOP;
END
$$;

-- sequence_numberをNOT NULLに変更
ALTER TABLE public.messages 
ALTER COLUMN sequence_number SET NOT NULL;

-- sequence_numberのデフォルト値設定関数
CREATE OR REPLACE FUNCTION public.set_message_sequence_number()
RETURNS TRIGGER AS $$
BEGIN
    -- 新しいメッセージのsequence_numberを自動設定
    SELECT COALESCE(MAX(sequence_number), 0) + 1
    INTO NEW.sequence_number
    FROM public.messages
    WHERE conversation_id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- sequence_number自動設定トリガー
CREATE TRIGGER trigger_set_message_sequence_number
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    WHEN (NEW.sequence_number IS NULL)
    EXECUTE FUNCTION public.set_message_sequence_number();

-- 空の会話を防ぐための制約
-- メッセージが削除されて空になった会話の自動削除
CREATE OR REPLACE FUNCTION public.cleanup_empty_conversations_on_message_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- メッセージ削除後、会話にメッセージが0件になったら会話も削除
    IF NOT EXISTS (
        SELECT 1 FROM public.messages 
        WHERE conversation_id = OLD.conversation_id
    ) THEN
        DELETE FROM public.conversations 
        WHERE id = OLD.conversation_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 空会話自動削除トリガー
CREATE TRIGGER trigger_cleanup_empty_conversations
    AFTER DELETE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_empty_conversations_on_message_delete();

-- パフォーマンス最適化のためのインデックス追加
-- メッセージの順序検索最適化
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sequence 
ON public.messages(conversation_id, sequence_number);

-- 時系列検索の最適化
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at);

-- エージェント別検索の最適化
CREATE INDEX IF NOT EXISTS idx_messages_agent_created 
ON public.messages(agent_id, created_at DESC);

-- 会話の最新メッセージ取得最適化
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON public.conversations(user_id, updated_at DESC);

-- 複合インデックス（会話とメッセージの結合最適化）
CREATE INDEX IF NOT EXISTS idx_messages_conversation_role_sequence 
ON public.messages(conversation_id, role, sequence_number);

-- データ整合性制約の追加
-- sequence_numberの重複防止
ALTER TABLE public.messages 
ADD CONSTRAINT unique_conversation_sequence 
UNIQUE (conversation_id, sequence_number);

-- sequence_numberは正の値のみ
ALTER TABLE public.messages 
ADD CONSTRAINT positive_sequence_number 
CHECK (sequence_number > 0);

-- メッセージ内容の最小長チェック
ALTER TABLE public.messages 
ADD CONSTRAINT non_empty_content 
CHECK (length(trim(content)) > 0);

-- 会話タイトルの最小長チェック
ALTER TABLE public.conversations 
ADD CONSTRAINT non_empty_title 
CHECK (length(trim(title)) > 0);

-- パフォーマンス監視用のビュー
CREATE OR REPLACE VIEW public.conversation_metrics AS
SELECT 
    c.id as conversation_id,
    c.user_id,
    c.title,
    c.created_at,
    c.updated_at,
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
    COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_messages,
    COUNT(DISTINCT m.agent_id) as unique_agents,
    MIN(m.created_at) as first_message_at,
    MAX(m.created_at) as last_message_at,
    EXTRACT(EPOCH FROM (MAX(m.created_at) - MIN(m.created_at))) as duration_seconds
FROM public.conversations c
LEFT JOIN public.messages m ON c.id = m.conversation_id
GROUP BY c.id, c.user_id, c.title, c.created_at, c.updated_at;

-- メッセージ順序検証用のビュー
CREATE OR REPLACE VIEW public.message_sequence_validation AS
SELECT 
    conversation_id,
    COUNT(*) as message_count,
    MIN(sequence_number) as min_sequence,
    MAX(sequence_number) as max_sequence,
    COUNT(DISTINCT sequence_number) as unique_sequences,
    -- 順序が正しいかチェック（message_count = max_sequence かつ min_sequence = 1）
    CASE 
        WHEN COUNT(*) = MAX(sequence_number) AND MIN(sequence_number) = 1 
        THEN true 
        ELSE false 
    END as sequence_is_valid
FROM public.messages
GROUP BY conversation_id;

-- メッセージペア保存関数の改良（sequence_number対応）
CREATE OR REPLACE FUNCTION public.save_message_pair_with_sequence(
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
    v_next_sequence INTEGER;
    v_result JSON;
BEGIN
    -- 次のsequence_numberを取得
    SELECT COALESCE(MAX(sequence_number), 0) + 1
    INTO v_next_sequence
    FROM public.messages
    WHERE conversation_id = p_conversation_id;
    
    -- ユーザーメッセージを挿入
    INSERT INTO public.messages (conversation_id, role, content, agent_id, sequence_number)
    VALUES (p_conversation_id, 'user', p_user_content, p_agent_id, v_next_sequence)
    RETURNING * INTO v_user_message;
    
    -- AI応答メッセージを挿入
    INSERT INTO public.messages (conversation_id, role, content, agent_id, sequence_number)
    VALUES (p_conversation_id, 'assistant', p_ai_content, p_agent_id, v_next_sequence + 1)
    RETURNING * INTO v_ai_message;
    
    -- 会話の更新日時を更新
    UPDATE public.conversations 
    SET updated_at = timezone('utc'::text, now())
    WHERE id = p_conversation_id;
    
    -- 結果をJSONで返す
    SELECT json_build_object(
        'userMessage', row_to_json(v_user_message),
        'aiMessage', row_to_json(v_ai_message),
        'nextSequence', v_next_sequence + 2
    ) INTO v_result;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to save message pair with sequence: %', SQLERRM;
END;
$$;

-- 会話作成とメッセージペア保存の改良版
CREATE OR REPLACE FUNCTION public.create_conversation_with_message_pair_sequence(
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
    -- 会話を作成
    INSERT INTO public.conversations (user_id, title)
    VALUES (p_user_id, p_title)
    RETURNING * INTO v_conversation;
    
    -- ユーザーメッセージを挿入（sequence_number = 1）
    INSERT INTO public.messages (conversation_id, role, content, agent_id, sequence_number)
    VALUES (v_conversation.id, 'user', p_user_content, p_agent_id, 1)
    RETURNING * INTO v_user_message;
    
    -- AI応答メッセージを挿入（sequence_number = 2）
    INSERT INTO public.messages (conversation_id, role, content, agent_id, sequence_number)
    VALUES (v_conversation.id, 'assistant', p_ai_content, p_agent_id, 2)
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
        RAISE EXCEPTION 'Failed to create conversation with message pair sequence: %', SQLERRM;
END;
$$;

-- パフォーマンス最適化のためのパーティショニング準備（大規模データ対応）
-- 日付ベースのパーティショニングテーブル作成関数
CREATE OR REPLACE FUNCTION public.create_monthly_message_partition(
    year_month TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    table_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    table_name := 'messages_' || year_month;
    start_date := (year_month || '-01')::DATE;
    end_date := (start_date + INTERVAL '1 month')::DATE;
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF messages
         FOR VALUES FROM (%L) TO (%L)',
        table_name, start_date, end_date
    );
    
    -- パーティション用インデックス
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON %I (conversation_id, sequence_number)',
        'idx_' || table_name || '_conversation_sequence',
        table_name
    );
END;
$$;

-- ベンチマーク・監視用の統計関数
CREATE OR REPLACE FUNCTION public.get_database_performance_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_conversations', (SELECT COUNT(*) FROM public.conversations),
        'total_messages', (SELECT COUNT(*) FROM public.messages),
        'avg_messages_per_conversation', (
            SELECT ROUND(AVG(message_count), 2) 
            FROM public.conversation_metrics
        ),
        'largest_conversation', (
            SELECT MAX(total_messages) 
            FROM public.conversation_metrics
        ),
        'active_agents', (
            SELECT COUNT(DISTINCT agent_id) 
            FROM public.messages
        ),
        'sequence_validation_errors', (
            SELECT COUNT(*) 
            FROM public.message_sequence_validation 
            WHERE sequence_is_valid = false
        )
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$;

-- コメント追加
COMMENT ON COLUMN public.messages.sequence_number IS 'メッセージの会話内順序番号（1から開始）';
COMMENT ON FUNCTION public.save_message_pair_with_sequence IS '順序保証付きメッセージペア保存';
COMMENT ON FUNCTION public.create_conversation_with_message_pair_sequence IS '順序保証付き会話作成とメッセージペア保存';
COMMENT ON VIEW public.conversation_metrics IS '会話のパフォーマンス指標';
COMMENT ON VIEW public.message_sequence_validation IS 'メッセージ順序の整合性チェック';
COMMENT ON FUNCTION public.get_database_performance_stats IS 'データベースパフォーマンス統計'; 
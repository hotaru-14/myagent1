-- ==========================================
-- チャット会話保存用テーブル作成（エージェント切り替え機能対応）
-- Supabase SQLエディタで実行してください
-- ==========================================

-- 会話テーブル（agent_idは削除、エージェント情報はmessagesテーブルで管理）
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- メッセージテーブル（エージェント情報を保持）
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL DEFAULT 'weather',
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- エージェント設定テーブル（将来の拡張用）
CREATE TABLE IF NOT EXISTS public.agent_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL DEFAULT 'weather',
    is_enabled BOOLEAN DEFAULT true,
    custom_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, agent_id)
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON public.messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_settings_user_agent ON public.agent_settings(user_id, agent_id);

-- Row Level Security (RLS) の有効化
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- 会話テーブル: ユーザーは自分の会話のみアクセス可能
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- メッセージテーブル: ユーザーは自分の会話のメッセージのみアクセス可能
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- エージェント設定テーブル: ユーザーは自分の設定のみアクセス可能
CREATE POLICY "Users can view their own agent settings" ON public.agent_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent settings" ON public.agent_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent settings" ON public.agent_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent settings" ON public.agent_settings
    FOR DELETE USING (auth.uid() = user_id);

-- updated_at自動更新トリガー関数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_atトリガーの作成
CREATE TRIGGER trigger_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_agent_settings_updated_at
    BEFORE UPDATE ON public.agent_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- エージェント切り替え機能用ビューと関数
-- ==========================================

-- 会話の最後のエージェント取得ビュー
CREATE OR REPLACE VIEW public.conversation_last_agents AS
SELECT DISTINCT ON (c.id)
    c.id as conversation_id,
    c.user_id,
    c.title,
    c.created_at,
    c.updated_at,
    m.agent_id as last_agent_id,
    m.created_at as last_message_at,
    COUNT(m2.id) as message_count
FROM public.conversations c
LEFT JOIN public.messages m ON c.id = m.conversation_id
LEFT JOIN public.messages m2 ON c.id = m2.conversation_id
WHERE m.role = 'assistant' OR m.role = 'user'
GROUP BY c.id, c.user_id, c.title, c.created_at, c.updated_at, m.agent_id, m.created_at
ORDER BY c.id, m.created_at DESC;

-- 会話統計ビュー（エージェント別メッセージ数）
CREATE OR REPLACE VIEW public.conversation_agent_stats AS
SELECT 
    c.id as conversation_id,
    c.user_id,
    m.agent_id,
    COUNT(m.id) as message_count,
    COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_message_count,
    COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_message_count,
    MIN(m.created_at) as first_message_at,
    MAX(m.created_at) as last_message_at
FROM public.conversations c
LEFT JOIN public.messages m ON c.id = m.conversation_id
GROUP BY c.id, c.user_id, m.agent_id;







-- リアルタイム機能の有効化（オプション）
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_settings;

-- マイグレーション処理は削除（初回実行時は不要）
-- 既存データがある場合は個別対応が必要

-- メッセージのagent_idデフォルト値設定
UPDATE public.messages SET agent_id = 'weather' WHERE agent_id IS NULL OR agent_id = '';

-- デフォルトエージェント設定の挿入関数
CREATE OR REPLACE FUNCTION public.ensure_default_agent_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- 複数のデフォルトエージェント設定を作成
    INSERT INTO public.agent_settings (user_id, agent_id, is_enabled)
    VALUES 
        (NEW.id, 'weather', true),
        (NEW.id, 'general', true),
        (NEW.id, 'programming', true),
        (NEW.id, 'translation', true)
    ON CONFLICT (user_id, agent_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 新規ユーザー登録時にデフォルト設定を作成
DROP TRIGGER IF EXISTS trigger_create_default_agent_settings ON auth.users;
CREATE TRIGGER trigger_create_default_agent_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_default_agent_settings();

-- コメントの追加
COMMENT ON TABLE public.conversations IS 'AIチャットの会話セッション（エージェント情報はmessagesテーブルで管理）';
COMMENT ON TABLE public.messages IS 'チャットの個別メッセージ（エージェント別管理対応）';
COMMENT ON TABLE public.agent_settings IS 'ユーザー別エージェント設定';
COMMENT ON COLUMN public.messages.agent_id IS 'メッセージを生成したエージェントのID';
COMMENT ON VIEW public.conversation_last_agents IS '各会話の最後に使用されたエージェント情報';
COMMENT ON VIEW public.conversation_agent_stats IS '会話別エージェント使用統計';

-- サンプルデータの挿入（テスト用、本番では削除）
-- INSERT INTO public.conversations (user_id, title) 
-- VALUES (auth.uid(), 'テスト会話'); 
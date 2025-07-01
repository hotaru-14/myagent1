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
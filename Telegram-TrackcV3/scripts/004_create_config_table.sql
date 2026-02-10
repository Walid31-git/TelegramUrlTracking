-- Create configuration table
CREATE TABLE IF NOT EXISTS public.bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_token TEXT NOT NULL,
  bot_username TEXT NOT NULL,
  source_channel_id TEXT NOT NULL,
  source_channel_name TEXT,
  destination_channel_id TEXT NOT NULL,
  destination_channel_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "bot_config_select_own" ON public.bot_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bot_config_insert_own" ON public.bot_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bot_config_update_own" ON public.bot_config
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bot_config_delete_own" ON public.bot_config
  FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_bot_config_user_id ON public.bot_config(user_id);

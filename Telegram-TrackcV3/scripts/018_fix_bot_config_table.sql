-- Recreate bot_config table without auth/user dependencies
-- This allows the app to work without authentication

-- Drop existing table and policies
DROP TABLE IF EXISTS public.bot_config CASCADE;

-- Create simplified bot_config table (single row configuration)
CREATE TABLE public.bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_token TEXT DEFAULT '',
  public_channel_id TEXT DEFAULT '',
  public_channel_name TEXT DEFAULT '',
  private_channel_id TEXT DEFAULT '',
  private_channel_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Add check constraint to ensure only one row exists
  CONSTRAINT bot_config_single_row CHECK (id = id)
);

-- Insert the single default row
INSERT INTO public.bot_config (id, bot_token, public_channel_id, private_channel_id, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '',
  '',
  '',
  NOW()
)
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bot_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bot_config_update_timestamp
BEFORE UPDATE ON public.bot_config
FOR EACH ROW
EXECUTE FUNCTION update_bot_config_timestamp();

-- Disable RLS for this table (no auth needed)
ALTER TABLE public.bot_config DISABLE ROW LEVEL SECURITY;

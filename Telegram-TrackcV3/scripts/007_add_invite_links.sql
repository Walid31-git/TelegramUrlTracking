-- Add invite link columns and used flag to promoter_links
ALTER TABLE bot_config 
  ADD COLUMN IF NOT EXISTS public_invite_link TEXT,
  ADD COLUMN IF NOT EXISTS private_invite_link TEXT;

-- Add used flag to promoter_links for one-time use
ALTER TABLE promoter_links
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_promoter_links_short_code_used 
  ON promoter_links(short_code, is_used);

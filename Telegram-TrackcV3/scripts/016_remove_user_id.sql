-- Drop foreign key constraints first
ALTER TABLE public.promoter_links DROP CONSTRAINT IF EXISTS promoter_links_user_id_fkey;
ALTER TABLE public.promoters DROP CONSTRAINT IF EXISTS promoters_user_id_fkey;
ALTER TABLE public.bot_config DROP CONSTRAINT IF EXISTS bot_config_user_id_fkey;

-- Remove user_id column from all tables
ALTER TABLE public.bot_config DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.promoters DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.promoter_links DROP COLUMN IF EXISTS user_id CASCADE;

-- Update bot_config to only have one row (singleton pattern)
DELETE FROM public.bot_config WHERE id > 1;
ALTER TABLE public.bot_config ADD CONSTRAINT bot_config_single_row CHECK (id = 1);

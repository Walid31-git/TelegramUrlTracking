-- Remove static invite link columns from bot_config
-- These are no longer needed since we generate single-use links dynamically via Telegram API

ALTER TABLE public.bot_config 
DROP COLUMN IF EXISTS public_invite_link;

ALTER TABLE public.bot_config 
DROP COLUMN IF EXISTS private_invite_link;

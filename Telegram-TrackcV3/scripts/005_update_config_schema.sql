-- Update bot_config table structure
-- Remove bot_username NOT NULL constraint and rename channel columns

-- Make bot_username nullable
ALTER TABLE public.bot_config ALTER COLUMN bot_username DROP NOT NULL;

-- Rename columns to reflect public/private channels
ALTER TABLE public.bot_config RENAME COLUMN source_channel_id TO public_channel_id;
ALTER TABLE public.bot_config RENAME COLUMN source_channel_name TO public_channel_name;
ALTER TABLE public.bot_config RENAME COLUMN destination_channel_id TO private_channel_id;
ALTER TABLE public.bot_config RENAME COLUMN destination_channel_name TO private_channel_name;

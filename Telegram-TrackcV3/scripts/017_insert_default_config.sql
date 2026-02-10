-- Insert default bot_config entry (or update if already exists)
INSERT INTO public.bot_config (bot_token, public_channel_id, private_channel_id, created_at)
VALUES (
  '',
  '',
  '',
  NOW()
)
ON CONFLICT DO NOTHING;

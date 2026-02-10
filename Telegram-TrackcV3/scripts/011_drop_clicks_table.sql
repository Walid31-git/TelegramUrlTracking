-- Drop clicks table as we use promoter_links.used_at and channel_type instead
DROP TABLE IF EXISTS public.clicks CASCADE;

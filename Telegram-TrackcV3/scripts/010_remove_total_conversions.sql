-- Remove total_conversions column from promoter_links
-- Conversions should be tracked via the clicks table instead
drop index if exists public.idx_promoter_links_total_conversions;

alter table public.promoter_links
drop column if exists total_conversions;

-- Remove total_clicks column from promoter_links table
-- A link can only be clicked once, so we don't need to track total clicks

-- Drop index first
drop index if exists idx_promoter_links_total_clicks;

-- Drop the column
alter table public.promoter_links 
drop column if exists total_clicks;

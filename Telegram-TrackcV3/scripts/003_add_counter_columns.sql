-- Add counter columns to promoter_links table
alter table public.promoter_links 
add column if not exists total_clicks integer default 0,
add column if not exists total_conversions integer default 0;

-- Create index for better performance
create index if not exists idx_promoter_links_total_clicks on public.promoter_links(total_clicks);
create index if not exists idx_promoter_links_total_conversions on public.promoter_links(total_conversions);

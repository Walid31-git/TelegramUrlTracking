-- Simplify promoter_links table - just store channel type
-- The bot will generate the actual invite link when needed

-- Add channel_type column
alter table public.promoter_links 
add column if not exists channel_type text check (channel_type in ('public', 'private'));

-- Rename link_code to short_code for consistency
alter table public.promoter_links 
rename column link_code to short_code;

-- Make full_url nullable since bot will generate links
alter table public.promoter_links 
alter column full_url drop not null;

-- Add converted column to clicks if not exists
alter table public.clicks 
add column if not exists converted boolean default false;

-- Update index
drop index if exists idx_promoter_links_link_code;
create index if not exists idx_promoter_links_short_code on public.promoter_links(short_code);

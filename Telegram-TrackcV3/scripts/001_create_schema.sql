-- Create promoters table
create table if not exists public.promoters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  telegram_username text,
  created_at timestamp with time zone default now()
);

-- Create promoter_links table
create table if not exists public.promoter_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  promoter_id uuid not null references public.promoters(id) on delete cascade,
  link_code text not null unique,
  full_url text not null,
  created_at timestamp with time zone default now()
);

-- Create clicks table
create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid not null references public.promoters(id) on delete cascade,
  link_id uuid not null references public.promoter_links(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address text,
  user_agent text,
  referrer text,
  clicked_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.promoters enable row level security;
alter table public.promoter_links enable row level security;
alter table public.clicks enable row level security;

-- Create RLS policies for promoters
create policy "users_select_own_promoters" on public.promoters 
  for select using (auth.uid() = user_id);
create policy "users_insert_own_promoters" on public.promoters 
  for insert with check (auth.uid() = user_id);
create policy "users_update_own_promoters" on public.promoters 
  for update using (auth.uid() = user_id);
create policy "users_delete_own_promoters" on public.promoters 
  for delete using (auth.uid() = user_id);

-- Create RLS policies for promoter_links
create policy "users_select_own_links" on public.promoter_links 
  for select using (auth.uid() = user_id);
create policy "users_insert_own_links" on public.promoter_links 
  for insert with check (auth.uid() = user_id);
create policy "users_update_own_links" on public.promoter_links 
  for update using (auth.uid() = user_id);
create policy "users_delete_own_links" on public.promoter_links 
  for delete using (auth.uid() = user_id);

-- Create RLS policies for clicks
create policy "users_select_own_clicks" on public.clicks 
  for select using (auth.uid() = user_id);
create policy "users_insert_own_clicks" on public.clicks 
  for insert with check (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_promoters_user_id on public.promoters(user_id);
create index if not exists idx_promoter_links_user_id on public.promoter_links(user_id);
create index if not exists idx_promoter_links_promoter_id on public.promoter_links(promoter_id);
create index if not exists idx_promoter_links_link_code on public.promoter_links(link_code);
create index if not exists idx_clicks_promoter_id on public.clicks(promoter_id);
create index if not exists idx_clicks_link_id on public.clicks(link_id);
create index if not exists idx_clicks_user_id on public.clicks(user_id);
create index if not exists idx_clicks_clicked_at on public.clicks(clicked_at);

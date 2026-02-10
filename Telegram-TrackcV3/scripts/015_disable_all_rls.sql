-- Disable RLS on all tables to make them public
ALTER TABLE public.promoters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_links DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Public read" ON public.promoter_links;
DROP POLICY IF EXISTS "Select own" ON public.bot_config;
DROP POLICY IF EXISTS "Update own" ON public.bot_config;
DROP POLICY IF EXISTS "Insert own" ON public.bot_config;
DROP POLICY IF EXISTS "Select own" ON public.promoters;
DROP POLICY IF EXISTS "Insert own" ON public.promoters;
DROP POLICY IF EXISTS "Update own" ON public.promoters;
DROP POLICY IF EXISTS "Delete own" ON public.promoters;

-- Fix RLS policies for clicks table to allow public tracking

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public inserts to clicks" ON clicks;
DROP POLICY IF EXISTS "Allow authenticated users to view their clicks" ON clicks;

-- Allow anyone (including anonymous) to insert clicks for tracking
CREATE POLICY "Allow public inserts to clicks" 
ON clicks 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to view clicks for their own links
CREATE POLICY "Allow users to view clicks for their promoters" 
ON clicks 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM promoters 
    WHERE promoters.id = clicks.promoter_id 
    AND promoters.user_id = auth.uid()
  )
);

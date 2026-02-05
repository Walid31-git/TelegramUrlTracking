-- Add channel_type column to tracked_links
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT 'public';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tracked_links_channel_type ON tracked_links(channel_type);

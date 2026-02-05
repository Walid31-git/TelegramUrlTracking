-- Create promoters table
CREATE TABLE IF NOT EXISTS promoters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tracked_links table
CREATE TABLE IF NOT EXISTS tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('public', 'private')),
  telegram_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clicks table for tracking
CREATE TABLE IF NOT EXISTS clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES tracked_links(id) ON DELETE CASCADE,
  user_identifier TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ
);

-- Create conversions table for daily aggregation
CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
  link_id UUID REFERENCES tracked_links(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(link_id, date)
);

-- Create telegram_stats table
CREATE TABLE IF NOT EXISTS telegram_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_members INTEGER DEFAULT 0,
  private_members INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create configuration table
CREATE TABLE IF NOT EXISTS configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_token TEXT,
  public_channel_id TEXT,
  private_channel_id TEXT,
  email_notifications BOOLEAN DEFAULT FALSE,
  report_frequency TEXT DEFAULT 'weekly' CHECK (report_frequency IN ('daily', 'weekly')),
  conversion_threshold INTEGER DEFAULT 30,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial telegram stats
INSERT INTO telegram_stats (public_members, private_members)
VALUES (0, 0)
ON CONFLICT DO NOTHING;

-- Insert initial configuration
INSERT INTO configuration (bot_token, public_channel_id, private_channel_id)
VALUES ('', '', '')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracked_links_promoter ON tracked_links(promoter_id);
CREATE INDEX IF NOT EXISTS idx_tracked_links_type ON tracked_links(type);
CREATE INDEX IF NOT EXISTS idx_clicks_link ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_conversions_date ON conversions(date);
CREATE INDEX IF NOT EXISTS idx_conversions_promoter ON conversions(promoter_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_promoters_updated_at BEFORE UPDATE ON promoters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracked_links_updated_at BEFORE UPDATE ON tracked_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuration_updated_at BEFORE UPDATE ON configuration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_stats_updated_at BEFORE UPDATE ON telegram_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

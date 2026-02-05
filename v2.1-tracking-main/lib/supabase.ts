import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Promoter = {
  id: string
  name: string
  telegram_handle: string | null
  channel_type: 'public' | 'private'
  channel_id: string
  channel_name: string
  added_date: string
  is_active: boolean
  notes: string | null
}

export type TrackedLink = {
  id: string
  promoter_id: string
  original_url: string
  tracking_code: string
  full_tracking_url: string
  created_at: string
  is_active: boolean
  notes: string | null
  promoter?: Promoter
}

export type Click = {
  id: string
  link_id: string
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  clicked_at: string
  country: string | null
  city: string | null
  device_type: string | null
}

export type Conversion = {
  id: string
  link_id: string
  click_id: string | null
  converted_at: string
  conversion_value: number | null
  conversion_type: string | null
}

export type TelegramStats = {
  id: string
  promoter_id: string
  date: string
  subscribers: number | null
  views: number | null
  shares: number | null
  engagement_rate: number | null
  notes: string | null
}

export type Configuration = {
  id: string
  key: string
  value: string
  description: string | null
  updated_at: string
}

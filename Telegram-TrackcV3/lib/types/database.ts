export interface Promoter {
  id: string
  name: string
  telegram_username: string
  user_id: string
  created_at: string
}

export interface PromoterLink {
  id: string
  promoter_id: string
  user_id: string
  short_code: string
  channel_type: 'public' | 'private'
  is_used: boolean
  used_at: string | null
  created_at: string
}

export interface Click {
  id: string
  link_id: string
  promoter_id: string
  user_agent: string | null
  referer: string | null
  converted: boolean
  clicked_at: string
}

export interface BotConfig {
  id: string
  user_id: string
  bot_token: string | null
  public_channel_id: string | null
  private_channel_id: string | null
  public_invite_link: string | null
  private_invite_link: string | null
  created_at: string
  updated_at: string
}

export interface PromoterWithStats extends Promoter {
  public_clicks: number
  private_clicks: number
  total_conversions: number
  conversion_rate: number
  total_links: number
}

export interface LinkWithStats extends PromoterLink {
  conversion_rate: number
  last_click: string | null
}

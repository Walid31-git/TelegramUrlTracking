import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get bot config (single row guaranteed by check constraint)
    const { data: config, error: configError } = await supabase
      .from('bot_config')
      .select('bot_token, public_channel_id, private_channel_id')
      .limit(1)
      .single()

    if (configError || !config || !config.bot_token) {
      return NextResponse.json(
        { error: 'Bot configuration not found' },
        { status: 404 }
      )
    }

    // Get member counts from Telegram API
    const publicCount = await getMemberCount(
      config.bot_token,
      config.public_channel_id
    )
    const privateCount = await getMemberCount(
      config.bot_token,
      config.private_channel_id
    )

    return NextResponse.json({
      public_members: publicCount,
      private_members: privateCount,
    })
  } catch (error) {
    console.error('[v0] Error getting member count:', error)
    return NextResponse.json(
      { error: 'Failed to get member count' },
      { status: 500 }
    )
  }
}

async function getMemberCount(
  botToken: string,
  channelId: string | number
): Promise<number> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMemberCount`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: channelId }),
      }
    )

    const data = await response.json()
    if (data.ok) {
      return data.result || 0
    } else {
      console.error('[v0] Telegram API error:', data)
      return 0
    }
  } catch (error) {
    console.error('[v0] Error fetching member count:', error)
    return 0
  }
}

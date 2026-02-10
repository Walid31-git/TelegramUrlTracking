import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get bot config (single row guaranteed by check constraint)
    const { data: config } = await supabase
      .from('bot_config')
      .select('bot_token, public_channel_id, private_channel_id')
      .limit(1)
      .single()

    if (!config || !config.bot_token) {
      return NextResponse.json(
        { error: 'Bot not configured' },
        { status: 400 }
      )
    }

    // Get channel info from Telegram
    const channelInfo = {
      public_name: '',
      private_name: '',
    }

    // Fetch public channel info
    if (config.public_channel_id) {
      try {
        const publicRes = await fetch(
          `https://api.telegram.org/bot${config.bot_token}/getChat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.public_channel_id }),
          }
        )

        const publicData = await publicRes.json()
        if (publicData.ok && publicData.result) {
          channelInfo.public_name =
            publicData.result.title || 'Canal Public'
        }
      } catch (error) {
        console.error('[v0] Error fetching public channel info:', error)
      }
    }

    // Fetch private channel info
    if (config.private_channel_id) {
      try {
        const privateRes = await fetch(
          `https://api.telegram.org/bot${config.bot_token}/getChat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.private_channel_id }),
          }
        )

        const privateData = await privateRes.json()
        if (privateData.ok && privateData.result) {
          channelInfo.private_name =
            privateData.result.title || 'Canal Privé'
        }
      } catch (error) {
        console.error('[v0] Error fetching private channel info:', error)
      }
    }

    return NextResponse.json(channelInfo)
  } catch (error) {
    console.error('[v0] Error in get-channel-info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

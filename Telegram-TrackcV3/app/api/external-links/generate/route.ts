import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, channel_type } = body

    if (!name || !channel_type) {
      return NextResponse.json(
        { error: 'Name and channel_type are required' },
        { status: 400 }
      )
    }

    // Get bot config
    const { data: config, error: configError } = await supabase
      .from('bot_config')
      .select('bot_token, public_channel_id, private_channel_id')
      .limit(1)
      .single()

    if (configError || !config?.bot_token) {
      return NextResponse.json(
        { error: 'Bot not configured' },
        { status: 400 }
      )
    }

    const channelId = channel_type === 'public' 
      ? config.public_channel_id 
      : config.private_channel_id

    if (!channelId) {
      return NextResponse.json(
        { error: `${channel_type} channel not configured` },
        { status: 400 }
      )
    }

    // Create invite link via Telegram API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${config.bot_token}/createChatInviteLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          name: name, // Telegram allows naming invite links
        }),
      }
    )

    const telegramData = await telegramResponse.json()

    if (!telegramData.ok) {
      console.error('[ExternalLinks] Telegram API error:', telegramData)
      return NextResponse.json(
        { error: telegramData.description || 'Failed to create invite link' },
        { status: 500 }
      )
    }

    const inviteLink = telegramData.result.invite_link

    // Save to database
    const { data: externalLink, error: dbError } = await supabase
      .from('external_links')
      .insert({
        name,
        full_url: inviteLink,
        channel_type,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[ExternalLinks] Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save link to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      link: externalLink,
    })
  } catch (error) {
    console.error('[ExternalLinks] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

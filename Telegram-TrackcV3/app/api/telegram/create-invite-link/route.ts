// app/api/telegram/create-invite-link/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { channel_id, is_single_use, promoter_id, channel_type } = await request.json()
    
    if (!channel_id) {
      return NextResponse.json({ error: 'Channel ID not provided' }, { status: 400 })
    }
    
    if (!promoter_id) {
      return NextResponse.json({ error: 'Promoter ID not provided' }, { status: 400 })
    }
    
    if (!channel_type || !['public', 'private'].includes(channel_type)) {
      return NextResponse.json({ error: 'Invalid channel_type' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get bot config
    const { data: config, error: configError } = await supabase
      .from('bot_config')
      .select('bot_token, public_channel_id, private_channel_id')
      .limit(1)
      .single()
      
    if (configError || !config?.bot_token) {
      return NextResponse.json({ error: 'Bot not configured' }, { status: 400 })
    }
    
    // Get promoter name for the invite link name
    const { data: promoter, error: promoterError } = await supabase
      .from('promoters')
      .select('name')
      .eq('id', promoter_id)
      .single()
    
    if (promoterError || !promoter) {
      return NextResponse.json({ error: 'Promoter not found' }, { status: 404 })
    }
    
    // Create Telegram invite link
    const response = await fetch(
      `https://api.telegram.org/bot${config.bot_token}/createChatInviteLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channel_id,
          name: `${promoter.name} - ${channel_type}`, // Name visible in Telegram admin
          creates_join_request: false,
          member_limit: is_single_use ? 1 : undefined,
        }),
      }
    )
    
    const data = await response.json()
    
    if (!data.ok) {
      console.error('[Telegram] API error:', data)
      return NextResponse.json({ error: data.description || 'Failed to create invite link' }, { status: 400 })
    }
    
    const inviteLink = data.result.invite_link
    
    // Save to database
    const { data: savedLink, error: dbError } = await supabase
      .from('promoter_links')
      .insert({
        promoter_id: promoter_id,
        channel_type: channel_type,
        full_url: inviteLink, // Store the t.me/+XXXXX link
        is_used: false,
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('[Telegram] Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save invite link' }, { status: 500 })
    }
    
    console.log('[Telegram] Invite link created:', {
      promoter: promoter.name,
      link_id: savedLink.id,
      invite_link: inviteLink,
      channel_type: channel_type,
      is_single_use: is_single_use
    })
    
    return NextResponse.json({ 
      success: true,
      invite_link: inviteLink,
      link_id: savedLink.id,
      promoter_name: promoter.name
    })
    
  } catch (error) {
    console.error('[Telegram] Error creating invite link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { promoter_id, channel_type } = await request.json()

    if (!promoter_id || !channel_type) {
      return NextResponse.json(
        { success: false, error: 'Promoteur et type de canal requis' },
        { status: 400 }
      )
    }

    // Récupérer la configuration du bot
    const { data: config } = await supabase
      .from('configuration')
      .select('bot_token, public_channel_id, private_channel_id')
      .single()

    if (!config?.bot_token) {
      return NextResponse.json(
        { success: false, error: 'Configuration du bot manquante' },
        { status: 400 }
      )
    }

    const botToken = config.bot_token
    const channelId = channel_type === 'public' ? config.public_channel_id : config.private_channel_id

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: `ID du canal ${channel_type} manquant` },
        { status: 400 }
      )
    }

    // Générer un lien d'invitation unique via l'API Telegram
    // Pour les liens permanents, ne pas mettre member_limit ni expire_date
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/createChatInviteLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          name: `Promoteur ${promoter_id.substring(0, 8)}`,
          creates_join_request: false,
        }),
      }
    )

    const data = await response.json()

    if (!data.ok) {
      return NextResponse.json(
        { success: false, error: data.description || 'Erreur API Telegram' },
        { status: 500 }
      )
    }

    const inviteLink = data.result.invite_link
    const linkId = inviteLink.split('/').pop() || Math.random().toString(36).substring(7)

    // Enregistrer dans la base de données
    const { error: insertError } = await supabase.from('tracked_links').insert({
      promoter_id,
      telegram_url: inviteLink,
      link_id: linkId,
      type: channel_type,
      clicks: 0,
      conversions: 0,
    })

    if (insertError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invite_link: inviteLink,
      link_id: linkId,
      channel_type,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

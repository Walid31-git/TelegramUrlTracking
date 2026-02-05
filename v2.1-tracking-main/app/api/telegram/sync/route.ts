import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Récupérer la configuration Telegram
    const { data: configData } = await supabase
      .from('configuration')
      .select('bot_token, public_channel_id, private_channel_id')
      .single()

    const botToken = configData?.bot_token
    const publicChannelId = configData?.public_channel_id
    const privateChannelId = configData?.private_channel_id

    if (!botToken) {
      return NextResponse.json(
        { error: 'Configuration du bot Telegram manquante' },
        { status: 400 }
      )
    }

    let publicMembers = 0
    let privateMembers = 0

    // Récupérer les stats du canal public
    if (publicChannelId) {
      try {
        const publicResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=${publicChannelId}`
        )
        const publicData = await publicResponse.json()

        if (publicData.ok) {
          publicMembers = publicData.result
        }
      } catch {
        // Ignore errors
      }
    }

    // Récupérer les stats du canal privé
    if (privateChannelId) {
      try {
        const privateResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=${privateChannelId}`
        )
        const privateData = await privateResponse.json()

        if (privateData.ok) {
          privateMembers = privateData.result
        }
      } catch {
        // Ignore errors
      }
    }

    // Mettre à jour les stats dans la table
    const { data: existingStats } = await supabase
      .from('telegram_stats')
      .select('id')
      .single()

    if (existingStats) {
      await supabase
        .from('telegram_stats')
        .update({
          public_members: publicMembers,
          private_members: privateMembers,
        })
        .eq('id', existingStats.id)
    } else {
      await supabase
        .from('telegram_stats')
        .insert({
          public_members: publicMembers,
          private_members: privateMembers,
        })
    }

    const totalMembers = publicMembers + privateMembers
    const results = { publicMembers, privateMembers, totalMembers }

    return NextResponse.json({
      success: true,
      message: 'Statistiques Telegram synchronisées',
      results: [
        { channel: 'public', members: publicMembers },
        { channel: 'private', members: privateMembers },
      ],
      totalMembers,
    })
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation' },
      { status: 500 }
    )
  }
}

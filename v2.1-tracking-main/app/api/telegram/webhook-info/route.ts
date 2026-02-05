import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Récupérer le bot token
    const { data: config } = await supabase
      .from('configuration')
      .select('bot_token')
      .single()

    if (!config?.bot_token) {
      return NextResponse.json(
        { error: 'Bot token manquant' },
        { status: 400 }
      )
    }

    // Récupérer les infos du webhook
    const response = await fetch(
      `https://api.telegram.org/bot${config.bot_token}/getWebhookInfo`
    )

    const data = await response.json()

    if (!data.ok) {
      return NextResponse.json(
        { error: data.description },
        { status: 500 }
      )
    }

    return NextResponse.json(data.result)
  } catch (error) {
    console.error('[v0] Error getting webhook info:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

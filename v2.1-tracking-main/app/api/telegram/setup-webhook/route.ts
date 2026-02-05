import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Récupérer le bot token
    const { data: config } = await supabase
      .from('configuration')
      .select('bot_token')
      .single()

    if (!config?.bot_token) {
      return NextResponse.json(
        { success: false, error: 'Bot token manquant' },
        { status: 400 }
      )
    }

    // Récupérer l'URL de base de l'application
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : request.headers.get('origin') || 'http://localhost:3000'
    
    const webhookUrl = `${baseUrl}/api/telegram/webhook`

    // Configurer le webhook avec Telegram
    // Inclure chat_member, my_chat_member, et message pour capturer tous les événements
    const response = await fetch(
      `https://api.telegram.org/bot${config.bot_token}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['chat_member', 'my_chat_member', 'message', 'channel_post'],
          drop_pending_updates: true,
        }),
      }
    )

    const data = await response.json()

    if (!data.ok) {
      return NextResponse.json(
        { success: false, error: data.description },
        { status: 500 }
      )
    }

    // Vérifier la configuration du webhook
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${config.bot_token}/getWebhookInfo`
    )
    const webhookInfo = await infoResponse.json()

    return NextResponse.json({
      success: true,
      webhook_url: webhookUrl,
      message: 'Webhook configuré avec succès',
      info: webhookInfo.result,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Recuperer la configuration Telegram depuis la bonne table
    const { data: config } = await supabase
      .from('configuration')
      .select('bot_token, public_channel_id, private_channel_id')
      .single()

    if (!config?.bot_token) {
      return NextResponse.json(
        { success: false, error: 'Bot token non configure. Allez dans Configuration pour le configurer.' },
        { status: 400 }
      )
    }

    const results = {
      public: { synced: 0, admins: 0 },
      private: { synced: 0, admins: 0 },
    }

    // Fonction pour recuperer les admins d'un canal
    async function getChannelAdmins(chatId: string, channelType: 'public' | 'private') {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${config.bot_token}/getChatAdministrators`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId }),
          }
        )

        const data = await response.json()

        if (data.ok && data.result) {
          for (const admin of data.result) {
            const user = admin.user
            
            // Ignorer les bots
            if (user.is_bot) continue

            await supabase.from('members').upsert({
              user_id: user.id,
              first_name: user.first_name || 'Admin',
              last_name: user.last_name || null,
              username: user.username || null,
              channel_type: channelType,
              promoter_id: null,
              joined_at: new Date().toISOString(),
            }, { 
              onConflict: 'user_id,channel_type',
              ignoreDuplicates: false 
            })

            if (channelType === 'public') {
              results.public.admins++
            } else {
              results.private.admins++
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching admins for ${channelType}:`, error)
      }
    }

    // Fonction pour recuperer le nombre de membres
    async function getChannelMemberCount(chatId: string): Promise<number> {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${config.bot_token}/getChatMemberCount`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId }),
          }
        )

        const data = await response.json()
        return data.ok ? data.result : 0
      } catch {
        return 0
      }
    }

    // Synchroniser le canal public
    if (config.public_channel_id) {
      await getChannelAdmins(config.public_channel_id, 'public')
      const publicCount = await getChannelMemberCount(config.public_channel_id)
      results.public.synced = publicCount
    }

    // Synchroniser le canal prive
    if (config.private_channel_id) {
      await getChannelAdmins(config.private_channel_id, 'private')
      const privateCount = await getChannelMemberCount(config.private_channel_id)
      results.private.synced = privateCount
    }

    // Mettre a jour les stats globales
    const { data: existingStats } = await supabase
      .from('telegram_stats')
      .select('id')
      .single()

    if (existingStats) {
      await supabase
        .from('telegram_stats')
        .update({
          public_members: results.public.synced,
          private_members: results.private.synced,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStats.id)
    } else {
      await supabase.from('telegram_stats').insert({
        public_members: results.public.synced,
        private_members: results.private.synced,
      })
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Synchronise: ${results.public.admins} admins publics, ${results.private.admins} admins prives`,
    })
  } catch (error) {
    console.error('Sync members error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la synchronisation' },
      { status: 500 }
    )
  }
}

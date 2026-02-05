import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const update = await request.json()

    // Détecter un nouveau membre via chat_member ou my_chat_member
    const chatMemberUpdate = update.chat_member || update.my_chat_member
    
    if (chatMemberUpdate) {
      const newMember = chatMemberUpdate.new_chat_member
      const oldMember = chatMemberUpdate.old_chat_member
      const inviteLink = chatMemberUpdate.invite_link

      // Vérifier si c'est un nouveau membre
      const isNewMember = newMember && 
          (newMember.status === 'member' || newMember.status === 'administrator') && 
          (!oldMember || oldMember.status === 'left' || oldMember.status === 'kicked')

      if (isNewMember && inviteLink?.invite_link) {
        const telegramUrl = inviteLink.invite_link
        const user = newMember.user

        // Trouver le lien tracké
        const { data: link } = await supabase
          .from('tracked_links')
          .select('id, promoter_id, clicks, type')
          .eq('telegram_url', telegramUrl)
          .single()

        if (link) {
          // 1. Incrémenter le compteur dans tracked_links (source unique)
          await supabase
            .from('tracked_links')
            .update({ 
              clicks: (link.clicks || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', link.id)

          // 2. Enregistrer le membre
          await supabase.from('members').upsert({
            user_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name || null,
            username: user.username || null,
            channel_type: link.type,
            promoter_id: link.promoter_id,
            joined_at: new Date().toISOString(),
          }, { 
            onConflict: 'user_id,channel_type',
            ignoreDuplicates: false 
          })

          // 3. Mettre à jour les stats globales
          const { data: stats } = await supabase
            .from('telegram_stats')
            .select('*')
            .single()

          if (stats) {
            const field = link.type === 'public' ? 'public_members' : 'private_members'
            await supabase
              .from('telegram_stats')
              .update({ 
                [field]: (stats[field] || 0) + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', stats.id)
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}

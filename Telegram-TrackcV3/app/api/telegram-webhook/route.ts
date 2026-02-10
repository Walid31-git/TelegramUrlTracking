// app/api/telegram-webhook/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Webhook] Received update:', JSON.stringify(body, null, 2))
    
    const supabase = await createClient()
    
    // Gère les nouveaux membres (chat_member update)
    if (body.chat_member || body.my_chat_member) {
      const update = body.chat_member || body.my_chat_member
      const { chat, new_chat_member, invite_link } = update
      
      // Vérifie si c'est un nouveau membre (status: member ou administrator)
      if (
        new_chat_member.status === 'member' || 
        new_chat_member.status === 'administrator'
      ) {
        const user = new_chat_member.user
        
        // IMPORTANT : Récupérer les anciennes données avant de supprimer l'exit
        // pour préserver external_link_id et invite_link_url
        const { data: previousExit } = await supabase
          .from('telegram_member_exits')
          .select('external_link_id, invite_link_url')
          .eq('user_id', user.id)
          .eq('chat_id', chat.id)
          .order('left_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        // Si la personne rejoint, supprimer son ancien exit s'il existe
        // (pour ne pas compter un départ si elle revient)
        await supabase
          .from('telegram_member_exits')
          .delete()
          .eq('user_id', user.id)
          .eq('chat_id', chat.id)
        
        console.log('[Webhook] 🔄 Removed previous exit if existed for user:', user.id)
        
        // Log invite link info if present
        if (invite_link) {
          console.log('[Webhook] User joined via invite link:', {
            link: invite_link.invite_link,
            name: invite_link.name,
          })
        }
        
        // Find the external_link by matching the invite link URL
        let externalLinkId = null
        let inviteLinkUrl = null
        let shouldTrack = false
        
        if (invite_link && invite_link.invite_link) {
          const { data: externalLink, error: externalError } = await supabase
            .from('external_links')
            .select('id, name, full_url, channel_type')
            .eq('full_url', invite_link.invite_link)
            .maybeSingle()
          
          if (externalLink && externalLink.channel_type === 'public') {
            // Get bot config to check channel IDs
            const { data: config } = await supabase
              .from('bot_config')
              .select('public_channel_id, private_channel_id')
              .maybeSingle()
            
            if (config) {
              const isPublicChannel = config.public_channel_id && 
                BigInt(chat.id) === BigInt(config.public_channel_id)
              
              // On track uniquement le canal PUBLIC avec lien PUBLIC
              if (isPublicChannel) {
                shouldTrack = true
                externalLinkId = externalLink.id
                inviteLinkUrl = invite_link.invite_link
                
                console.log('[Webhook] ✅ User joined PUBLIC channel via PUBLIC link - TRACKED:', {
                  user_id: user.id,
                  username: user.username,
                  external_link_name: externalLink.name
                })
              }
            }
          } else if (externalLink) {
            console.warn('[Webhook] ⚠️ External link found but not public type:', {
              link_type: externalLink.channel_type,
              url: invite_link.invite_link
            })
          } else {
            console.warn('[Webhook] ⚠️ No matching external_link found for:', invite_link.invite_link)
            if (externalError && externalError.code !== 'PGRST116') {
              console.error('[Webhook] Error finding external_link:', externalError)
            }
          }
        }
        
        // ✨ CORRECTION PRINCIPALE : Si pas d'invite_link dans le webhook,
        // utiliser les valeurs du previousExit (si elles existent)
        if (!externalLinkId && previousExit?.external_link_id) {
          externalLinkId = previousExit.external_link_id
          inviteLinkUrl = previousExit.invite_link_url
          shouldTrack = true
          console.log('[Webhook] ♻️ Restored external_link from previous exit:', {
            user_id: user.id,
            external_link_id: externalLinkId
          })
        }
        
        // Pour le canal PRIVÉ, on enregistre toujours mais sans external_link_id
        // (on s'en fout comment ils ont rejoint le privé)
        const { data: config } = await supabase
          .from('bot_config')
          .select('private_channel_id')
          .maybeSingle()
        
        const isPrivateChannel = config?.private_channel_id && 
          BigInt(chat.id) === BigInt(config.private_channel_id)
        
        if (isPrivateChannel) {
          console.log('[Webhook] ℹ️ User joined PRIVATE channel - RECORDED (without tracking):', {
            user_id: user.id,
            username: user.username
          })
        }
        
        // Insère ou met à jour dans telegram_members
        // Si shouldTrack = false (pas de external_link), external_link_id sera null
        // Mais on enregistre quand même le membre (utile pour le privé et pour les départs)
        const { error } = await supabase
          .from('telegram_members')
          .upsert({
            chat_id: chat.id,
            user_id: user.id,
            username: user.username || null,
            first_name: user.first_name || null,
            last_name: user.last_name || null,
            joined_at: new Date().toISOString(),
            external_link_id: externalLinkId, // Préservé depuis previousExit si nécessaire
            invite_link_url: inviteLinkUrl,   // Préservé depuis previousExit si nécessaire
            invite_link_id: null, // Toujours null maintenant
          }, {
            onConflict: 'user_id,chat_id',
            ignoreDuplicates: false,
          })
        
        if (error) {
          console.error('[Webhook] Error inserting member:', error)
        } else {
          console.log('[Webhook] ✅ Member saved successfully:', {
            user_id: user.id,
            chat_id: chat.id,
            external_link_id: externalLinkId,
            username: user.username,
            tracked: shouldTrack,
            restored_from_exit: !invite_link && !!previousExit?.external_link_id
          })
        }
      }
      
      // Gère les membres qui quittent
      if (
        new_chat_member.status === 'left' || 
        new_chat_member.status === 'kicked'
      ) {
        const user = new_chat_member.user
        
        // Avant de supprimer, enregistrer le départ dans telegram_member_exits
        const { data: memberData } = await supabase
          .from('telegram_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('chat_id', chat.id)
          .maybeSingle()
        
        if (memberData) {
          // Vérifier si un exit existe déjà dans les dernières 5 minutes (éviter les doublons)
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
          const { data: recentExit } = await supabase
            .from('telegram_member_exits')
            .select('id')
            .eq('user_id', user.id)
            .eq('chat_id', chat.id)
            .gte('left_at', fiveMinutesAgo)
            .maybeSingle()
          
          if (!recentExit) {
            // Enregistrer le départ seulement si pas de départ récent
            await supabase
              .from('telegram_member_exits')
              .insert({
                chat_id: chat.id,
                user_id: user.id,
                username: memberData.username,
                first_name: memberData.first_name,
                last_name: memberData.last_name,
                joined_at: memberData.joined_at,
                left_at: new Date().toISOString(),
                external_link_id: memberData.external_link_id,
                invite_link_url: memberData.invite_link_url,
              })
            
            console.log('[Webhook] ✅ Member exit recorded:', {
              user_id: user.id,
              chat_id: chat.id,
              had_external_link: !!memberData.external_link_id
            })
          } else {
            console.log('[Webhook] ⚠️ Recent exit already exists, skipping duplicate:', {
              user_id: user.id,
              chat_id: chat.id
            })
          }
        }
        
        // Puis supprimer de telegram_members
        const { error } = await supabase
          .from('telegram_members')
          .delete()
          .eq('user_id', user.id)
          .eq('chat_id', chat.id)
        
        if (error) {
          console.error('[Webhook] Error removing member:', error)
        } else {
          console.log('[Webhook] ✅ Member removed from active list:', user.id, 'from chat:', chat.id)
        }
      }
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users } from 'lucide-react'

interface Member {
  id: number
  user_id: bigint
  username: string | null
  first_name: string | null
  last_name: string | null
  joined_at: string
  chat_id: bigint
  channel_type: 'public' | 'private'
  promoter_name: string | null
}

interface MemberWithStatus extends Member {
  is_in_both: boolean
}

export function NewMembersTable() {
  const [members, setMembers] = useState<MemberWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [displayLimit, setDisplayLimit] = useState(50)
  const supabase = createClient()

  async function fetchMembers() {
    try {
      // Get bot config to know which chat_id is public/private
      const { data: config } = await supabase
        .from('bot_config')
        .select('public_channel_id, private_channel_id')
        .limit(1)
        .single()

      if (!config) {
        setMembers([])
        setLoading(false)
        return
      }

      const publicChatId = config.public_channel_id ? BigInt(config.public_channel_id) : null
      const privateChatId = config.private_channel_id ? BigInt(config.private_channel_id) : null

      // Fetch all tracked members (with invite_link_id)
      const { data: allMembers } = await supabase
        .from('telegram_members')
        .select(`
          id, 
          user_id, 
          username, 
          first_name, 
          last_name, 
          joined_at, 
          chat_id,
          invite_link_id,
          promoter_links!inner (
            promoter_id,
            promoters!inner (
              name
            )
          )
        `)
        .not('invite_link_id', 'is', null)
        .order('joined_at', { ascending: false })

      if (!allMembers) {
        setMembers([])
        setLoading(false)
        return
      }

      // Group members by user_id to detect if they're in both channels
      const userMap = new Map<string, { public: Member | null; private: Member | null }>()

      allMembers.forEach((member) => {
        const userId = member.user_id.toString()
        const chatId = BigInt(member.chat_id)
        
        // Extract promoter name from nested relation
        const promoterName = member.promoter_links?.promoters?.name || null
        
        if (!userMap.has(userId)) {
          userMap.set(userId, { public: null, private: null })
        }

        const userEntry = userMap.get(userId)!
        const memberWithType: Member = {
          id: member.id,
          user_id: member.user_id,
          username: member.username,
          first_name: member.first_name,
          last_name: member.last_name,
          joined_at: member.joined_at,
          chat_id: member.chat_id,
          channel_type: chatId === publicChatId ? 'public' : 'private',
          promoter_name: promoterName
        }

        if (chatId === publicChatId) {
          userEntry.public = memberWithType
        } else if (chatId === privateChatId) {
          userEntry.private = memberWithType
        }
      })

      // Build final list with status
      const membersWithStatus: MemberWithStatus[] = []

      userMap.forEach((value, userId) => {
        // Prioritize showing the private entry if exists (means they did the full journey)
        const displayMember = value.private || value.public
        if (displayMember) {
          membersWithStatus.push({
            ...displayMember,
            is_in_both: value.public !== null && value.private !== null
          })
        }
      })

      // Sort by joined_at descending
      membersWithStatus.sort((a, b) => 
        new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
      )

      setMembers(membersWithStatus)
    } catch (error) {
      console.error('[NewMembersTable] Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()

    // Set up real-time subscription
    const channel = supabase
      .channel('new-members-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'telegram_members' },
        () => {
          console.log('[NewMembersTable] Telegram members updated')
          fetchMembers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || '?'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nouveaux membres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nouveaux membres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Aucun nouveau membre pour le moment
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Nouveaux membres ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {members.slice(0, displayLimit).map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(member.first_name, member.last_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">
                    {member.first_name || member.last_name
                      ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                      : 'Utilisateur anonyme'}
                  </p>
                  {member.username && (
                    <span className="text-xs text-muted-foreground">
                      @{member.username}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(member.joined_at)}
                  </p>
                  {member.promoter_name && (
                    <p className="text-xs text-primary/70 font-medium">
                      via {member.promoter_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {member.is_in_both ? (
                  <>
                    <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20">
                      Public
                    </Badge>
                    <Badge variant="default" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20">
                      Privé
                    </Badge>
                  </>
                ) : member.channel_type === 'public' ? (
                  <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                    Public uniquement
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
                    Privé uniquement
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {members.length > displayLimit && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setDisplayLimit(prev => prev + 50)}
              className="text-sm text-primary hover:underline"
            >
              Voir plus ({members.length - displayLimit} restants)
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

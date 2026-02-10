'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, UserPlus, UserMinus } from 'lucide-react'

interface Stats {
  newPublicMembers: number
  newPrivateMembers: number
  publicExits: number
  privateExits: number
  conversionRate: number
  totalPublicMembers: number
  totalPrivateMembers: number
  publicChannelName: string
  privateChannelName: string
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    newPublicMembers: 0,
    newPrivateMembers: 0,
    publicExits: 0,
    privateExits: 0,
    conversionRate: 0,
    totalPublicMembers: 0,
    totalPrivateMembers: 0,
    publicChannelName: 'Canal Public',
    privateChannelName: 'Canal Privé',
  })

  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchStats() {
    try {
      // 1. Récupérer la config
      const { data: config } = await supabase
        .from('bot_config')
        .select('public_channel_id, private_channel_id, public_channel_name, private_channel_name')
        .limit(1)
        .single()

      if (!config) {
        console.warn('Aucune config bot trouvée')
        return
      }

      const publicChatId = config.public_channel_id
      const privateChatId = config.private_channel_id

      let publicChannelName = config.public_channel_name || 'Canal Public'
      let privateChannelName = config.private_channel_name || 'Canal Privé'

      // 2. Récupérer TOUS les external_links (pour savoir quels sont les liens trackés)
      const { data: externalLinks } = await supabase
        .from('external_links')
        .select('id, full_url, channel_type')

      const publicLinkUrls = externalLinks
        ?.filter(l => l.channel_type === 'public')
        .map(l => l.full_url) || []

      const allTrackedUrls = new Set(externalLinks?.map(l => l.full_url) || [])

      // 3. NOUVEAUX MEMBRES PUBLIC → via liens trackés (comptage direct)
      let newPublicMembers = 0
      if (publicChatId && publicLinkUrls.length > 0) {
        const { count, error } = await supabase
          .from('telegram_members')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', publicChatId)
          .in('invite_link_url', publicLinkUrls)

        if (error) console.error('Erreur count public members:', error)
        newPublicMembers = count || 0
      }

      // 4. Trouver les user_id qui ont rejoint le public via lien tracké
      let userIdsPublicTracked: string[] = []
      if (newPublicMembers > 0 && publicChatId) {
        const { data: publicTrackedUsers } = await supabase
          .from('telegram_members')
          .select('user_id')
          .eq('chat_id', publicChatId)
          .in('invite_link_url', publicLinkUrls)

        userIdsPublicTracked = publicTrackedUsers?.map(u => u.user_id.toString()) || []
      }

      // 5. NOUVEAUX MEMBRES PRIVÉS → ceux qui étaient dans public tracké
      let newPrivateMembers = 0
      if (privateChatId && userIdsPublicTracked.length > 0) {
        const { count, error } = await supabase
          .from('telegram_members')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', privateChatId)
          .in('user_id', userIdsPublicTracked)

        if (error) console.error('Erreur count private members:', error)
        newPrivateMembers = count || 0
      }

      // 6. DÉPARTS PUBLIC (trackés)
      let publicExits = 0
      if (publicChatId && allTrackedUrls.size > 0) {
        const { count, error } = await supabase
          .from('telegram_member_exits')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', publicChatId)
          .in('invite_link_url', Array.from(allTrackedUrls))

        if (error) console.error('Erreur count public exits:', error)
        publicExits = count || 0
      }

      // 7. DÉPARTS PRIVÉS (trackés via public)
      let privateExits = 0
      if (privateChatId && userIdsPublicTracked.length > 0) {
        const { count, error } = await supabase
          .from('telegram_member_exits')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', privateChatId)
          .in('user_id', userIdsPublicTracked)

        if (error) console.error('Erreur count private exits:', error)
        privateExits = count || 0
      }

      // 8. Totaux via API Telegram
      let totalPublicMembers = 0
      let totalPrivateMembers = 0
      try {
        const res = await fetch('/api/telegram/get-member-count')
        if (res.ok) {
          const data = await res.json()
          totalPublicMembers = data.public_members || 0
          totalPrivateMembers = data.private_members || 0
        }
      } catch (err) {
        console.error('Erreur récupération totaux membres:', err)
      }

      // 9. Taux de conversion
      const conversionRate = newPublicMembers > 0 ? (newPrivateMembers / newPublicMembers) * 100 : 0

      setStats({
        newPublicMembers,
        newPrivateMembers,
        publicExits,
        privateExits,
        conversionRate,
        totalPublicMembers,
        totalPrivateMembers,
        publicChannelName,
        privateChannelName,
      })
    } catch (error) {
      console.error('[StatsCards] Erreur fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    const channel = supabase
      .channel('stats-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'telegram_members' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'telegram_member_exits' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'external_links' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_config' }, fetchStats)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const mainMetrics = [
    {
      title: `Nouveaux membres ${stats.publicChannelName}`,
      value: stats.newPublicMembers,
      icon: UserPlus,
      color: 'text-success',
      description: 'Via liens de tracking',
    },
    {
      title: `Nouveaux membres ${stats.privateChannelName}`,
      value: stats.newPrivateMembers,
      icon: UserPlus,
      color: 'text-blue-500',
      description: 'Ayant rejoint public puis privé',
    },
    {
      title: `Départs ${stats.publicChannelName}`,
      value: stats.publicExits,
      icon: UserMinus,
      color: 'text-red-500',
      description: 'Membres trackés qui ont quitté',
    },
    {
      title: `Départs ${stats.privateChannelName}`,
      value: stats.privateExits,
      icon: UserMinus,
      color: 'text-orange-500',
      description: 'Membres trackés qui ont quitté',
    },
  ]

  const summaryCards = [
    {
      title: `Total membres ${stats.publicChannelName}`,
      value: stats.totalPublicMembers,
      icon: Users,
      color: 'text-green-600',
      description: 'Tous les membres (API Telegram)',
    },
    {
      title: `Total membres ${stats.privateChannelName}`,
      value: stats.totalPrivateMembers,
      icon: Users,
      color: 'text-indigo-600',
      description: 'Tous les membres (API Telegram)',
    },
    {
      title: 'Taux de conversion',
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      description: 'Public → Privé',
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Métriques de tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {mainMetrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.title}
                  className="flex flex-col space-y-2 rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </span>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <div className="text-3xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

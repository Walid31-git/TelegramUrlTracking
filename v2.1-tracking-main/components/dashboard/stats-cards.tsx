'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, MousePointerClick, Target, Users, Link2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Stats {
  totalClicks: number
  totalConversions: number
  conversionRate: number
  activePromoters: number
  activeLinks: number
  publicMembers: number
  privateMembers: number
  totalMembers: number
  clicksTrend: number
  conversionsTrend: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Compter les membres reels depuis la table members
        const { count: totalMembersCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })

        const { count: publicMembersCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('channel_type', 'public')

        const { count: privateMembersCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('channel_type', 'private')

        const { count: withPromoterCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .not('promoter_id', 'is', null)

        // Promoteurs actifs
        const { count: activePromoters } = await supabase
          .from('promoters')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        // Liens actifs
        const { count: activeLinks } = await supabase
          .from('tracked_links')
          .select('*', { count: 'exact', head: true })

        // Conversions depuis tracked_links
        const { data: links } = await supabase
          .from('tracked_links')
          .select('conversions')

        const totalConversions = links?.reduce((sum, link) => sum + (link.conversions || 0), 0) || 0

        const totalMembers = totalMembersCount || 0
        const publicMembers = publicMembersCount || 0
        const privateMembers = privateMembersCount || 0
        const withPromoter = withPromoterCount || 0

        const conversionRate = totalMembers > 0 
          ? (totalConversions / totalMembers) * 100 
          : 0

        setStats({
          totalClicks: totalMembers,
          totalConversions,
          conversionRate,
          activePromoters: activePromoters || 0,
          activeLinks: activeLinks || 0,
          publicMembers,
          privateMembers,
          totalMembers,
          clicksTrend: withPromoter,
          conversionsTrend: 0,
        })
      } catch {
        // Ignore errors
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: 'Total Membres',
      value: stats.totalMembers.toLocaleString(),
      subtitle: `${stats.clicksTrend} via promoteur`,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Canal Public',
      value: stats.publicMembers.toLocaleString(),
      subtitle: 'membres',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Canal Prive',
      value: stats.privateMembers.toLocaleString(),
      subtitle: 'membres',
      icon: Users,
      color: 'text-violet-600',
    },
    {
      title: 'Promoteurs',
      value: stats.activePromoters.toLocaleString(),
      subtitle: `${stats.activeLinks} liens actifs`,
      icon: Target,
      color: 'text-green-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <stat.icon className={`size-4 ${stat.color}`} />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.trend !== undefined && (
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {stat.trend >= 0 ? (
                    <>
                      <TrendingUp className="size-3 text-green-600" />
                      <span className="text-green-600">+{stat.trend.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="size-3 text-red-600" />
                      <span className="text-red-600">{stat.trend.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs semaine dernière</span>
                </div>
              )}
              {stat.subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

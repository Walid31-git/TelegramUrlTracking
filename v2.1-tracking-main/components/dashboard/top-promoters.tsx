'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface PromoterStats {
  id: string
  name: string
  clicks: number
  conversions: number
  conversionRate: number
}

export function TopPromoters() {
  const [promoters, setPromoters] = useState<PromoterStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTopPromoters() {
      try {
        // Get all active promoters
        const { data: promotersData } = await supabase
          .from('promoters')
          .select('*')
          .eq('status', 'active')

        if (!promotersData) {
          setLoading(false)
          return
        }

        // Get stats for each promoter
        const promoterStats = await Promise.all(
          promotersData.map(async (promoter) => {
            // Get all links for this promoter
            const { data: links } = await supabase
              .from('tracked_links')
              .select('id')
              .eq('promoter_id', promoter.id)

            if (!links || links.length === 0) {
              return {
                ...promoter,
                clicks: 0,
                conversions: 0,
                conversionRate: 0,
              }
            }

            const linkIds = links.map(l => l.id)

            // Get clicks count
            const { count: clicks } = await supabase
              .from('clicks')
              .select('*', { count: 'exact', head: true })
              .in('link_id', linkIds)

            // Get conversions count
            const { count: conversions } = await supabase
              .from('conversions')
              .select('*', { count: 'exact', head: true })
              .in('link_id', linkIds)

            const conversionRate = clicks && clicks > 0
              ? ((conversions || 0) / clicks) * 100
              : 0

            return {
              id: promoter.id,
              name: promoter.name,
              clicks: clicks || 0,
              conversions: conversions || 0,
              conversionRate,
            }
          })
        )

        // Sort by conversions and take top 5
        const sortedPromoters = promoterStats
          .sort((a, b) => b.conversions - a.conversions)
          .slice(0, 5)

        setPromoters(sortedPromoters)
      } catch (error) {
        console.error('[v0] Error fetching top promoters:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopPromoters()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (promoters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Promoteurs</CardTitle>
          <CardDescription>Meilleurs promoteurs par conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune donnée disponible
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Promoteurs</CardTitle>
        <CardDescription>Meilleurs promoteurs par conversions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {promoters.map((promoter, index) => (
            <div key={promoter.id} className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {promoter.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{promoter.name}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{promoter.clicks.toLocaleString()} clics</span>
                  <span>•</span>
                  <span>{promoter.conversions} conversions</span>
                  <span>•</span>
                  <span>{promoter.conversionRate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

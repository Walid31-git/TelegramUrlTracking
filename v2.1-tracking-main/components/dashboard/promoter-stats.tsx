'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3 } from 'lucide-react'

interface PromoterStat {
  name: string
  members: number
  conversions: number
  rate: number
}

export function PromoterStats() {
  const [promoters, setPromoters] = useState<PromoterStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: promotersData } = await supabase
          .from('promoters')
          .select('id, name')
          .eq('status', 'active')

        if (!promotersData || promotersData.length === 0) {
          setLoading(false)
          return
        }

        const stats = await Promise.all(
          promotersData.map(async (promoter) => {
            const { data: links } = await supabase
              .from('tracked_links')
              .select('clicks, conversions')
              .eq('promoter_id', promoter.id)

            const members = links?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0
            const conversions = links?.reduce((sum, link) => sum + (link.conversions || 0), 0) || 0
            const rate = members > 0 ? (conversions / members) * 100 : 0

            return {
              name: promoter.name.length > 12 ? promoter.name.substring(0, 12) + '...' : promoter.name,
              members,
              conversions,
              rate,
            }
          })
        )

        setPromoters(stats.filter(p => p.members > 0).sort((a, b) => b.members - a.members).slice(0, 5))
      } catch (error) {
        console.error('Error fetching promoter stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const maxMembers = Math.max(...promoters.map(p => p.members), 1)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5" />
          Performance Promoteurs
        </CardTitle>
        <CardDescription>Top promoteurs par nombre de membres</CardDescription>
      </CardHeader>
      <CardContent>
        {promoters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune donnee disponible
          </p>
        ) : (
          <div className="space-y-4">
            {promoters.map((promoter, index) => (
              <div key={promoter.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground w-4">{index + 1}.</span>
                    <span className="font-medium">{promoter.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {promoter.members} membres
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(promoter.members / maxMembers) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {promoter.conversions} conversions ({promoter.rate.toFixed(1)}%)
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

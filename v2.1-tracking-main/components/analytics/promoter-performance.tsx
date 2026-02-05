'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

interface PromoterPerf {
  id: string
  name: string
  clicks: number
  conversions: number
  rate: number
}

export function PromoterPerformance() {
  const [promoters, setPromoters] = useState<PromoterPerf[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: promotersData } = await supabase
          .from('promoters')
          .select('*')
          .eq('status', 'active')

        if (!promotersData) {
          setLoading(false)
          return
        }

        const stats = await Promise.all(
          promotersData.map(async (promoter) => {
            const { data: links } = await supabase
              .from('tracked_links')
              .select('clicks, conversions')
              .eq('promoter_id', promoter.id)

            if (!links || links.length === 0) {
              return {
                id: promoter.id,
                name: promoter.name,
                clicks: 0,
                conversions: 0,
                rate: 0,
              }
            }

            const clicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0)
            const conversions = links.reduce((sum, link) => sum + (link.conversions || 0), 0)

            const rate = clicks > 0 ? (conversions / clicks) * 100 : 0

            return {
              id: promoter.id,
              name: promoter.name,
              clicks,
              conversions,
              rate,
            }
          })
        )

        // Sort by conversion rate
        const sorted = stats.sort((a, b) => b.rate - a.rate).slice(0, 8)
        setPromoters(sorted)
      } catch (error) {
        console.error('[v0] Error fetching promoter performance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
          <CardTitle>Taux de Conversion</CardTitle>
          <CardDescription>Promoteurs classes par taux de conversion</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            Aucune donnee disponible
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxRate = Math.max(...promoters.map(p => p.rate), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taux de Conversion</CardTitle>
        <CardDescription>Promoteurs classes par taux de conversion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {promoters.map((promoter) => (
            <div key={promoter.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{promoter.name}</span>
                <span className="text-muted-foreground">
                  {promoter.rate.toFixed(2)}%
                </span>
              </div>
              <Progress value={(promoter.rate / maxRate) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {promoter.conversions} conversions sur {promoter.clicks.toLocaleString()} membres
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

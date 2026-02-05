'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

interface PromoterData {
  name: string
  clicks: number
  conversions: number
  rate: number
}

export function AnalyticsOverview() {
  const [data, setData] = useState<PromoterData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Get all active promoters
        const { data: promoters } = await supabase
          .from('promoters')
          .select('*')
          .eq('status', 'active')

        if (!promoters) {
          setLoading(false)
          return
        }

        // Get stats for each promoter
        const promoterStats = await Promise.all(
          promoters.map(async (promoter) => {
            // Get all links for this promoter and sum their clicks/conversions
            const { data: links } = await supabase
              .from('tracked_links')
              .select('clicks, conversions')
              .eq('promoter_id', promoter.id)

            if (!links || links.length === 0) {
              return {
                name: promoter.name,
                clicks: 0,
                conversions: 0,
                rate: 0,
              }
            }

            // Sum up clicks and conversions from all links
            const clicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0)
            const conversions = links.reduce((sum, link) => sum + (link.conversions || 0), 0)

            const rate = clicks > 0 ? (conversions / clicks) * 100 : 0

            return {
              name: promoter.name.length > 15 ? promoter.name.substring(0, 15) + '...' : promoter.name,
              clicks,
              conversions,
              rate: Number(rate.toFixed(2)),
            }
          })
        )

        // Sort by clicks and take top 10
        const sortedData = promoterStats
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10)

        setData(sortedData)
      } catch (error) {
        console.error('[v0] Error fetching analytics data:', error)
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
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des Promoteurs</CardTitle>
          <CardDescription>Membres et conversions par promoteur</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            Aucune donnee disponible
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    clicks: {
      label: 'Membres',
      color: 'hsl(var(--chart-1))',
    },
    conversions: {
      label: 'Conversions',
      color: 'hsl(var(--chart-2))',
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison des Promoteurs</CardTitle>
        <CardDescription>Membres et conversions par promoteur</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tickLine={false}
                axisLine={false}
              />
              <YAxis className="text-xs" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversions" fill="var(--color-conversions)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

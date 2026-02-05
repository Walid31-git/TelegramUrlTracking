'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartData {
  date: string
  clicks: number
  conversions: number
}

export function ConversionChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChartData() {
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Get clicks by date
        const { data: clicks } = await supabase
          .from('clicks')
          .select('clicked_at')
          .gte('clicked_at', thirtyDaysAgo.toISOString())

        // Get conversions by date from clicks table
        const { data: conversions } = await supabase
          .from('clicks')
          .select('converted_at')
          .eq('converted', true)
          .gte('converted_at', thirtyDaysAgo.toISOString())

        // Group by date
        const dateMap = new Map<string, { clicks: number; conversions: number }>()

        // Initialize last 30 days
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          dateMap.set(dateStr, { clicks: 0, conversions: 0 })
        }

        // Count clicks
        clicks?.forEach((click) => {
          const dateStr = click.clicked_at.split('T')[0]
          const existing = dateMap.get(dateStr)
          if (existing) {
            existing.clicks++
          }
        })

        // Count conversions
        conversions?.forEach((conversion) => {
          if (conversion.converted_at) {
            const dateStr = conversion.converted_at.split('T')[0]
            const existing = dateMap.get(dateStr)
            if (existing) {
              existing.conversions++
            }
          }
        })

        // Convert to array
        const chartData: ChartData[] = Array.from(dateMap.entries()).map(([date, values]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          clicks: values.clicks,
          conversions: values.conversions,
        }))

        setData(chartData)
      } catch (error) {
        console.error('[v0] Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    clicks: {
      label: 'Clicks',
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
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>Clicks and conversions over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tickLine={false}
                axisLine={false}
              />
              <YAxis className="text-xs" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="var(--color-clicks)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="var(--color-conversions)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

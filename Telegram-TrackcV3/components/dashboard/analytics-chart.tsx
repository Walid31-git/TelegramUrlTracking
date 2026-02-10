'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface ChartData {
  date: string
  publicMembers: number
  privateMembers: number
  conversionRate: number
}

export function AnalyticsChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [channelNames, setChannelNames] = useState({
    public: 'Public',
    private: 'Privé',
  })
  const supabase = createClient()

  async function fetchChartData() {
    try {
      // Get channel names
      const { data: config } = await supabase
        .from('bot_config')
        .select('public_channel_id, private_channel_id, public_channel_name, private_channel_name')
        .limit(1)
        .single()

      if (config) {
        setChannelNames({
          public: config.public_channel_name || 'Public',
          private: config.private_channel_name || 'Privé',
        })
      }

      // Get last 30 days of member joins
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      
      const { data: membersData, error } = await supabase
        .from('telegram_members')
        .select('joined_at, chat_id')
        .gte('joined_at', thirtyDaysAgo.toISOString())
        .order('joined_at', { ascending: true })
      
      if (error) {
        console.error('[v0] Error fetching members:', error)
        setLoading(false)
        return
      }

      if (membersData && config) {
        const publicChatId = config.public_channel_id ? BigInt(config.public_channel_id) : null
        const privateChatId = config.private_channel_id ? BigInt(config.private_channel_id) : null

        // Group by day
        const groupedByDay = membersData.reduce((acc, member) => {
          const date = new Date(member.joined_at).toISOString().split('T')[0]
          if (!acc[date]) {
            acc[date] = { publicMembers: 0, privateMembers: 0 }
          }
          
          const memberChatId = BigInt(member.chat_id)
          if (publicChatId && memberChatId === publicChatId) {
            acc[date].publicMembers += 1
          } else if (privateChatId && memberChatId === privateChatId) {
            acc[date].privateMembers += 1
          }
          
          return acc
        }, {} as Record<string, { publicMembers: number; privateMembers: number }>)

        // Fill in all 30 days (including days with 0 members)
        const chartData: ChartData[] = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          date.setHours(0, 0, 0, 0)
          const dateKey = date.toISOString().split('T')[0]
          
          const dayData = groupedByDay[dateKey] || { publicMembers: 0, privateMembers: 0 }
          const conversionRate = dayData.publicMembers > 0 
            ? (dayData.privateMembers / dayData.publicMembers) * 100 
            : 0

          chartData.push({
            date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
            publicMembers: dayData.publicMembers,
            privateMembers: dayData.privateMembers,
            conversionRate,
          })
        }

        setData(chartData)
      }
    } catch (error) {
      console.error('[v0] Error fetching chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChartData()

    // Real-time updates
    const channel = supabase
      .channel('chart-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'telegram_members' },
        () => {
          console.log('[v0] Chart data updated')
          fetchChartData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bot_config' },
        () => {
          console.log('[v0] Bot config updated')
          fetchChartData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveaux membres - 30 derniers jours</CardTitle>
        <CardDescription>
          Évolution quotidienne des adhésions via vos liens de tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Aucune donnée disponible</p>
              <p className="text-sm text-muted-foreground">
                Les nouveaux membres apparaîtront ici une fois qu'ils rejoindront via vos liens
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={{
              publicMembers: {
                label: channelNames.public,
                color: 'hsl(var(--success))',
              },
              privateMembers: {
                label: channelNames.private,
                color: 'hsl(var(--chart-1))',
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="publicMembers"
                  name={channelNames.public}
                  stroke="var(--color-publicMembers)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-publicMembers)' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="privateMembers"
                  name={channelNames.private}
                  stroke="var(--color-privateMembers)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-privateMembers)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

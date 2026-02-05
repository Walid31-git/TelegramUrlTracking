'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { MousePointerClick, Target } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Activity {
  id: string
  type: 'click' | 'conversion'
  promoter_name: string
  timestamp: string
  country?: string | null
  device_type?: string | null
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        // Get recent clicks
        const { data: recentClicks } = await supabase
          .from('clicks')
          .select(`
            id,
            clicked_at,
            country,
            device_type,
            tracked_links!inner(
              promoters!inner(
                name,
                channel_type
              )
            )
          `)
          .order('clicked_at', { ascending: false })
          .limit(10)

        // Get recent conversions
        const { data: recentConversions } = await supabase
          .from('conversions')
          .select(`
            id,
            converted_at,
            tracked_links!inner(
              promoters!inner(
                name,
                channel_type
              )
            )
          `)
          .order('converted_at', { ascending: false })
          .limit(10)

        // Combine and format activities
        const clickActivities: Activity[] = (recentClicks || []).map((click: any) => ({
          id: click.id,
          type: 'click' as const,
          promoter_name: click.tracked_links?.promoters?.name || 'Unknown',
          timestamp: click.clicked_at,
          country: click.country,
          device_type: click.device_type,
        }))

        const conversionActivities: Activity[] = (recentConversions || []).map((conversion: any) => ({
          id: conversion.id,
          type: 'conversion' as const,
          promoter_name: conversion.tracked_links?.promoters?.name || 'Unknown',
          timestamp: conversion.converted_at,
        }))

        // Combine and sort by timestamp
        const allActivities = [...clickActivities, ...conversionActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)

        setActivities(allActivities)
      } catch (error) {
        console.error('[v0] Error fetching recent activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-lg mt-0.5" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
          <CardDescription>Derniers clics et conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune activité récente
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
        <CardDescription>Derniers clics et conversions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                activity.type === 'click' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {activity.type === 'click' ? (
                  <MousePointerClick className="size-4" />
                ) : (
                  <Target className="size-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {activity.type === 'click' ? 'Nouveau clic' : 'Conversion'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  De {activity.promoter_name}
                  {activity.country && ` • ${activity.country}`}
                  {activity.device_type && ` • ${activity.device_type}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

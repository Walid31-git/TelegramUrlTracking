'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { Globe } from 'lucide-react'

interface CountryData {
  country: string
  clicks: number
  conversions: number
  rate: number
}

export function GeographicData() {
  const [countries, setCountries] = useState<CountryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Get all clicks with country data
        const { data: clicks } = await supabase
          .from('clicks')
          .select('country, link_id')
          .not('country', 'is', null)

        if (!clicks) {
          setLoading(false)
          return
        }

        // Group by country
        const countryMap = new Map<string, { clicks: number; linkIds: Set<string> }>()

        clicks.forEach((click) => {
          const country = click.country || 'Unknown'
          if (!countryMap.has(country)) {
            countryMap.set(country, { clicks: 0, linkIds: new Set() })
          }
          const data = countryMap.get(country)!
          data.clicks++
          data.linkIds.add(click.link_id)
        })

        // Get conversions for each country
        const countryStats = await Promise.all(
          Array.from(countryMap.entries()).map(async ([country, data]) => {
            const { count: conversions } = await supabase
              .from('conversions')
              .select('*', { count: 'exact', head: true })
              .in('link_id', Array.from(data.linkIds))

            const rate = data.clicks > 0 ? ((conversions || 0) / data.clicks) * 100 : 0

            return {
              country,
              clicks: data.clicks,
              conversions: conversions || 0,
              rate,
            }
          })
        )

        // Sort by clicks and take top 10
        const sorted = countryStats.sort((a, b) => b.clicks - a.clicks).slice(0, 10)
        setCountries(sorted)
      } catch (error) {
        console.error('[v0] Error fetching geographic data:', error)
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
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (countries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution</CardTitle>
          <CardDescription>Traffic breakdown by country</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            No geographic data available yet
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalClicks = countries.reduce((sum, c) => sum + c.clicks, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geographic Distribution</CardTitle>
        <CardDescription>Traffic breakdown by country</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {countries.map((country, index) => {
            const percentage = (country.clicks / totalClicks) * 100
            return (
              <div key={country.country} className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Globe className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{country.country}</p>
                    <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{country.clicks.toLocaleString()} clicks</span>
                    <span>•</span>
                    <span>{country.conversions} conversions</span>
                    <span>•</span>
                    <span>{country.rate.toFixed(1)}% rate</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

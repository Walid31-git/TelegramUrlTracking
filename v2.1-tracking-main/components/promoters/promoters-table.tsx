'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase, type Promoter } from '@/lib/supabase'
import { MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface PromoterWithStats extends Promoter {
  clickCount: number
  conversionCount: number
  linkCount: number
}

export function PromotersTable() {
  const [promoters, setPromoters] = useState<PromoterWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function fetchPromoters() {
    try {
      const { data: promotersData } = await supabase
        .from('promoters')
        .select('*')
        .order('created_at', { ascending: false })

      if (!promotersData) {
        setLoading(false)
        return
      }

      // Get stats for each promoter
      const promotersWithStats = await Promise.all(
        promotersData.map(async (promoter) => {
          // Get links and aggregate their clicks
          const { data: links } = await supabase
            .from('tracked_links')
            .select('id, clicks, conversions')
            .eq('promoter_id', promoter.id)

          // Sum up clicks and conversions from all links
          const clickCount = links?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0
          const conversionCount = links?.reduce((sum, link) => sum + (link.conversions || 0), 0) || 0

          return {
            ...promoter,
            clickCount,
            conversionCount,
            linkCount: links?.length || 0,
          }
        })
      )

      setPromoters(promotersWithStats)
    } catch (error) {
      console.error('[v0] Error fetching promoters:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromoters()
  }, [])

  async function togglePromoterStatus(promoter: PromoterWithStats) {
    try {
      const newStatus = promoter.status === 'active' ? 'inactive' : 'active'
      await supabase
        .from('promoters')
        .update({ status: newStatus })
        .eq('id', promoter.id)

      // Refresh data
      fetchPromoters()
    } catch (error) {
      console.error('[v0] Error toggling promoter status:', error)
    }
  }

  async function deletePromoter(promoterId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce promoteur ? Cette action est irréversible.')) {
      return
    }

    try {
      await supabase
        .from('promoters')
        .delete()
        .eq('id', promoterId)

      // Refresh data
      fetchPromoters()
    } catch (error) {
      console.error('[v0] Error deleting promoter:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
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
          <CardTitle>Promoteurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Aucun promoteur ajouté. Ajoutez votre premier promoteur pour commencer le suivi.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{promoters.length} Promoteurs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="text-center">Liens</TableHead>
                <TableHead className="text-center">Membres</TableHead>
                <TableHead className="text-center">Conversions</TableHead>
                <TableHead>Ajouté</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoters.map((promoter) => (
                <TableRow key={promoter.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{promoter.name}</p>
                      {promoter.notes && (
                        <p className="text-xs text-muted-foreground">
                          {promoter.notes}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{promoter.linkCount}</TableCell>
                  <TableCell className="text-center font-medium">{promoter.clickCount.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{promoter.conversionCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(promoter.created_at), { addSuffix: true, locale: fr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={promoter.status === 'active' ? 'default' : 'secondary'}>
                      {promoter.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => togglePromoterStatus(promoter)}>
                          {promoter.status === 'active' ? (
                            <>
                              <ToggleLeft className="mr-2 size-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 size-4" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deletePromoter(promoter.id)} className="text-destructive">
                          <Trash2 className="mr-2 size-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

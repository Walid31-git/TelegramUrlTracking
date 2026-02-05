'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase, type TrackedLink, type Promoter } from '@/lib/supabase'
import { MoreHorizontal, Copy, Trash2, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface LinkWithStats extends TrackedLink {
  promoter: Promoter
  clickCount: number
  conversionCount: number
}

export function LinksTable() {
  const [links, setLinks] = useState<LinkWithStats[]>([])
  const [filteredLinks, setFilteredLinks] = useState<LinkWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [promoterFilter, setPromoterFilter] = useState<string>('all')
  const [promoters, setPromoters] = useState<Promoter[]>([])

  async function fetchLinks() {
    try {
      // Get all promoters for filter
      const { data: promotersData } = await supabase
        .from('promoters')
        .select('*')
        .order('name')

      setPromoters(promotersData || [])

      // Get all links with promoter info
      const { data: linksData } = await supabase
        .from('tracked_links')
        .select(`
          *,
          promoters (*)
        `)
        .order('created_at', { ascending: false })

      if (!linksData) {
        setLoading(false)
        return
      }

      // Map with stats from the tracked_links table itself
      const linksWithStats = linksData.map((link: any) => ({
        ...link,
        promoter: link.promoters,
        clickCount: link.clicks || 0,
        conversionCount: link.conversions || 0,
      }))

      setLinks(linksWithStats)
      setFilteredLinks(linksWithStats)
    } catch (error) {
      console.error('[v0] Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = links

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (link) =>
          link.telegram_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.link_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.promoter.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter (links don't have is_active, so we'll skip this)
    // All links are considered active

    // Promoter filter
    if (promoterFilter !== 'all') {
      filtered = filtered.filter((link) => link.promoter_id === promoterFilter)
    }

    setFilteredLinks(filtered)
  }, [searchQuery, statusFilter, promoterFilter, links])

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (error) {
      console.error('[v0] Error copying to clipboard:', error)
    }
  }

  async function deleteLink(linkId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lien ? Cette action est irréversible.')) {
      return
    }

    try {
      await supabase
        .from('tracked_links')
        .delete()
        .eq('id', linkId)

      fetchLinks()
    } catch (error) {
      console.error('[v0] Error deleting link:', error)
    }
  }

  const toggleLinkStatus = async (link: LinkWithStats) => {
    try {
      await supabase
        .from('tracked_links')
        .update({ is_active: !link.is_active })
        .eq('id', link.id)

      fetchLinks()
    } catch (error) {
      console.error('[v0] Error toggling link status:', error)
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{filteredLinks.length} Liens</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full sm:w-[250px]"
              />
            </div>
            <Select value={promoterFilter} onValueChange={setPromoterFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les Promoteurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Promoteurs</SelectItem>
                {promoters.map((promoter) => (
                  <SelectItem key={promoter.id} value={promoter.id}>
                    {promoter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {links.length === 0
                ? 'Aucun lien créé. Ajoutez votre premier lien de suivi pour commencer.'
                : 'Aucun lien ne correspond à vos filtres.'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Lien</TableHead>
                  <TableHead>Promoteur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Membres</TableHead>
                  <TableHead className="text-center">Conversions</TableHead>
                  <TableHead>Créé</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {link.link_id}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => copyToClipboard(link.link_id)}
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{link.promoter.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          link.type === 'public'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                        }
                      >
                        {link.type === 'public' ? 'Public' : 'Privé'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{link.clickCount.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{link.conversionCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(link.created_at), { addSuffix: true, locale: fr })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyToClipboard(link.link_id)}>
                            <Copy className="mr-2 size-4" />
                            Copier l'ID
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteLink(link.id)} className="text-destructive">
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
        )}
      </CardContent>
    </Card>
  )
}

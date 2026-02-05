'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { Search, Users, RefreshCw, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Member {
  id: string
  user_id: number
  first_name: string
  last_name: string | null
  username: string | null
  channel_type: 'public' | 'private'
  promoter_id: string | null
  promoter_name?: string
  joined_at: string
}

interface Promoter {
  id: string
  name: string
}

export function MembersTable() {
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [promoters, setPromoters] = useState<Promoter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<'all' | 'public' | 'private'>('all')
  const [promoterFilter, setPromoterFilter] = useState<string>('all')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  async function syncMembers() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const response = await fetch('/api/telegram/sync-members', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setSyncMessage(`${data.results.public.admins + data.results.private.admins} admins importes`)
        await fetchMembers()
      } else {
        setSyncMessage(data.error)
      }
      
      setTimeout(() => setSyncMessage(null), 5000)
    } catch {
      setSyncMessage('Erreur de synchronisation')
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  async function fetchMembers() {
    try {
      const { data: promotersData } = await supabase
        .from('promoters')
        .select('id, name')
        .order('name')

      setPromoters(promotersData || [])

      const { data: membersData } = await supabase
        .from('members')
        .select(`*, promoters (name)`)
        .order('joined_at', { ascending: false })

      const membersWithPromoter = (membersData || []).map((m: any) => ({
        ...m,
        promoter_name: m.promoters?.name || null,
      }))

      setMembers(membersWithPromoter)
      setFilteredMembers(membersWithPromoter)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    let filtered = members

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.first_name?.toLowerCase().includes(query) ||
          m.last_name?.toLowerCase().includes(query) ||
          m.username?.toLowerCase().includes(query)
      )
    }

    if (channelFilter !== 'all') {
      filtered = filtered.filter((m) => m.channel_type === channelFilter)
    }

    if (promoterFilter === 'none') {
      filtered = filtered.filter((m) => !m.promoter_id)
    } else if (promoterFilter !== 'all') {
      filtered = filtered.filter((m) => m.promoter_id === promoterFilter)
    }

    setFilteredMembers(filtered)
  }, [searchQuery, channelFilter, promoterFilter, members])

  const stats = {
    total: members.length,
    withPromoter: members.filter((m) => m.promoter_id).length,
    direct: members.filter((m) => !m.promoter_id).length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Membres ({stats.total})
            </CardTitle>
            <CardDescription>
              {stats.withPromoter} via promoteur, {stats.direct} direct
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[150px]"
              />
            </div>
            <Select value={channelFilter} onValueChange={(v: any) => setChannelFilter(v)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Prive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={promoterFilter} onValueChange={setPromoterFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Promoteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="none">Direct</SelectItem>
                {promoters.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={syncMembers} disabled={syncing}>
              <Download className={`mr-1 size-4 ${syncing ? 'animate-bounce' : ''}`} />
              Sync
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchMembers} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {syncMessage && (
          <p className={`text-sm mt-2 ${syncMessage.includes('Erreur') || syncMessage.includes('non') ? 'text-red-600' : 'text-green-600'}`}>
            {syncMessage}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto size-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {members.length === 0 ? 'Aucun membre. Cliquez sur Sync pour importer.' : 'Aucun resultat.'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Promoteur</TableHead>
                  <TableHead>Rejoint</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.slice(0, 50).map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.first_name} {member.last_name || ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.username ? `@${member.username}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={member.channel_type === 'public' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}
                      >
                        {member.channel_type === 'public' ? 'Public' : 'Prive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.promoter_name ? (
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                          {member.promoter_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Direct</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {member.joined_at ? formatDistanceToNow(new Date(member.joined_at), { addSuffix: true, locale: fr }) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredMembers.length > 50 && (
              <p className="text-center text-sm text-muted-foreground py-2">
                Affichage des 50 premiers sur {filteredMembers.length}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

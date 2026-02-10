'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink, Trash2, Check } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Link {
  id: string
  full_url: string
  channel_type: 'public' | 'private'
  created_at: string
  is_used: boolean
  used_at: string | null
}

export function LinksList({ promoterId }: { promoterId: string }) {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all')
  const supabase = createClient()

  async function fetchLinks() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('promoter_links')
        .select('*')
        .eq('promoter_id', promoterId)
        .eq('is_used', false)
        .order('created_at', { ascending: false })

      if (data) {
        setLinks(data)
      }
    } catch (error) {
      console.error('[v0] Error fetching links:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()

    const channel = supabase
      .channel(`links-${promoterId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'promoter_links',
          filter: `promoter_id=eq.${promoterId}`
        },
        (payload) => {
          console.log('[v0] Real-time update received:', payload.eventType)
          fetchLinks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [promoterId, supabase])

  async function deleteLink(id: string) {
    try {
      const { error } = await supabase.from('promoter_links').delete().eq('id', id)

      if (error) throw error

      setLinks(links.filter((l) => l.id !== id))
    } catch (error) {
      console.error('[v0] Error deleting link:', error)
    }
  }

  async function copyToClipboard(fullUrl: string, id: string) {
    try {
      // Copier dans le presse-papier
      await navigator.clipboard.writeText(fullUrl)
      
      // Marquer comme utilisé dans la DB
      const { error } = await supabase
        .from('promoter_links')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', id)
      
      if (error) throw error
      
      // Retirer immédiatement de la liste locale
      setLinks(links.filter(l => l.id !== id))
      
      // Animation de confirmation
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('[v0] Error copying link:', error)
    }
  }

  async function copyAllToClipboard() {
  try {
    const urls = filteredLinks.map(link => link.full_url).join('\n')
    await navigator.clipboard.writeText(urls)
    
    // Récupérer tous les IDs des liens filtrés
    const linkIds = filteredLinks.map(link => link.id)
    
    // Marquer tous comme utilisés dans la DB
    const { error } = await supabase
      .from('promoter_links')
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString() 
      })
      .in('id', linkIds)
    
    if (error) throw error
    
    // Retirer tous les liens copiés de la liste locale
    setLinks(links.filter(l => !linkIds.includes(l.id)))
    
    // Animation de confirmation
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  } catch (error) {
    console.error('[v0] Error copying all links:', error)
  }
}

  const filteredLinks = filterType === 'all' 
    ? links 
    : links.filter(link => link.channel_type === filterType)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liens de tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liens de tracking</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-success/10 p-4 mb-4">
            <ExternalLink className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun lien créé</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Créez votre premier lien de tracking en cliquant sur le bouton vert "Ajouter des liens" en haut à droite de la page.
          </p>
          <p className="text-xs text-muted-foreground">
            Les liens permettent de suivre les clics et conversions de ce promoteur
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Liens de tracking</CardTitle>
          {filteredLinks.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyAllToClipboard}
              className="gap-2 bg-transparent"
            >
              {copiedAll ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copier tous les liens
                </>
              )}
            </Button>
          )}
        </div>

        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Tous ({links.length})</TabsTrigger>
            <TabsTrigger value="public">Public ({links.filter(l => l.channel_type === 'public').length})</TabsTrigger>
            <TabsTrigger value="private">Privé ({links.filter(l => l.channel_type === 'private').length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        {filteredLinks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun lien de ce type
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={link.channel_type === 'public' ? 'default' : 'secondary'}
                      className={
                        link.channel_type === 'public'
                          ? 'border-success/50 bg-success/10 text-success'
                          : 'border-blue-500/50 bg-blue-500/10 text-blue-500'
                      }
                    >
                      {link.channel_type === 'public' ? 'Public' : 'Privé'}
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/50">
                      Non utilisé
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      Lien d'invitation vers le canal {link.channel_type === 'public' ? 'public' : 'privé'}
                    </span>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Créé le {new Date(link.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(link.full_url, link.id)}
                  >
                    {copiedId === link.id ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le lien</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer ce lien ? Cette action
                          est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteLink(link.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

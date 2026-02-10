'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Copy, ExternalLink, Trash2, Check, RefreshCw, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ExternalLink {
  id: string
  name: string
  full_url: string
  channel_type: 'public' | 'private'
  created_at: string
  member_count?: number
}

export default function LinksPage() {
  const [publicLink, setPublicLink] = useState<ExternalLink | null>(null)
  const [privateLinks, setPrivateLinks] = useState<ExternalLink[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [creating, setCreating] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  async function fetchLinks() {
    try {
      setLoading(true)
      
      // Get bot config to get public channel ID
      const { data: config } = await supabase
        .from('bot_config')
        .select('public_channel_id')
        .limit(1)
        .single()

      const publicChatId = config?.public_channel_id

      // Fetch all external links
      const { data: links, error } = await supabase
        .from('external_links')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Count members for each link using the same logic as dashboard
      const linksWithCounts = await Promise.all(
        (links || []).map(async (link) => {
          let count = 0
          
          if (link.channel_type === 'public' && publicChatId) {
            // Pour le lien public : compter ceux qui ont rejoint le canal public via ce lien
            const { count: memberCount } = await supabase
              .from('telegram_members')
              .select('id', { count: 'exact', head: true })
              .eq('chat_id', publicChatId)
              .eq('invite_link_url', link.full_url)
            
            count = memberCount || 0
          } else {
            // Pour les liens privés : garder l'ancienne logique
            const { count: memberCount } = await supabase
              .from('telegram_members')
              .select('id', { count: 'exact', head: true })
              .eq('external_link_id', link.id)
            
            count = memberCount || 0
          }

          return {
            ...link,
            member_count: count,
          }
        })
      )

      // Separate public and private links
      const publicLinks = linksWithCounts.filter(l => l.channel_type === 'public')
      const pvtLinks = linksWithCounts.filter(l => l.channel_type === 'private')

      // Set public link (only the first one)
      setPublicLink(publicLinks[0] || null)
      
      // Set private links
      setPrivateLinks(pvtLinks)
    } catch (error) {
      console.error('[LinksPage] Error fetching links:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les liens',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function generatePublicLink() {
    setRegenerating(true)
    try {
      // Delete existing public link if any
      if (publicLink) {
        await supabase
          .from('external_links')
          .delete()
          .eq('id', publicLink.id)
      }

      // Generate new public link
      const response = await fetch('/api/external-links/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Lien Public Principal',
          channel_type: 'public',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la génération')
      }

      toast({
        title: publicLink ? 'Lien régénéré !' : 'Lien créé !',
        description: 'Le lien public a été généré avec succès',
      })

      fetchLinks()
    } catch (error: any) {
      console.error('[LinksPage] Generation error:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de générer le lien',
        variant: 'destructive',
      })
    } finally {
      setRegenerating(false)
    }
  }

  async function createPrivateLinks() {
    if (quantity < 1 || quantity > 10) {
      toast({
        title: 'Erreur',
        description: 'Veuillez créer entre 1 et 10 liens',
        variant: 'destructive',
      })
      return
    }

    setCreating(true)
    try {
      // Create links one by one
      for (let i = 0; i < quantity; i++) {
        const response = await fetch('/api/external-links/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Lien Privé ${new Date().toLocaleDateString('fr-FR')} #${i + 1}`,
            channel_type: 'private',
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erreur lors de la génération')
        }
      }

      toast({
        title: 'Liens créés !',
        description: `${quantity} lien${quantity > 1 ? 's' : ''} privé${quantity > 1 ? 's' : ''} créé${quantity > 1 ? 's' : ''} avec succès`,
      })

      setQuantity(1)
      setShowCreateDialog(false)
      fetchLinks()
    } catch (error: any) {
      console.error('[LinksPage] Creation error:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer les liens',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  async function deletePrivateLink(linkId: string) {
    try {
      const { error } = await supabase
        .from('external_links')
        .delete()
        .eq('id', linkId)

      if (error) throw error

      toast({
        title: 'Lien supprimé',
        description: 'Le lien a été supprimé avec succès',
      })

      fetchLinks()
    } catch (error) {
      console.error('[LinksPage] Delete error:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le lien',
        variant: 'destructive',
      })
    }
  }

  async function copyToClipboard(url: string, id: string, isPrivate: boolean = false) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      
      // If it's a private link, mark as used and hide it
      if (isPrivate) {
        // Remove from local state immediately for better UX
        setPrivateLinks(privateLinks.filter(l => l.id !== id))
        
        // Update in database (optional: you could track usage)
        // For now we just remove it from the list
      }
      
      toast({
        title: 'Copié !',
        description: isPrivate 
          ? 'Le lien a été copié et retiré de la liste (usage unique)'
          : 'Le lien a été copié dans le presse-papier',
      })
    } catch (error) {
      console.error('[LinksPage] Copy error:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        variant: 'destructive',
      })
    }
  }

  async function copyAllPrivateLinks() {
    try {
      const urls = privateLinks.map(link => link.full_url).join('\n')
      await navigator.clipboard.writeText(urls)
      
      // Hide all private links since they're one-time use
      setPrivateLinks([])
      
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
      
      toast({
        title: 'Copié !',
        description: `${privateLinks.length} lien${privateLinks.length > 1 ? 's' : ''} copié${privateLinks.length > 1 ? 's' : ''} et retiré${privateLinks.length > 1 ? 's' : ''} de la liste`,
      })
    } catch (error) {
      console.error('[LinksPage] Copy all error:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de copier les liens',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    fetchLinks()

    // Real-time subscription
    const channel = supabase
      .channel('links-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'external_links' },
        () => {
          fetchLinks()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'telegram_members' },
        () => {
          fetchLinks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Liens de Tracking</h1>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Liens de Tracking</h1>
          <p className="text-muted-foreground">
            Gérez votre lien public unique et vos liens privés
          </p>
        </div>

        {/* Section 1: Public Link */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lien Public Principal</CardTitle>
                <CardDescription>
                  Lien permanent pour votre canal public (non expirable)
                </CardDescription>
              </div>
              {!publicLink && (
                <Button
                  onClick={generatePublicLink}
                  disabled={regenerating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  Générer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!publicLink ? (
              <div className="text-center py-8 text-muted-foreground">
                <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun lien public créé</p>
                <p className="text-sm mt-2">
                  Cliquez sur "Générer" pour créer votre lien principal
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <ExternalLink className="h-6 w-6 text-green-600" />
                  {publicLink.member_count || 0}
                  <span className="text-base font-normal text-muted-foreground">
                    membres trackés
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={publicLink.full_url}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(publicLink.full_url, publicLink.id)}
                  >
                    {copiedId === publicLink.id ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    Public
                  </Badge>
                  <Badge variant="outline">
                    Créé le {new Date(publicLink.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Private Links */}
        {/* <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Liens Privés ({privateLinks.length})</CardTitle>
                <CardDescription>
                  Créez des liens multiples pour votre canal privé
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {privateLinks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllPrivateLinks}
                  >
                    {copiedAll ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-success" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier tous
                      </>
                    )}
                  </Button>
                )}
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-success text-success-foreground hover:bg-success/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer des liens
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer des liens privés</DialogTitle>
                      <DialogDescription>
                        Générez de 1 à 10 liens pour votre canal privé
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Nombre de liens (1-10)</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min={1}
                          max={10}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Créez jusqu'à 10 liens Telegram en même temps
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        disabled={creating}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={createPrivateLinks}
                        disabled={creating}
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        {creating ? 'Création...' : `Créer ${quantity} lien${quantity > 1 ? 's' : ''}`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {privateLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun lien privé créé</p>
                <p className="text-sm mt-2">
                  Cliquez sur "Créer des liens" pour générer vos premiers liens privés
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {privateLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="border-blue-500/50 bg-blue-500/10 text-blue-500">
                          Privé
                        </Badge>
                        <span className="text-sm font-medium">{link.name}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        <span>{link.member_count || 0} membre{(link.member_count || 0) > 1 ? 's' : ''}</span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Créé le {new Date(link.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(link.full_url, link.id, true)}
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
                              onClick={() => deletePrivateLink(link.id)}
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
        </Card> */}
      </main>
    </div>
  )
}

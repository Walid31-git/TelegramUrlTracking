'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AddLinkDialog({ promoterId }: { promoterId: string }) {
  const [open, setOpen] = useState(false)
  const [channelType, setChannelType] = useState<'public' | 'private' | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [publicChannelId, setPublicChannelId] = useState('')
  const [privateChannelId, setPrivateChannelId] = useState('')
  const [configLoading, setConfigLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Fetch bot config when dialog opens
  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data } = await supabase
          .from('bot_config')
          .select('bot_token, public_channel_id, private_channel_id')
          .limit(1)
          .single()

        if (data) {
          setPublicChannelId(data.public_channel_id || '')
          setPrivateChannelId(data.private_channel_id || '')
        }
      } catch (err) {
        console.error('[AddLinkDialog] Error fetching config:', err)
      } finally {
        setConfigLoading(false)
      }
    }

    if (open) {
      setConfigLoading(true)
      fetchConfig()
    }
  }, [open, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!channelType) throw new Error('Veuillez sélectionner un type de canal')
      if (!promoterId) throw new Error('Promoter ID manquant')

      const channelId = channelType === 'public' ? publicChannelId : privateChannelId
      if (!channelId) throw new Error('Canal non configuré. Configurez les canaux d\'abord.')

      const finalQuantity = Math.min(Math.max(1, quantity), 10)
      
      console.log('[AddLinkDialog] Creating links:', {
        promoterId,
        channelType,
        channelId,
        quantity: finalQuantity
      })
      
      // Create links one by one
      const createdLinks = []
      for (let i = 0; i < finalQuantity; i++) {
        const res = await fetch('/api/telegram/create-invite-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            channel_id: channelId, 
            is_single_use: true,
            promoter_id: promoterId,
            channel_type: channelType,
          }),
        })

        const json = await res.json()
        
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erreur création lien Telegram')
        }

        createdLinks.push({
          invite_link: json.invite_link,
          link_id: json.link_id,
        })
        
        console.log(`[AddLinkDialog] Link ${i + 1}/${finalQuantity} created:`, json.invite_link)
      }

      console.log('[AddLinkDialog] All links created successfully:', createdLinks)

      // Reset form and close dialog
      setChannelType('')
      setQuantity(1)
      setOpen(false)
      
      // Force refresh
      router.refresh()

    } catch (err: any) {
      console.error('[AddLinkDialog] Error:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-success text-success-foreground hover:bg-success/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter des liens
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer des liens de tracking</DialogTitle>
            <DialogDescription>
              Générez de 1 à 10 liens Telegram pour suivre les clics et conversions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {configLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Chargement de la configuration...
              </div>
            ) : !publicChannelId && !privateChannelId ? (
              <Alert>
                <AlertDescription>
                  Aucun canal configuré. Configurez d'abord les canaux dans Configuration.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="channelType">Type de canal</Label>
                  <Select value={channelType} onValueChange={(value) => setChannelType(value as 'public' | 'private')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {publicChannelId && <SelectItem value="public">Canal Public</SelectItem>}
                      {privateChannelId && <SelectItem value="private">Canal Privé</SelectItem>}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Le lien redirigera vers le canal sélectionné
                  </p>
                </div>

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
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || configLoading || (!publicChannelId && !privateChannelId) || !channelType}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {loading ? 'Création...' : `Créer ${quantity} lien${quantity > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

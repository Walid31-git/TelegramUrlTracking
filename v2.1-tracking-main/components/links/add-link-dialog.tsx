'use client'

import React from "react"

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase, type Promoter } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddLinkDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [promoters, setPromoters] = useState<Promoter[]>([])
  const [formData, setFormData] = useState({
    promoter_id: '',
    channel_type: 'public' as 'public' | 'private',
  })
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchPromoters() {
      const { data } = await supabase
        .from('promoters')
        .select('*')
        .eq('status', 'active')
        .order('name')

      setPromoters(data || [])
    }

    if (open) {
      fetchPromoters()
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setGeneratedLink(null)

    try {
      // Appeler l'API pour générer le lien via le bot Telegram
      const response = await fetch('/api/telegram/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoter_id: formData.promoter_id,
          channel_type: formData.channel_type,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la création du lien')
      }

      setGeneratedLink(data.invite_link)

      // Reset form
      setFormData({
        promoter_id: '',
        channel_type: 'public',
      })

      // Refresh after 2 seconds
      setTimeout(() => {
        setOpen(false)
        setGeneratedLink(null)
        router.refresh()
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('[v0] Error adding link:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'ajout du lien. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Ajouter Lien
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer un Lien d'Invitation</DialogTitle>
            <DialogDescription>
              Le bot Telegram générera automatiquement un lien d'invitation unique.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="promoter">Promoteur *</Label>
              <Select
                value={formData.promoter_id}
                onValueChange={(value) => setFormData({ ...formData, promoter_id: value })}
                required
              >
                <SelectTrigger id="promoter">
                  <SelectValue placeholder="Sélectionner un promoteur" />
                </SelectTrigger>
                <SelectContent>
                  {promoters.map((promoter) => (
                    <SelectItem key={promoter.id} value={promoter.id}>
                      {promoter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {promoters.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun promoteur actif. Ajoutez d'abord un promoteur.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="channel_type">Type de Canal *</Label>
              <Select
                value={formData.channel_type}
                onValueChange={(value: 'public' | 'private') => setFormData({ ...formData, channel_type: value })}
                required
              >
                <SelectTrigger id="channel_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Privé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {generatedLink && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">✓ Lien créé avec succès !</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white dark:bg-gray-900 p-2 rounded border">
                    {generatedLink}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink)
                    }}
                  >
                    Copier
                  </Button>
                </div>
              </div>
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
            <Button type="submit" disabled={loading || promoters.length === 0}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

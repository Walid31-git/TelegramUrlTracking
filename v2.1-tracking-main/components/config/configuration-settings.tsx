'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { supabase, type Configuration } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function ConfigurationSettings() {
  const [configs, setConfigs] = useState<Configuration[]>([])
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
  })

  async function fetchConfigs() {
    try {
      const { data } = await supabase
        .from('configuration')
        .select('*')
        .order('key')

      setConfigs(data || [])
    } catch (error) {
      console.error('[v0] Error fetching configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  function handleAdd() {
    setEditingConfig(null)
    setFormData({ key: '', value: '', description: '' })
    setIsDialogOpen(true)
  }

  function handleEdit(config: Configuration) {
    setEditingConfig(config)
    setFormData({
      key: config.key,
      value: config.value,
      description: config.description || '',
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingConfig) {
        // Update existing
        await supabase
          .from('configuration')
          .update({
            value: formData.value,
            description: formData.description || null,
          })
          .eq('id', editingConfig.id)
      } else {
        // Create new
        await supabase.from('configuration').insert({
          key: formData.key,
          value: formData.value,
          description: formData.description || null,
        })
      }

      setIsDialogOpen(false)
      fetchConfigs()
    } catch (error) {
      console.error('[v0] Error saving configuration:', error)
      alert('Failed to save configuration. Please try again.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      return
    }

    try {
      await supabase.from('configuration').delete().eq('id', id)
      fetchConfigs()
    } catch (error) {
      console.error('[v0] Error deleting configuration:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Configuration Système</CardTitle>
            <CardDescription className="mt-1.5">
              Gérer les paramètres de configuration clé-valeur
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Ajouter un Paramètre
          </Button>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Aucun paramètre de configuration pour le moment. Ajoutez votre premier paramètre pour commencer.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clé</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Dernière Mise à Jour</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                          {config.key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{config.value}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {config.description || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(config.updated_at), { addSuffix: true, locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleEdit(config)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(config.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Modifier la Configuration' : 'Ajouter une Configuration'}
              </DialogTitle>
              <DialogDescription>
                {editingConfig
                  ? 'Mettre à jour la valeur et la description de la configuration.'
                  : 'Ajouter une nouvelle paire clé-valeur de configuration.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="key">Clé *</Label>
                <Input
                  id="key"
                  placeholder="api_base_url"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  disabled={!!editingConfig}
                  required
                />
                {!editingConfig && (
                  <p className="text-xs text-muted-foreground">
                    Utiliser des minuscules avec des underscores
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="value">Valeur *</Label>
                <Input
                  id="value"
                  placeholder="https://api.example.com"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Une brève description de ce paramètre..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingConfig ? 'Mettre à Jour' : 'Ajouter'} le Paramètre
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

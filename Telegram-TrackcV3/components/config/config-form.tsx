'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, Bot, Radio } from 'lucide-react'

export function ConfigForm() {
  const [botToken, setBotToken] = useState('')
  const [publicChannel, setPublicChannel] = useState('')
  const [privateChannel, setPrivateChannel] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      try {
        await fetchConfig()
      } catch (err) {
        console.error('Error initializing config:', err)
        setError('Erreur lors de l\'initialisation')
        setLoading(false)
      }
    }
    
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchConfig() {
    try {
      console.log('[v0] Fetching bot config...')
      const { data, error } = await supabase
        .from('bot_config')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        console.log('[v0] Fetch error:', error)
        // If no config exists, it's fine - just use empty values
        if (error.code === 'PGRST116') {
          console.log('[v0] No config found, using defaults')
        } else {
          throw error
        }
      }

      if (data) {
        console.log('[v0] Config loaded:', { bot_token: !!data.bot_token, public: !!data.public_channel_id, private: !!data.private_channel_id })
        setBotToken(data.bot_token || '')
        setPublicChannel(data.public_channel_id || '')
        setPrivateChannel(data.private_channel_id || '')
      }
    } catch (err: any) {
      console.error('[v0] Error fetching config:', err)
      setError('Erreur lors du chargement de la configuration')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      console.log('[v0] Saving config...')
      
      // First, try to get the existing config
      const { data: existing } = await supabase
        .from('bot_config')
        .select('id')
        .limit(1)
        .single()

      if (existing) {
        // Update existing config
        const { error } = await supabase
          .from('bot_config')
          .update({
            bot_token: botToken,
            public_channel_id: publicChannel,
            private_channel_id: privateChannel,
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Insert new config if none exists
        const { error } = await supabase
          .from('bot_config')
          .insert({
            bot_token: botToken,
            public_channel_id: publicChannel,
            private_channel_id: privateChannel,
          })

        if (error) throw error
      }

      console.log('[v0] Config saved successfully')
      setSuccess('Configuration enregistrée avec succès!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('[v0] Error saving config:', err)
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-success bg-success/10">
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-success" />
            <CardTitle>Bot Telegram</CardTitle>
          </div>
          <CardDescription>
            Token d'authentification de votre bot Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botToken">Token du Bot</Label>
            <Input
              id="botToken"
              type="password"
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Obtenez votre token auprès de @BotFather sur Telegram
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-success" />
            <CardTitle>Canaux Telegram</CardTitle>
          </div>
          <CardDescription>
            Configurez les canaux public et privé pour les liens de promoteurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publicChannel">Canal Public (ID)</Label>
            <Input
              id="publicChannel"
              type="text"
              placeholder="-1001234567890"
              value={publicChannel}
              onChange={(e) => setPublicChannel(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Le canal public accessible à tous
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="privateChannel">Canal Privé (ID)</Label>
            <Input
              id="privateChannel"
              type="text"
              placeholder="-1009876543210"
              value={privateChannel}
              onChange={(e) => setPrivateChannel(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Le canal privé avec accès restreint
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={saving}
          className="bg-success text-success-foreground hover:bg-success/90"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

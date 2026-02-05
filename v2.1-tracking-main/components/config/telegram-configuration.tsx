'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, Check, RefreshCw, Webhook } from 'lucide-react'

interface TelegramConfig {
  bot_token?: string
  public_channel_id?: string
  private_channel_id?: string
}

export function TelegramConfiguration() {
  const [config, setConfig] = useState<TelegramConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [settingWebhook, setSettingWebhook] = useState(false)
  const [webhookResult, setWebhookResult] = useState<string | null>(null)

  async function fetchConfig() {
    try {
      const { data } = await supabase
        .from('configuration')
        .select('bot_token, public_channel_id, private_channel_id')
        .single()

      if (data) {
        setConfig({
          bot_token: data.bot_token || '',
          public_channel_id: data.public_channel_id || '',
          private_channel_id: data.private_channel_id || '',
        })
      }
    } catch (error) {
      console.error('[v0] Error fetching Telegram config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    try {
      // Get the first (and only) configuration row
      const { data: existingConfig } = await supabase
        .from('configuration')
        .select('id')
        .single()

      if (existingConfig) {
        // Update existing configuration
        await supabase
          .from('configuration')
          .update({
            bot_token: config.bot_token || null,
            public_channel_id: config.public_channel_id || null,
            private_channel_id: config.private_channel_id || null,
          })
          .eq('id', existingConfig.id)
      } else {
        // Insert new configuration
        await supabase
          .from('configuration')
          .insert({
            bot_token: config.bot_token || null,
            public_channel_id: config.public_channel_id || null,
            private_channel_id: config.private_channel_id || null,
          })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('[v0] Error saving Telegram config:', error)
      alert('Erreur lors de la sauvegarde de la configuration. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/telegram/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        const totalMembers = data.results.reduce((sum: number, r: any) => sum + r.members, 0)
        setSyncResult(`✓ ${totalMembers} membres synchronisés`)
        setTimeout(() => setSyncResult(null), 5000)
      } else {
        setSyncResult(`✗ ${data.error}`)
        setTimeout(() => setSyncResult(null), 5000)
      }
    } catch (error) {
      console.error('[v0] Error syncing Telegram stats:', error)
      setSyncResult('✗ Erreur lors de la synchronisation')
      setTimeout(() => setSyncResult(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  async function handleSetupWebhook() {
    setSettingWebhook(true)
    setWebhookResult(null)

    try {
      const response = await fetch('/api/telegram/setup-webhook', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setWebhookResult(`✓ Webhook configuré`)
        setTimeout(() => setWebhookResult(null), 5000)
      } else {
        setWebhookResult(`✗ ${data.error}`)
        setTimeout(() => setWebhookResult(null), 5000)
      }
    } catch (error) {
      console.error('[v0] Error setting up webhook:', error)
      setWebhookResult('✗ Erreur lors de la configuration')
      setTimeout(() => setWebhookResult(null), 5000)
    } finally {
      setSettingWebhook(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration Telegram</CardTitle>
        <CardDescription>
          Configurez votre bot Telegram et les canaux à suivre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bot_token">Clé du Bot Telegram *</Label>
            <Input
              id="bot_token"
              type="password"
              placeholder="8212415918:AAFfBhhXf98ZdKXag9C01-GOCUYP-NaFgpg"
              value={config.bot_token || ''}
              onChange={(e) => setConfig({ ...config, bot_token: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Obtenez la clé de votre bot depuis @BotFather sur Telegram
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="public_channel_id">Canal Public ID</Label>
              <Input
                id="public_channel_id"
                placeholder="@mon_canal_public ou -1001234567890"
                value={config.public_channel_id || ''}
                onChange={(e) => setConfig({ ...config, public_channel_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Username du canal (@username) ou ID numérique
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="private_channel_id">Canal Privé ID</Label>
              <Input
                id="private_channel_id"
                placeholder="-1001234567890"
                value={config.private_channel_id || ''}
                onChange={(e) => setConfig({ ...config, private_channel_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                ID numérique du canal privé
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={saving || saved}>
                {saved ? (
                  <>
                    <Check className="mr-2 size-4" />
                    Sauvegardé
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSetupWebhook} 
                disabled={settingWebhook || !config.bot_token}
              >
                <Webhook className={`mr-2 size-4 ${settingWebhook ? 'animate-pulse' : ''}`} />
                {settingWebhook ? 'Configuration...' : 'Configurer Webhook'}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSync} 
                disabled={syncing || !config.bot_token}
              >
                <RefreshCw className={`mr-2 size-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sync...' : 'Sync Stats'}
              </Button>
            </div>

            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400">
                ✓ Configuration enregistrée avec succès
              </span>
            )}
            
            {webhookResult && (
              <span className={`text-sm ${webhookResult.startsWith('✓') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {webhookResult}
              </span>
            )}

            {syncResult && (
              <span className={`text-sm ${syncResult.startsWith('✓') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {syncResult}
              </span>
            )}
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>1. Sauvegardez la configuration</p>
              <p>2. Cliquez sur "Configurer Webhook" pour activer le tracking automatique</p>
              <p>3. Utilisez "Sync Stats" pour synchroniser les statistiques manuellement</p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

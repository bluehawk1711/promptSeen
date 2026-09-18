'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Smartphone,
  Save,
  Loader2,
  Plus,
  Trash2,
  Globe,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/lib/use-toast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/motion-components'
import { DEFAULT_APP_SETTINGS, APP_NAME } from '@repo/shared/types'
import type { AppSettings, SocialLink } from '@repo/shared/types'
import { compareVersions } from '@repo/shared/app-update'

const SOCIAL_PLATFORMS = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'website', label: 'Website' },
] as const

interface NewSocialLink {
  platform: string
  label: string
  subtitle: string
  url: string
}

export default function AppSettingsPage() {
  const toast = useToast()
  const [settings, setSettings] = useState<AppSettings>({
    ...DEFAULT_APP_SETTINGS,
    updatedAt: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSocial, setNewSocial] = useState<NewSocialLink>({
    platform: 'telegram',
    label: '',
    subtitle: '',
    url: '',
  })

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/app-settings')
      const data = (await res.json()) as { settings?: AppSettings }
      if (data.settings) setSettings(data.settings)
    } catch {
      toast.error('Failed to load app settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    if (compareVersions(settings.minVersion, settings.latestVersion) > 0) {
      toast.error('Minimum version cannot be higher than latest version')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/app-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('App settings saved')
    } catch {
      toast.error('Failed to save app settings')
    } finally {
      setSaving(false)
    }
  }

  const addSocial = () => {
    if (!newSocial.url.trim()) {
      toast.error('Enter a URL for the social link')
      return
    }
    const platformLabel =
      SOCIAL_PLATFORMS.find((p) => p.value === newSocial.platform)?.label ?? 'Link'
    const link: SocialLink = {
      id: `social-${Date.now()}`,
      platform: newSocial.platform,
      label: newSocial.label.trim() || platformLabel,
      subtitle: newSocial.subtitle.trim(),
      url: newSocial.url.trim(),
      order: settings.socialLinks.length,
      isActive: true,
    }
    setSettings((s) => ({ ...s, socialLinks: [...s.socialLinks, link] }))
    setNewSocial({ platform: 'telegram', label: '', subtitle: '', url: '' })
    toast.success('Social link added — remember to save')
  }

  const removeSocial = (id: string) => {
    setSettings((s) => ({
      ...s,
      socialLinks: s.socialLinks.filter((l) => l.id !== id),
    }))
  }

  const toggleSocial = (id: string) => {
    setSettings((s) => ({
      ...s,
      socialLinks: s.socialLinks.map((l) =>
        l.id === id ? { ...l, isActive: !l.isActive } : l,
      ),
    }))
  }

  if (loading) {
    return (
      <PageTransition className="flex flex-col gap-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </PageTransition>
    )
  }

  return (
    <PageTransition className="flex flex-col gap-6">
      <FadeIn>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-medium md:text-2xl">App Settings</h1>
            <p className="text-sm text-muted-foreground">
              Remote config for {APP_NAME} — versions, force update, and social links
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadSettings()}>
              <RefreshCw className="size-4" />
              Reload
            </Button>
            <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </FadeIn>

      <StaggerContainer className="grid gap-4 xl:grid-cols-2">
        {/* Version & Force Update */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Smartphone size={18} />
                </div>
                <div>
                  <CardTitle className="text-base">Version & Force Update</CardTitle>
                  <CardDescription>
                    Control update prompts shown to app users
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="latestVersion">Latest version</Label>
                  <Input
                    id="latestVersion"
                    placeholder="1.0.19"
                    value={settings.latestVersion}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, latestVersion: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="minVersion">Minimum version</Label>
                  <Input
                    id="minVersion"
                    placeholder="1.0.0"
                    value={settings.minVersion}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, minVersion: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Update mode</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'soft', 'hard'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, updateMode: mode }))}
                      className={`rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                        settings.updateMode === mode
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.updateMode === 'none' &&
                    'No update prompts are shown.'}
                  {settings.updateMode === 'soft' &&
                    'Users below the latest version see a dismissible update banner.'}
                  {settings.updateMode === 'hard' &&
                    'Users below the minimum version are blocked until they update.'}
                </p>
              </div>

              {compareVersions(settings.minVersion, settings.latestVersion) > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertTriangle size={14} />
                  Minimum version is higher than latest version
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="playStoreUrl">Play Store URL</Label>
                <Input
                  id="playStoreUrl"
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  value={settings.playStoreUrl}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, playStoreUrl: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="appStoreUrl">App Store URL (optional)</Label>
                <Input
                  id="appStoreUrl"
                  placeholder="https://apps.apple.com/app/id..."
                  value={settings.appStoreUrl}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, appStoreUrl: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* About & Support */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Globe size={18} />
                </div>
                <div>
                  <CardTitle className="text-base">About & Support</CardTitle>
                  <CardDescription>
                    Shown in the app&apos;s profile screen
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="aboutText">About text</Label>
                <textarea
                  id="aboutText"
                  className="min-h-24 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  value={settings.aboutText}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, aboutText: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="supportEmail">Support email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  placeholder="support@example.com"
                  value={settings.supportEmail}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, supportEmail: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Social Links */}
        <StaggerItem className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                    <Globe size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-base">Social Links</CardTitle>
                    <CardDescription>
                      Connect With Us section in the app profile
                    </CardDescription>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {settings.socialLinks.length} link
                  {settings.socialLinks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Existing links */}
              {settings.socialLinks.length > 0 && (
                <div className="flex flex-col gap-2">
                  {settings.socialLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 rounded-xl border p-3"
                    >
                      <Switch
                        checked={link.isActive}
                        onCheckedChange={() => toggleSocial(link.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{link.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {link.url}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeSocial(link.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new */}
              <div className="rounded-xl border border-dashed p-4">
                <p className="mb-3 text-sm font-medium">Add a social link</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Platform</Label>
                    <select
                      className="h-9 w-full rounded-lg border bg-transparent px-3 text-sm"
                      value={newSocial.platform}
                      onChange={(e) =>
                        setNewSocial((n) => ({ ...n, platform: e.target.value }))
                      }
                    >
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Label (optional)</Label>
                    <Input
                      placeholder="Telegram"
                      value={newSocial.label}
                      onChange={(e) =>
                        setNewSocial((n) => ({ ...n, label: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Subtitle (optional)</Label>
                    <Input
                      placeholder="Join our Telegram channel"
                      value={newSocial.subtitle}
                      onChange={(e) =>
                        setNewSocial((n) => ({ ...n, subtitle: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>URL</Label>
                    <Input
                      placeholder="https://t.me/yourchannel"
                      value={newSocial.url}
                      onChange={(e) =>
                        setNewSocial((n) => ({ ...n, url: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={addSocial}
                >
                  <Plus className="size-4" />
                  Add Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  )
}

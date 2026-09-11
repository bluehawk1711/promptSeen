'use client'

import { useState } from 'react'
import { PSLogo } from '@/components/bionis/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo + Heading */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl" />
            <PSLogo className="relative size-14" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to the PromptSeen admin panel</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-lg shadow-black/[0.03]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email address</Label>
              <Input
                id="email" type="email" placeholder="admin@promptseen.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoFocus autoComplete="email"
                className="h-11 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password"
                className="h-11 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full text-sm font-semibold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-8">
          PromptSeen Admin Panel — Access restricted to authorized administrators
        </p>
      </div>
    </div>
  )
}

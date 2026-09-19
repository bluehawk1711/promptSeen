'use client'

import { useState } from 'react'
import { PSLogo } from '@/components/bionis/logo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GradientButton } from '@/components/ui/gradient-button'
import { GradientCard } from '@/components/ui/gradient-card'
import { GradientHeader } from '@/components/ui/gradient-header'
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] px-4">
      <div className="w-full max-w-[400px]">
        <GradientHeader variant="subtle" className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl" />
            <PSLogo className="relative size-14" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to the Prompt View admin panel</p>
          </div>
        </GradientHeader>

        <GradientCard variant="glow" padding="lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email address</Label>
              <Input
                id="email" type="email" placeholder="admin@tsprompt.com"
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

            <GradientButton type="submit" direction="horizontal" size="lg" loading={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </GradientButton>
          </form>
        </GradientCard>

        <p className="text-center text-xs text-muted-foreground/60 mt-8">
          Prompt View Admin Panel — Access restricted to authorized administrators
        </p>
      </div>
    </div>
  )
}

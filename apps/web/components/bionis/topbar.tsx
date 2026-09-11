'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, X, Sun, Moon, LayoutDashboard, FileText, Tags, MessageSquare, BarChart3, Users, Settings } from 'lucide-react'
import { useDashboardNavigation } from './navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Prompts', href: '/admin/prompts', icon: FileText },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Submissions', href: '/admin/submissions', icon: MessageSquare },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

const navItemMap: Record<string, typeof navItems[0]> = Object.fromEntries(navItems.map(i => [i.href, i]))

function useCurrentNavItem() {
  const { pathname } = useDashboardNavigation()
  return navItemMap[pathname] ??
    navItems.find(i => i.href !== '/admin' && pathname.startsWith(i.href)) ??
    navItems[0]
}

export function AdminTopbar() {
  const router = useRouter()
  const currentNavItem = useCurrentNavItem()
  const PageIcon = currentNavItem.icon
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems
    const q = searchQuery.toLowerCase()
    return navItems.filter(i => i.name.toLowerCase().includes(q))
  }, [searchQuery])

  useEffect(() => {
    setSelectedIdx(0)
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
        if (!searchOpen) {
          requestAnimationFrame(() => searchInputRef.current?.focus())
        }
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('')
      setSelectedIdx(0)
    }
  }, [searchOpen])

  const handleSearchSelect = (href: string) => {
    router.push(href)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filteredItems[selectedIdx]) {
      handleSearchSelect(filteredItems[selectedIdx].href)
    }
  }

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-5 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="size-9 shrink-0" />
          <div className="flex items-center gap-2.5">
            <PageIcon className="hidden size-[18px] shrink-0 text-muted-foreground md:block" />
            <p className="text-[15px] font-semibold tracking-tight">{currentNavItem.name}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Search Button */}
          <button
            onClick={() => { setSearchOpen(true); requestAnimationFrame(() => searchInputRef.current?.focus()) }}
            className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl bg-muted/60 text-sm text-muted-foreground hover:bg-muted transition-colors cursor-text"
          >
            <Search className="size-4" />
            <span>Search...</span>
            <kbd className="ml-2 rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
          </button>

          <Button variant="ghost" size="icon" className="size-9 rounded-xl md:hidden" onClick={() => setSearchOpen(true)}>
            <Search className="size-[18px] text-muted-foreground" />
          </Button>

          {/* Dark Mode */}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Sun className={cn('size-[18px] transition-all duration-300', isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0 absolute')} />
            <Moon className={cn('size-[18px] transition-all duration-300', isDark ? '-rotate-90 scale-0 absolute' : 'rotate-0 scale-100')} />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative size-9 rounded-xl" aria-label="Notifications">
            <Bell className="size-[18px] text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary animate-pulse" />
          </Button>
        </div>
      </header>

      {/* Search Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg mx-4 rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <Input
                ref={searchInputRef}
                className="border-0 bg-transparent h-auto p-0 text-sm focus-visible:ring-0 focus-visible:outline-none placeholder:text-muted-foreground/50"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <kbd className="rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No results found</div>
              ) : (
                filteredItems.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSearchSelect(item.href)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                        idx === selectedIdx ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="font-medium">{item.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground/50">{item.href}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import {
  LayoutDashboard, FileText, Tags, MessageSquare, Users,
  BarChart3, Bell, Settings, LogOut, ChevronLeft, HelpCircle, Smartphone,
} from 'lucide-react'
import { PSLogo } from './logo'
import { useDashboardNavigation, DashboardLink } from './navigation'
import { useAuth } from '@/lib/auth'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }> }
type NavGroup = { label: string; items: NavItem[] }

const navigationGroups: NavGroup[] = [
  { label: 'Overview', items: [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ]},
  { label: 'Content', items: [
    { name: 'Prompts', href: '/admin/prompts', icon: FileText },
    { name: 'Categories', href: '/admin/categories', icon: Tags },
  ]},
  { label: 'Engagement', items: [
    { name: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  ]},
  { label: 'System', items: [
    { name: 'App Settings', href: '/admin/app-settings', icon: Smartphone },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]},
]

function NavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { isMobile, setOpenMobile } = useSidebar()
  const { pathname } = useDashboardNavigation()
  const isActive = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href)

  const linkContent = (
    <>
      <item.icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.name}</span>}
    </>
  )

  const linkClassName = cn(
    'flex h-9 w-full items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer',
    collapsed ? 'justify-center px-0' : 'px-2.5',
    isActive
      ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )

  const link = (
    <DashboardLink
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={linkClassName}
      onClick={() => { if (isMobile) setOpenMobile(false) }}
    >
      {linkContent}
    </DashboardLink>
  )

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger render={link} />
          <TooltipContent side="right" sideOffset={8}>{item.name}</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    )
  }

  return <SidebarMenuItem>{link}</SidebarMenuItem>
}

function ProfileItem({ collapsed }: { collapsed: boolean }) {
  const { profile, logout } = useAuth()

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  'flex h-9 w-full items-center gap-2.5 rounded-lg text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground cursor-pointer',
                  collapsed ? 'justify-center px-0' : 'px-2.5',
                )}
              />
            }
          >
            <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
              {profile?.email?.charAt(0).toUpperCase() ?? '?'}
            </div>
            {!collapsed && <span className="truncate">{profile?.displayName || 'Account'}</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <div className="px-3 py-2.5">
            <p className="text-sm font-semibold">{profile?.displayName || 'Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer gap-2.5">
            <LogOut className="size-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function HelpItem({ collapsed }: { collapsed: boolean }) {
  return (
    <SidebarMenuItem>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <DashboardLink
                href="/admin/help"
                className="flex h-9 w-full items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground cursor-pointer"
              />
            }
          />
          <TooltipContent side="right" sideOffset={8}>Help</TooltipContent>
        </Tooltip>
      ) : (
        <DashboardLink
          href="/admin/help"
          className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <HelpCircle className="size-4 shrink-0" />
          <span className="truncate">Help</span>
        </DashboardLink>
      )}
    </SidebarMenuItem>
  )
}

export function AdminSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  return (        <TooltipProvider delay={0}>
      <Sidebar collapsible="icon" className="h-full border-none">
        <SidebarHeader className={cn(
          'flex-row items-center border-b transition-all duration-300',
          collapsed ? 'h-14 justify-center px-2' : 'h-14 justify-between gap-3 px-4',
        )}>
          {!collapsed ? (
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <PSLogo className="size-8 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-bold tracking-tight">Prompt View</span>
                <span className="text-[10px] text-muted-foreground font-medium">Admin Panel</span>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <DashboardLink href="/admin" className="flex items-center justify-center">
                    <PSLogo className="size-7 shrink-0 cursor-pointer" />
                  </DashboardLink>
                }
              />
              <TooltipContent side="right" sideOffset={8}>Prompt View Admin</TooltipContent>
            </Tooltip>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          )}
          {collapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="absolute -right-3 top-4 z-50 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-all duration-200 hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="Expand sidebar"
            >
              <ChevronLeft className="size-3 rotate-180" />
            </button>
          )}
        </SidebarHeader>

        <SidebarContent className="gap-2 overflow-x-hidden overflow-y-auto px-2 py-3">
          {navigationGroups.map((group) => (
            <SidebarGroup key={group.label} className="gap-0.5 p-0">
              <SidebarGroupLabel className={cn(
                'px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase',
                collapsed && 'sr-only',
              )}>
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-px">
                  {group.items.map((item) => <NavItem key={item.name} item={item} collapsed={collapsed} />)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="gap-px border-t px-2 py-2">
          <SidebarMenu className="gap-px">
            <HelpItem collapsed={collapsed} />
            <ProfileItem collapsed={collapsed} />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}

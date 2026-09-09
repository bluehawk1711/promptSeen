"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Tags,
  Users,
  Settings,
  LogOut,
  Loader2,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/prompts", label: "Prompts", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/submissions", label: "Submissions", icon: MessageSquare },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminSidebar() {
  const pathname = usePathname();
  const { profile, logout, loading } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[oklch(0.25_0.03_35)] bg-[oklch(0.14_0.03_30)]">
      <div className="flex h-16 items-center gap-2 border-b border-[oklch(0.25_0.03_35)] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[oklch(0.75_0.19_45)] text-white font-bold text-sm">
          PS
        </div>
        <span className="font-semibold text-[oklch(0.96_0.01_60)]">PromptSeen</span>
        <Badge variant="secondary" className="ml-auto text-xs bg-[oklch(0.20_0.03_35)] text-[oklch(0.65_0.05_45)]">
          Admin
        </Badge>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-[oklch(0.75_0.19_45)]/10 text-[oklch(0.75_0.19_45)] font-medium"
                  : "text-[oklch(0.65_0.05_45)] hover:bg-[oklch(0.20_0.03_35)] hover:text-[oklch(0.96_0.01_60)]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-[oklch(0.25_0.03_35)] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-[oklch(0.20_0.03_35)] flex items-center justify-center text-xs font-medium text-[oklch(0.75_0.19_45)]">
            {profile?.email?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-[oklch(0.96_0.01_60)]">{profile?.displayName ?? "Admin"}</p>
            <p className="text-xs text-[oklch(0.55_0.04_40)] truncate">{profile?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[oklch(0.65_0.05_45)] hover:text-[oklch(0.96_0.01_60)]"
          onClick={logout}
        >
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[oklch(0.12_0.03_30)]">
        <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.75_0.19_45)]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pl-64 bg-[oklch(0.12_0.03_30)] min-h-screen">
      <AdminSidebar />
      <main className="p-8">{children}</main>
    </div>
  );
}

/**
 * Admin layout — sidebar nav with auth protection.
 * Uses the dark orange theme by default.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[oklch(0.12_0.03_30)] text-[oklch(0.96_0.01_60)]">
        <AuthProvider>
          <AdminContent>{children}</AdminContent>
        </AuthProvider>
      </body>
    </html>
  );
}

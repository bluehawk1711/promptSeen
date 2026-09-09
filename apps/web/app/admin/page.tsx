"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Tags,
  Users,
  Heart,
  Share2,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Prompt, Category, UserProfile } from "@repo/shared/types";

interface Stats {
  totalPrompts: number;
  activePrompts: number;
  premiumPrompts: number;
  totalCategories: number;
  totalUsers: number;
  totalLikes: number;
  totalShares: number;
  totalCopies: number;
}

/**
 * Admin dashboard — overview stats and quick actions.
 */
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [promptsSnap, categoriesSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "prompts")),
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "users")),
        ]);

        const prompts = promptsSnap.docs.map((d) => d.data()) as Prompt[];

        setStats({
          totalPrompts: prompts.length,
          activePrompts: prompts.filter((p) => p.isActive).length,
          premiumPrompts: prompts.filter((p) => p.isPremium).length,
          totalCategories: categoriesSnap.size,
          totalUsers: usersSnap.size,
          totalLikes: prompts.reduce((sum, p) => sum + (p.likesCount || 0), 0),
          totalShares: prompts.reduce((sum, p) => sum + ((p as any).shareCount || 0), 0),
          totalCopies: prompts.reduce((sum, p) => sum + (p.copiesCount || 0), 0),
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Prompts",
      value: stats?.totalPrompts ?? 0,
      icon: FileText,
      description: `${stats?.activePrompts ?? 0} active`,
    },
    {
      title: "Categories",
      value: stats?.totalCategories ?? 0,
      icon: Tags,
      description: "Prompt categories",
    },
    {
      title: "Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Total Likes",
      value: stats?.totalLikes ?? 0,
      icon: Heart,
      description: `${stats?.premiumPrompts ?? 0} premium prompts`,
    },
    {
      title: "Total Shares",
      value: stats?.totalShares ?? 0,
      icon: Share2,
      description: "Prompts shared",
    },
    {
      title: "Total Copies",
      value: stats?.totalCopies ?? 0,
      icon: TrendingUp,
      description: "Prompts copied",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your PromptSeen admin panel
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon size={18} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <a
              href="/admin/prompts"
              className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
            >
              <FileText size={16} />
              Manage Prompts
            </a>
            <a
              href="/admin/categories"
              className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
            >
              <Tags size={16} />
              Manage Categories
            </a>
            <a
              href="/admin/settings"
              className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
            >
              <TrendingUp size={16} />
              Backup & Restore
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Premium Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.premiumPrompts ?? 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              prompts require reward ad to unlock
            </p>
            <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${
                    stats?.totalPrompts
                      ? ((stats.premiumPrompts / stats.totalPrompts) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.totalPrompts
                ? `${Math.round((stats.premiumPrompts / stats.totalPrompts) * 100)}%`
                : "0%"}{" "}
              of prompts are premium
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import {
  TrendingUp,
  Eye,
  Heart,
  Copy,
  Share2,
  Users,
  Loader2,
  Calendar,
  Download,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { DailyStats, Prompt } from "@repo/shared/types";

/**
 * Admin Analytics dashboard — engagement metrics and daily stats.
 */
export default function AnalyticsPage() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topPrompts, setTopPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<7 | 30>(7);

  const fetchData = useCallback(async () => {
    try {
      // Fetch daily stats (last 30 days max)
      const statsSnap = await getDocs(
        query(
          collection(db, "daily_stats"),
          orderBy("date", "desc"),
          limit(30)
        )
      );

      const stats = statsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as DailyStats)
      );
      setDailyStats(stats);

      // Fetch top prompts by likes
      const promptsSnap = await getDocs(
        query(
          collection(db, "prompts"),
          where("isActive", "==", true),
          orderBy("likesCount", "desc"),
          limit(10)
        )
      );

      setTopPrompts(
        promptsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Prompt))
      );
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const recentStats = dailyStats.slice(0, dateRange);

  // Aggregate totals
  const totals = recentStats.reduce(
    (acc, s) => ({
      activeUsers: acc.activeUsers + (s.activeUsers || 0),
      promptViews: acc.promptViews + (s.promptViews || 0),
      likes: acc.likes + (s.likes || 0),
      copies: acc.copies + (s.copies || 0),
      shares: acc.shares + (s.shares || 0),
      adImpressions: acc.adImpressions + (s.adImpressions || 0),
      rewardCompletes: acc.rewardCompletes + (s.rewardCompletes || 0),
    }),
    {
      activeUsers: 0,
      promptViews: 0,
      likes: 0,
      copies: 0,
      shares: 0,
      adImpressions: 0,
      rewardCompletes: 0,
    }
  );

  const metricCards = [
    {
      title: "Active Users",
      value: totals.activeUsers,
      icon: Users,
      description: `Avg ${Math.round(totals.activeUsers / Math.max(recentStats.length, 1))}/day`,
    },
    {
      title: "Prompt Views",
      value: totals.promptViews,
      icon: Eye,
      description: `${Math.round(totals.promptViews / Math.max(recentStats.length, 1))}/day`,
    },
    {
      title: "Likes",
      value: totals.likes,
      icon: Heart,
      description: `${Math.round(totals.likes / Math.max(recentStats.length, 1))}/day`,
    },
    {
      title: "Copies",
      value: totals.copies,
      icon: Copy,
      description: `${Math.round(totals.copies / Math.max(recentStats.length, 1))}/day`,
    },
    {
      title: "Shares",
      value: totals.shares,
      icon: Share2,
      description: `${Math.round(totals.shares / Math.max(recentStats.length, 1))}/day`,
    },
    {
      title: "Ad Impressions",
      value: totals.adImpressions,
      icon: TrendingUp,
      description: `${totals.rewardCompletes} reward completions`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Engagement metrics for the last {dateRange} days
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(7)}
          >
            7 Days
          </Button>
          <Button
            variant={dateRange === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(30)}
          >
            30 Days
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {metricCards.map((stat) => {
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
                <div className="text-3xl font-bold">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={18} />
              Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No daily stats available yet. Stats are collected as users interact with the app.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentStats.map((stat) => (
                  <div
                    key={stat.date}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm font-mono">{stat.date}</span>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>👥 {stat.activeUsers || 0}</span>
                      <span>👁 {stat.promptViews || 0}</span>
                      <span>❤️ {stat.likes || 0}</span>
                      <span>📋 {stat.copies || 0}</span>
                      <span>📤 {stat.shares || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} />
              Top Prompts by Likes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPrompts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No prompts found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead className="text-center">Likes</TableHead>
                    <TableHead className="text-center">Copies</TableHead>
                    <TableHead className="text-center">Shares</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPrompts.map((prompt, i) => (
                    <TableRow key={prompt.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[250px]">
                          {prompt.text}
                        </p>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {prompt.likesCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {prompt.copiesCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {(prompt.shareCount ?? 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

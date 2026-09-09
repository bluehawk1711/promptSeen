"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Send,
  Bell,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Sparkles,
  Eye,
  MousePointerClick,
  TrendingUp,
  Smartphone,
  Monitor,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  PushNotification,
  NotificationAnalytics,
} from "@repo/shared/types";

/**
 * Admin Notifications page — compose, send, and analyze push notifications.
 *
 * Features:
 * - Notification composer with target selection
 * - Real-time analytics (delivery rate, open rate)
 * - Daily breakdown chart (CSS-based bar chart)
 * - Source breakdown (manual vs auto)
 * - Platform breakdown (iOS vs Android)
 * - Notification history with open counts
 */
export default function NotificationsPage() {
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dateRange, setDateRange] = useState("30");

  // Composer state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [target, setTarget] = useState<"all" | "topic" | "token">("all");
  const [topic, setTopic] = useState("");
  const [token, setToken] = useState("");
  const [autoNotifEnabled, setAutoNotifEnabled] = useState(true);

  // Status
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/notifications/analytics?days=${dateRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;

    setSending(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
          target,
          topic: target === "topic" ? topic.trim() : undefined,
          token: target === "token" ? token.trim() : undefined,
          sentBy: "admin",
          source: "manual",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send");
      }

      setStatus({
        type: "success",
        message: `Notification sent to ${result.notification.sentCount} devices (${result.notification.deliveredCount} delivered)`,
      });

      // Clear form
      setTitle("");
      setBody("");
      setImageUrl("");

      // Refresh analytics
      fetchAnalytics();
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error.message || "Failed to send notification",
      });
    } finally {
      setSending(false);
    }
  };

  // Chart data — last 14 days for the bar chart
  const chartData = useMemo(() => {
    if (!analytics?.dailyBreakdown) return [];
    return analytics.dailyBreakdown.slice(-14);
  }, [analytics?.dailyBreakdown]);

  const maxChartValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(
      ...chartData.map((d) => Math.max(d.sent, d.delivered, d.opened)),
      1
    );
  }, [chartData]);

  if (loading && !analytics) {
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
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Send push notifications and track engagement
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <Calendar size={14} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status message */}
      {status.type && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-lg p-4 text-sm ${
            status.type === "success"
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {status.message}
        </div>
      )}

      {/* ── Analytics Overview Cards ───────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sent
            </CardTitle>
            <Send size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.totalSent ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.notifications.length ?? 0} campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
            <Eye size={16} className="text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.totalDelivered ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {(analytics?.deliveryRate ?? 0) >= 0.9 ? (
                <ArrowUpRight size={12} className="text-green-500" />
              ) : (
                <ArrowDownRight size={12} className="text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  (analytics?.deliveryRate ?? 0) >= 0.9
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {((analytics?.deliveryRate ?? 0) * 100).toFixed(1)}% delivery rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opened / Tapped
            </CardTitle>
            <MousePointerClick size={16} className="text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.totalOpened ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {(analytics?.openRate ?? 0) >= 0.15 ? (
                <ArrowUpRight size={12} className="text-green-500" />
              ) : (
                <ArrowDownRight size={12} className="text-amber-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  (analytics?.openRate ?? 0) >= 0.15
                    ? "text-green-500"
                    : "text-amber-500"
                }`}
              >
                {((analytics?.openRate ?? 0) * 100).toFixed(1)}% open rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Devices
            </CardTitle>
            <Smartphone size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.platformBreakdown.reduce((s, p) => s + p.count, 0) ?? 0}
            </div>
            <div className="flex gap-2 mt-1">
              {analytics?.platformBreakdown.map((p) => (
                <span key={p.platform} className="text-xs text-muted-foreground capitalize">
                  {p.platform}: {p.count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Daily Engagement Chart ──────────────────────────────────── */}
      {chartData.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} />
              Daily Engagement ({dateRange} days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {chartData.map((day) => {
                const sentHeight = (day.sent / maxChartValue) * 100;
                const deliveredHeight = (day.delivered / maxChartValue) * 100;
                const openedHeight = (day.opened / maxChartValue) * 100;

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-0.5"
                  >
                    {/* Bars stacked */}
                    <div className="w-full flex gap-px items-end" style={{ height: "120px" }}>
                      {/* Sent */}
                      <div
                        className="flex-1 rounded-t bg-blue-500/30"
                        style={{ height: `${sentHeight}%` }}
                        title={`Sent: ${day.sent}`}
                      />
                      {/* Delivered */}
                      <div
                        className="flex-1 rounded-t bg-blue-500/60"
                        style={{ height: `${deliveredHeight}%` }}
                        title={`Delivered: ${day.delivered}`}
                      />
                      {/* Opened */}
                      <div
                        className="flex-1 rounded-t bg-orange-500"
                        style={{ height: `${openedHeight}%` }}
                        title={`Opened: ${day.opened}`}
                      />
                    </div>
                    {/* Date label */}
                    <span className="text-[9px] text-muted-foreground mt-1">
                      {new Date(day.date).toLocaleDateString("en", { day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500/30" />
                Sent
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500/60" />
                Delivered
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-500" />
                Opened
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* ── Composer ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone size={18} />
                Compose Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., New prompts just dropped! 🔥"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/100 characters
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Body *</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="e.g., Check out the latest AI prompts for marketing..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {body.length}/500 characters
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Image URL (optional)</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Target Audience</Label>
                <div className="flex gap-2">
                  {(["all", "topic", "token"] as const).map((t) => (
                    <Button
                      key={t}
                      variant={target === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTarget(t)}
                    >
                      {t === "all" && <Users size={14} className="mr-1" />}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {target === "topic" && (
                <div className="flex flex-col gap-2">
                  <Label>Topic Name</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., marketing, new-prompts"
                  />
                </div>
              )}

              {target === "token" && (
                <div className="flex flex-col gap-2">
                  <Label>FCM Token</Label>
                  <Input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ExpoPushToken[...]"
                  />
                </div>
              )}

              <Button
                onClick={handleSend}
                disabled={sending || !title.trim() || !body.trim()}
                className="w-full"
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {sending ? "Sending..." : "Send Notification"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Source & Platform Breakdown ────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Source Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={18} />
                By Source
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {analytics?.sourceBreakdown.map((src) => (
                <div key={src.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={src.source === "manual" ? "default" : "secondary"}>
                      {src.source === "manual" ? "Manual" : "Auto"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {src.count} campaigns
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {src.opened} opens
                  </span>
                </div>
              ))}
              {(!analytics?.sourceBreakdown || analytics.sourceBreakdown.length === 0) && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Auto-Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={18} />
                Auto-Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">New Prompt Alert</p>
                  <p className="text-xs text-muted-foreground">
                    Notify all users when a new prompt is uploaded
                  </p>
                </div>
                <Switch
                  checked={autoNotifEnabled}
                  onCheckedChange={setAutoNotifEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Notification History with Open Counts ───────────────────── */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Notification History</h2>

        {!analytics?.notifications || analytics.notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No notifications sent yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Body</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="text-center">Sent</TableHead>
                    <TableHead className="text-center">Delivered</TableHead>
                    <TableHead className="text-center">Opened</TableHead>
                    <TableHead className="text-center">Open Rate</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.notifications.map((notif) => {
                    const openRate =
                      (notif.deliveredCount ?? 0) > 0
                        ? ((notif.openedCount ?? 0) / notif.deliveredCount) * 100
                        : 0;

                    return (
                      <TableRow key={notif.id}>
                        <TableCell className="font-medium max-w-[120px] truncate">
                          {notif.title}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                          {notif.body}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {notif.target}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {notif.sentCount}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {notif.deliveredCount}
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">
                          {notif.openedCount ?? 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`text-sm font-medium ${
                              openRate >= 15
                                ? "text-green-500"
                                : openRate >= 5
                                ? "text-amber-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {openRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              notif.source === "auto" ? "secondary" : "default"
                            }
                            className="text-xs"
                          >
                            {notif.source === "auto" ? "Auto" : "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

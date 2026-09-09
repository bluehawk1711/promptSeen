/**
 * GET /api/notifications/analytics
 *
 * Returns aggregated notification analytics:
 * - Total sent / delivered / opened
 * - Delivery rate and open rate
 * - Per-notification breakdown
 * - Daily breakdown for charts
 * - Source breakdown (manual vs auto)
 * - Platform breakdown (ios vs android)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  type Firestore,
} from "firebase/firestore";
import type {
  PushNotification,
  NotificationAnalytics,
  NotificationDailyStats,
} from "@repo/shared/types";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") ?? "30", 10);
    const source = url.searchParams.get("source") as
      | "manual"
      | "auto"
      | null;

    // Fetch all notifications
    let notifQuery;
    if (source) {
      notifQuery = query(
        collection(db, "push_notifications"),
        where("source", "==", source),
        orderBy("createdAt", "desc")
      );
    } else {
      notifQuery = query(
        collection(db, "push_notifications"),
        orderBy("createdAt", "desc")
      );
    }

    const notifSnap = await getDocs(notifQuery);
    const notifications = notifSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as PushNotification)
    );

    // Filter by date range
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = notifications.filter(
      (n) => (n.createdAt ?? 0) >= cutoffDate
    );

    // Calculate totals
    const totalSent = filtered.reduce((sum, n) => sum + (n.sentCount ?? 0), 0);
    const totalDelivered = filtered.reduce(
      (sum, n) => sum + (n.deliveredCount ?? 0),
      0
    );
    const totalOpened = filtered.reduce(
      (sum, n) => sum + (n.openedCount ?? 0),
      0
    );

    const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;
    const openRate = totalDelivered > 0 ? totalOpened / totalDelivered : 0;

    // Daily breakdown
    const dailyMap = new Map<
      string,
      { sent: number; delivered: number; opened: number }
    >();

    // Pre-fill all days in range
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split("T")[0];
      dailyMap.set(key, { sent: 0, delivered: 0, opened: 0 });
    }

    for (const notif of filtered) {
      const date = new Date(notif.createdAt).toISOString().split("T")[0];
      const existing = dailyMap.get(date) ?? {
        sent: 0,
        delivered: 0,
        opened: 0,
      };
      existing.sent += notif.sentCount ?? 0;
      existing.delivered += notif.deliveredCount ?? 0;
      existing.opened += notif.openedCount ?? 0;
      dailyMap.set(date, existing);
    }

    const dailyBreakdown: NotificationDailyStats[] = Array.from(
      dailyMap.entries()
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        ...stats,
      }));

    // Source breakdown
    const sourceMap = new Map<string, { count: number; opened: number }>();
    for (const notif of filtered) {
      const src = notif.source ?? "manual";
      const existing = sourceMap.get(src) ?? { count: 0, opened: 0 };
      existing.count += 1;
      existing.opened += notif.openedCount ?? 0;
      sourceMap.set(src, existing);
    }
    const sourceBreakdown = Array.from(sourceMap.entries()).map(
      ([source, stats]) => ({
        source,
        ...stats,
      })
    );

    // Platform breakdown from FCM tokens
    const tokensSnap = await getDocs(collection(db, "fcm_tokens"));
    const platformMap = new Map<string, number>();
    for (const tokenDoc of tokensSnap.docs) {
      const platform = (tokenDoc.data().platform as string) ?? "unknown";
      platformMap.set(platform, (platformMap.get(platform) ?? 0) + 1);
    }
    const platformBreakdown = Array.from(platformMap.entries()).map(
      ([platform, count]) => ({ platform, count })
    );

    const analytics: NotificationAnalytics = {
      totalSent,
      totalDelivered,
      totalOpened,
      deliveryRate,
      openRate,
      notifications: filtered,
      dailyBreakdown,
      sourceBreakdown,
      platformBreakdown,
    };

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error("[api/notifications/analytics]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

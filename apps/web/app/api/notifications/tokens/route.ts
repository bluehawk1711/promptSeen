import { NextRequest, NextResponse } from "next/server";
import type { PushNotification } from "@repo/shared/types";

/**
 * GET /api/notifications/tokens
 *
 * Returns:
 *   activeTokens: number
 *   recentNotifications: PushNotification[]
 */
export async function GET(_request: NextRequest) {
  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const db = getAdminDb();

    // Get active token count
    const tokensSnap = await db
      .collection("fcm_tokens")
      .where("isActive", "==", true)
      .get();
    const activeTokens = tokensSnap.size;

    // Get recent notifications
    const notifSnap = await db
      .collection("push_notifications")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    const recentNotifications = notifSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as PushNotification,
    );

    return NextResponse.json({
      activeTokens,
      recentNotifications,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch notification data";
    console.error("[api/notifications/tokens]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

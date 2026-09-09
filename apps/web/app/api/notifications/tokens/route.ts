import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  type Firestore,
} from "firebase/firestore";
import type { FCMToken, PushNotification } from "@repo/shared/types";

/**
 * GET /api/notifications/tokens
 *
 * Returns:
 *   activeTokens: number
 *   recentNotifications: PushNotification[]
 */
export async function GET(request: NextRequest) {
  try {
    // Get active token count
    const tokensQuery = query(
      collection(db, "fcm_tokens"),
      where("isActive", "==", true)
    );
    const tokensSnap = await getDocs(tokensQuery);
    const activeTokens = tokensSnap.size;

    // Get recent notifications
    const notifQuery = query(
      collection(db, "push_notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const notifSnap = await getDocs(notifQuery);
    const recentNotifications = notifSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as PushNotification)
    );

    return NextResponse.json({
      activeTokens,
      recentNotifications,
    });
  } catch (error: any) {
    console.error("[api/notifications/tokens]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notification data" },
      { status: 500 }
    );
  }
}

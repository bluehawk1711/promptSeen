import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { sendPushNotification, notifyNewPrompt } from "@/lib/notifications";

/**
 * POST /api/notifications/send
 *
 * Send a push notification from the admin panel.
 *
 * Body:
 *   title: string
 *   body: string
 *   imageUrl?: string
 *   data?: Record<string, string>
 *   target: 'all' | 'topic' | 'token'
 *   topic?: string
 *   token?: string
 *   sentBy: string
 *   source: 'manual' | 'auto'
 *   promptId?: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, body: notifBody, target, sentBy } = body;

    // Validate required fields
    if (!title || !notifBody || !target || !sentBy) {
      return NextResponse.json(
        { error: "Missing required fields: title, body, target, sentBy" },
        { status: 400 }
      );
    }

    const result = await sendPushNotification(db, {
      title,
      body: notifBody,
      imageUrl: body.imageUrl,
      data: body.data ?? {},
      target,
      topic: body.topic,
      token: body.token,
      sentBy,
      source: body.source ?? "manual",
      promptId: body.promptId,
    });

    return NextResponse.json({
      success: true,
      notification: result,
    });
  } catch (error: any) {
    console.error("[api/notifications/send]", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}

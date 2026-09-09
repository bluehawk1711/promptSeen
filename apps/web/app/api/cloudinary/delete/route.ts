import { NextRequest, NextResponse } from "next/server";

/**
 * API route to delete an image from Cloudinary.
 *
 * Uses the Cloudinary Admin API with signed requests.
 * Requires CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET env vars.
 */
export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "publicId is required" },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary credentials not configured" },
        { status: 500 }
      );
    }

    // Build signed request for destroy
    const timestamp = Math.round(Date.now() / 1000);
    const params = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
    });

    // Generate signature
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(params.toString() + apiSecret)
      .digest("hex");

    params.append("api_key", apiKey);
    params.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }
    );

    const result = await response.json();

    if (result.result === "ok") {
      return NextResponse.json({ success: true, publicId });
    } else {
      return NextResponse.json(
        { error: result.error?.message || "Delete failed" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

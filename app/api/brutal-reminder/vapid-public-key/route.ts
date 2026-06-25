import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/brutal-reminder/push";

export const runtime = "nodejs";

export async function GET() {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID public key is not configured.", publicKey: null },
      { status: 503 },
    );
  }

  return NextResponse.json({ publicKey });
}

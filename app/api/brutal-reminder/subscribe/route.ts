import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/brutal-reminder/db";
import { hashToken } from "@/lib/brutal-reminder/tokens";
import { revokePushSubscription, savePushSubscription } from "@/lib/brutal-reminder/push";
import type { ReminderRecord } from "@/lib/brutal-reminder/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isValidEndpoint(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidKey(value: string) {
  return typeof value === "string" && value.length > 0 && value.length <= 255;
}

async function findReminderByUnsubscribeToken(token: string) {
  if (!token) {
    return null;
  }
  const tokenHash = hashToken(token);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("unsubscribe_token_hash", tokenHash)
    .maybeSingle<ReminderRecord>();
  if (error || !data) {
    return null;
  }
  return data;
}

export async function POST(request: Request) {
  let body: {
    token?: string;
    subscription?: {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = clean(body.token);
  const endpoint = clean(body.subscription?.endpoint, 2000);
  const p256dh = clean(body.subscription?.keys?.p256dh);
  const auth = clean(body.subscription?.keys?.auth);

  if (!token) {
    return NextResponse.json({ error: "Missing reminder token." }, { status: 400 });
  }

  if (!isValidEndpoint(endpoint)) {
    return NextResponse.json({ error: "Invalid subscription endpoint." }, { status: 400 });
  }

  if (!isValidKey(p256dh) || !isValidKey(auth)) {
    return NextResponse.json({ error: "Invalid subscription keys." }, { status: 400 });
  }

  const reminder = await findReminderByUnsubscribeToken(token);

  if (!reminder) {
    return NextResponse.json({ error: "Reminder not found for this token." }, { status: 404 });
  }

  if (reminder.status !== "active") {
    return NextResponse.json(
      { error: "This reminder is no longer active." },
      { status: 409 },
    );
  }

  const userAgent = request.headers.get("user-agent") || null;

  try {
    const result = await savePushSubscription(
      reminder.id,
      { endpoint, keys: { p256dh, auth } },
      userAgent,
    );

    return NextResponse.json({
      ok: true,
      subscriptionId: result.id,
      reused: result.reused,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription could not be saved.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let body: { token?: string; endpoint?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = clean(body.token);
  const endpoint = clean(body.endpoint, 2000);

  if (!token) {
    return NextResponse.json({ error: "Missing reminder token." }, { status: 400 });
  }

  if (!isValidEndpoint(endpoint)) {
    return NextResponse.json({ error: "Invalid subscription endpoint." }, { status: 400 });
  }

  const reminder = await findReminderByUnsubscribeToken(token);

  if (!reminder) {
    return NextResponse.json({ error: "Reminder not found for this token." }, { status: 404 });
  }

  try {
    await revokePushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription could not be revoked.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

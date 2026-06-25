import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/brutal-reminder/db";
import { hashToken } from "@/lib/brutal-reminder/tokens";
import {
  getWebPushConfigurationStatus,
  sendPushToReminder,
} from "@/lib/brutal-reminder/push";
import type { ReminderRecord } from "@/lib/brutal-reminder/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: { token?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = clean(body.token);

  if (!token) {
    return NextResponse.json({ error: "Missing reminder token." }, { status: 400 });
  }

  const status = getWebPushConfigurationStatus();
  if (!status.configured) {
    return NextResponse.json(
      { error: status.error || "Web Push is not configured on the server." },
      { status: 503 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: reminder, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("unsubscribe_token_hash", hashToken(token))
    .maybeSingle<ReminderRecord>();

  if (error || !reminder) {
    return NextResponse.json({ error: "Reminder not found for this token." }, { status: 404 });
  }

  try {
    const result = await sendPushToReminder(reminder.id, {
      title: "Brutal Reminder is connected.",
      body: `Your next nudge: ${reminder.first_step || reminder.goal}`,
      url: "/brutal-reminder",
      tag: `brutal-reminder-test-${reminder.id}`,
      reminderId: reminder.id,
    });

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Test push could not be sent.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

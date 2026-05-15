import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/brutal-reminder/db";
import { sendReminderEmail } from "@/lib/brutal-reminder/email";
import { createToken, hashToken } from "@/lib/brutal-reminder/tokens";
import { calculateNextDueAt } from "@/lib/brutal-reminder/time";
import type { ReminderRecord } from "@/lib/brutal-reminder/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.BRUTAL_REMINDER_CRON_SECRET || process.env.CRON_SECRET;

  if (!configuredSecret && process.env.NODE_ENV !== "production") {
    return true;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  const auth = request.headers.get("authorization");
  return headerSecret === configuredSecret || auth === `Bearer ${configuredSecret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("status", "active")
    .lte("next_due_at", now.toISOString())
    .order("next_due_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const reminder of (reminders || []) as ReminderRecord[]) {
    const checkinToken = createToken();
    const pauseToken = createToken();
    const unsubscribeToken = createToken();
    const deliveryScheduledFor = reminder.next_due_at || now.toISOString();

    const { data: checkin, error: checkinError } = await supabase
      .from("checkins")
      .insert({
        reminder_id: reminder.id,
        token_hash: hashToken(checkinToken),
        requested_at: now.toISOString(),
      })
      .select("id")
      .single();

    if (checkinError || !checkin) {
      results.push({ reminderId: reminder.id, status: "checkin_failed", error: checkinError?.message });
      continue;
    }

    try {
      await supabase
        .from("reminders")
        .update({
          pause_token_hash: hashToken(pauseToken),
          unsubscribe_token_hash: hashToken(unsubscribeToken),
          updated_at: now.toISOString(),
        })
        .eq("id", reminder.id);

      const sent = await sendReminderEmail(reminder, {
        checkin: checkinToken,
        pause: pauseToken,
        unsubscribe: unsubscribeToken,
      });

      const nextDueAt = calculateNextDueAt(
        reminder.cadence,
        reminder.timezone || "UTC",
        (reminder.preferred_local_time || "09:00").slice(0, 5),
        now,
      );

      await supabase.from("deliveries").insert({
        reminder_id: reminder.id,
        kind: "main",
        scheduled_for: deliveryScheduledFor,
        sent_at: sent.skipped ? null : now.toISOString(),
        resend_message_id: sent.id,
        provider_status: sent.skipped ? "skipped_missing_resend_key" : "sent",
      });

      await supabase
        .from("reminders")
        .update({
          last_sent_at: now.toISOString(),
          next_due_at: nextDueAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", reminder.id);

      results.push({ reminderId: reminder.id, status: sent.skipped ? "scheduled_without_email" : "sent" });
    } catch (sendError) {
      const failureReason = sendError instanceof Error ? sendError.message : "Email send failed.";

      await supabase.from("deliveries").insert({
        reminder_id: reminder.id,
        kind: "main",
        scheduled_for: deliveryScheduledFor,
        provider_status: "failed",
        failure_reason: failureReason,
      });

      results.push({ reminderId: reminder.id, status: "failed", error: failureReason });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}

export async function GET(request: Request) {
  return POST(request);
}

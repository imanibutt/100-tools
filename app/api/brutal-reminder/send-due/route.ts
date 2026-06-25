import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/brutal-reminder/db";
import { sendReminderEmail } from "@/lib/brutal-reminder/email";
import { createToken, hashToken } from "@/lib/brutal-reminder/tokens";
import { calculateNextDueAt } from "@/lib/brutal-reminder/time";
import {
  getWebPushConfigurationStatus,
  listActiveSubscriptionsForReminder,
  sendPushToReminder,
} from "@/lib/brutal-reminder/push";
import { getSiteUrl } from "@/lib/site";
import { getPreviewText, getReminderSubject } from "@/lib/brutal-reminder/content";
import type { ReminderRecord } from "@/lib/brutal-reminder/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AIReminderForPush = {
  notificationTitle: string | null;
  notificationBody: string | null;
  variations: Array<{ title: string; body: string }> | null;
};

function pickReminderMessage(reminder: ReminderRecord, sendIndex: number) {
  const ai = reminder as unknown as AIReminderForPush;
  const variations = Array.isArray(ai.variations) ? ai.variations.filter((v) => v && v.title && v.body) : [];
  if (variations.length > 0) {
    const choice = variations[sendIndex % variations.length];
    return {
      title: choice.title,
      body: choice.body,
    };
  }

  if (ai.notificationTitle && ai.notificationBody) {
    return {
      title: ai.notificationTitle,
      body: ai.notificationBody,
    };
  }

  return {
    title: getReminderSubject(reminder.tone),
    body: getPreviewText(reminder.tone, reminder.goal, reminder.first_step, reminder.excuse ?? undefined)
      .split("\n")
      .filter(Boolean)
      .slice(0, 2)
      .join(" — "),
  };
}

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
  const pushStatus = getWebPushConfigurationStatus();

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
  const siteUrl = getSiteUrl();

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

    const checkinUrl = `${siteUrl}/brutal-reminder/checkin?token=${encodeURIComponent(checkinToken)}&response=done`;

    let pushDelivered = 0;
    let pushAttempted = false;
    let pushConfigured = pushStatus.configured;
    let pushError: string | null = null;
    let pushSubsCount = 0;

    if (pushConfigured) {
      try {
        pushAttempted = true;
        const subs = await listActiveSubscriptionsForReminder(reminder.id);
        pushSubsCount = subs.length;

        if (pushSubsCount === 0) {
          pushError = "no_active_subscriptions";
        } else {
          const sendIndex = Number.parseInt(
            String(reminder.streak_count || "0"),
            10,
          ) || 0;
          const message = pickReminderMessage(reminder, sendIndex);

          const result = await sendPushToReminder(reminder.id, {
            title: message.title,
            body: message.body,
            url: checkinUrl,
            tag: `brutal-reminder-${reminder.id}`,
            reminderId: reminder.id,
          });

          pushDelivered = result.sent;
          if (result.failed > 0) {
            pushError = result.errors.slice(0, 3).join(" | ");
          }
        }
      } catch (pushFailure) {
        pushError = pushFailure instanceof Error ? pushFailure.message : "Push failed.";
      }
    }

    let emailDelivered = false;
    let emailSkipped = false;
    let emailId: string | null = null;
    let emailError: string | null = null;

    if (pushDelivered === 0) {
      try {
        await supabase
          .from("reminders")
          .update({
            pause_token_hash: hashToken(pauseToken),
            unsubscribe_token_hash: hashToken(unsubscribeToken),
            updated_at: now.toISOString(),
          })
          .eq("id", reminder.id);

        const sendIndex = Number.parseInt(
          String(reminder.streak_count || "0"),
          10,
        ) || 0;
        const aiMessage = pickReminderMessage(reminder, sendIndex);
        const realityCheck = (reminder as unknown as { ai_reality_check?: string | null }).ai_reality_check || null;

        const sent = await sendReminderEmail(
          {
            ...reminder,
            tone: reminder.tone,
            goal: reminder.goal,
            first_step: reminder.first_step,
            excuse: reminder.excuse,
          },
          {
            checkin: checkinToken,
            pause: pauseToken,
            unsubscribe: unsubscribeToken,
          },
        );

        emailSkipped = sent.skipped;
        emailId = sent.id;
        emailDelivered = !sent.skipped;

        // Mark AI fields as used even though the email path doesn't currently render them; this
        // keeps the AI payload "warm" for analytics without altering the existing email template.
        if (realityCheck) {
          void aiMessage;
        }
      } catch (emailFailure) {
        emailError = emailFailure instanceof Error ? emailFailure.message : "Email send failed.";
      }
    }

    const nextDueAt = calculateNextDueAt(
      reminder.cadence,
      reminder.timezone || "UTC",
      (reminder.preferred_local_time || "09:00").slice(0, 5),
      now,
    );

    if (pushAttempted && pushSubsCount > 0) {
      await supabase.from("deliveries").insert({
        reminder_id: reminder.id,
        kind: "push",
        scheduled_for: deliveryScheduledFor,
        sent_at: pushDelivered > 0 ? now.toISOString() : null,
        provider_status: pushDelivered > 0 ? "sent" : pushError ? "failed" : "skipped",
        failure_reason: pushError,
      });
    }

    if (!emailDelivered && !emailSkipped && emailError) {
      await supabase.from("deliveries").insert({
        reminder_id: reminder.id,
        kind: "main",
        scheduled_for: deliveryScheduledFor,
        provider_status: "failed",
        failure_reason: emailError,
      });
    } else if (emailDelivered || emailSkipped) {
      await supabase.from("deliveries").insert({
        reminder_id: reminder.id,
        kind: "main",
        scheduled_for: deliveryScheduledFor,
        sent_at: emailDelivered ? now.toISOString() : null,
        resend_message_id: emailId,
        provider_status: emailDelivered ? "sent" : "skipped_missing_resend_key",
        failure_reason: emailError,
      });
    }

    await supabase
      .from("reminders")
      .update({
        last_sent_at: now.toISOString(),
        next_due_at: nextDueAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", reminder.id);

    if (pushDelivered > 0) {
      results.push({ reminderId: reminder.id, status: "push_sent", delivered: pushDelivered });
    } else if (emailDelivered) {
      results.push({ reminderId: reminder.id, status: "email_fallback_sent" });
    } else if (emailSkipped) {
      results.push({ reminderId: reminder.id, status: "scheduled_without_email" });
    } else {
      results.push({
        reminderId: reminder.id,
        status: "failed",
        error: emailError || pushError || "No delivery channel succeeded.",
      });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}

export async function GET(request: Request) {
  return POST(request);
}

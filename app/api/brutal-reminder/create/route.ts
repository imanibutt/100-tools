import { NextResponse } from "next/server";
import { generateFirstStep } from "@/lib/brutal-reminder/content";
import { getSupabaseAdmin } from "@/lib/brutal-reminder/db";
import { sendWelcomeEmail } from "@/lib/brutal-reminder/email";
import { createToken, hashToken } from "@/lib/brutal-reminder/tokens";
import { calculateNextDueAt } from "@/lib/brutal-reminder/time";
import type { CreateReminderInput, ReminderCadence, ReminderTone } from "@/lib/brutal-reminder/types";

export const runtime = "nodejs";

const consentVersion = "brutal-reminder-mvp-2026-05-13";

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isTone(value: string): value is ReminderTone {
  return value === "normal" || value === "brutal";
}

function isCadence(value: string): value is ReminderCadence {
  return value === "daily" || value === "weekdays" || value === "weekly";
}

function isTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isMissingProductUpdatesColumn(message: string) {
  return (
    message.includes("product_updates_opt_in") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

export async function POST(request: Request) {
  let body: CreateReminderInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const goal = clean(body.goal);
  const whyItMatters = clean(body.whyItMatters);
  const excuse = clean(body.excuse, 400);
  const firstStep = clean(body.firstStep, 400) || generateFirstStep(goal);
  const cadence = clean(body.cadence) as ReminderCadence;
  const reminderTime = clean(body.reminderTime);
  const timezone = clean(body.timezone, 80) || "UTC";
  const tone = clean(body.tone) as ReminderTone;
  const email = clean(body.email, 254).toLowerCase();
  const productUpdates = body.productUpdates === true;

  if (!goal) {
    return NextResponse.json({ error: "Add the goal that actually matters." }, { status: 400 });
  }

  if (!isEmail(email)) {
    return NextResponse.json({ error: "Add a valid email address." }, { status: 400 });
  }

  if (!isCadence(cadence) || !isTone(tone) || !isTime(reminderTime)) {
    return NextResponse.json({ error: "Reminder setup is invalid." }, { status: 400 });
  }

  if (!body.reminderConsent) {
    return NextResponse.json({ error: "Reminder email consent is required." }, { status: 400 });
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    return NextResponse.json({ error: "Use a valid timezone, like Asia/Karachi or America/New_York." }, { status: 400 });
  }

  try {
    const pauseToken = createToken();
    const unsubscribeToken = createToken();
    const now = new Date();
    const nextDueAt = calculateNextDueAt(cadence, timezone, reminderTime);
    const supabase = getSupabaseAdmin();

    const reminderInsert = {
      email,
      goal,
      why_it_matters: whyItMatters || null,
      excuse: excuse || null,
      first_step: firstStep,
      tone,
      cadence,
      timezone,
      preferred_local_time: reminderTime,
      status: "active",
      next_due_at: nextDueAt.toISOString(),
      product_updates_opt_in: productUpdates,
      unsubscribe_token_hash: hashToken(unsubscribeToken),
      pause_token_hash: hashToken(pauseToken),
      consented_at: now.toISOString(),
      consent_version: consentVersion,
    };

    let insertResult = await supabase.from("reminders").insert(reminderInsert).select("id").single();

    if (insertResult.error && isMissingProductUpdatesColumn(insertResult.error.message)) {
      const { product_updates_opt_in: _ignored, ...legacyInsert } = reminderInsert;
      insertResult = await supabase.from("reminders").insert(legacyInsert).select("id").single();
    }

    const { data, error } = insertResult;

    if (error || !data) {
      throw new Error(error?.message || "Reminder could not be saved.");
    }

    let welcomeEmailStatus: "sent" | "skipped" | "failed" = "skipped";
    let welcomeEmailId: string | null = null;
    let welcomeEmailError: string | null = null;

    try {
      const sent = await sendWelcomeEmail(
        {
          email,
          goal,
          first_step: firstStep,
        },
        {
          pause: pauseToken,
          unsubscribe: unsubscribeToken,
        },
      );

      welcomeEmailStatus = sent.skipped ? "skipped" : "sent";
      welcomeEmailId = sent.id;
    } catch (emailError) {
      welcomeEmailStatus = "failed";
      welcomeEmailError = emailError instanceof Error ? emailError.message : "Welcome email could not be sent.";
    }

    await supabase.from("deliveries").insert({
      reminder_id: data.id,
      kind: "welcome",
      scheduled_for: now.toISOString(),
      sent_at: welcomeEmailStatus === "sent" ? now.toISOString() : null,
      resend_message_id: welcomeEmailId,
      provider_status:
        welcomeEmailStatus === "sent"
          ? "sent"
          : welcomeEmailStatus === "skipped"
            ? "skipped_missing_resend_key"
            : "failed",
      failure_reason: welcomeEmailError,
    });

    return NextResponse.json({
      ok: true,
      goal,
      firstStep,
      cadence,
      reminderTime,
      nextDueAt: nextDueAt.toISOString(),
      welcomeEmailStatus,
      message:
        welcomeEmailStatus === "sent"
          ? "Reminder active. Welcome email sent."
          : welcomeEmailStatus === "failed"
            ? "Reminder active, but the welcome email could not be sent."
            : "Reminder active. Add RESEND_API_KEY to send emails.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not activate the reminder.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

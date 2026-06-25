import { NextResponse } from "next/server";
import { generateFirstStep } from "@/lib/brutal-reminder/content";
import { getSupabaseAdmin, reportSupabaseFailure } from "@/lib/brutal-reminder/db";
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

function isChannel(value: unknown): value is "push" | "email" | "both" {
  return value === "push" || value === "email" || value === "both";
}

function isMissingProductUpdatesColumn(message: string) {
  return (
    message.includes("product_updates_opt_in") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

function isMissingAIColumn(message: string) {
  if (!message) return false;
  if (!message.includes("does not exist") && !message.includes("schema cache")) return false;
  return (
    message.includes("ai_clean_goal") ||
    message.includes("ai_small_step") ||
    message.includes("ai_notification_title") ||
    message.includes("ai_notification_body") ||
    message.includes("ai_reality_check") ||
    message.includes("ai_variations") ||
    message.includes("ai_done_message") ||
    message.includes("ai_snooze_message") ||
    message.includes("ai_not_yet_message")
  );
}

type AIVariation = { title: string; body: string };

type AIPayloadInput = {
  cleanGoal?: string;
  smallStep?: string;
  notificationTitle?: string;
  notificationBody?: string;
  realityCheck?: string;
  encouragement?: string;
  variations?: AIVariation[];
  doneMessage?: string;
  snoozeMessage?: string;
  notYetMessage?: string;
  source?: "ai" | "fallback";
};

function extractAIPayload(body: unknown): AIPayloadInput | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;
  const payload = data.ai;
  if (!payload || typeof payload !== "object") return null;
  const ai = payload as Record<string, unknown>;
  const title = clean(ai.notificationTitle, 70);
  const bodyText = clean(ai.notificationBody, 200);
  if (!title || !bodyText) return null;
  const variationsRaw = Array.isArray(ai.variations) ? ai.variations : [];
  const variations: AIVariation[] = [];
  for (const item of variationsRaw) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    const t = clean(v.title, 70);
    const b = clean(v.body, 200);
    if (t && b) variations.push({ title: t, body: b });
    if (variations.length >= 7) break;
  }
  return {
    cleanGoal: clean(ai.cleanGoal, 200) || undefined,
    smallStep: clean(ai.smallStep, 400) || undefined,
    notificationTitle: title,
    notificationBody: bodyText,
    realityCheck: clean(ai.realityCheck, 200) || undefined,
    encouragement: clean(ai.encouragement, 200) || undefined,
    variations: variations.length > 0 ? variations : undefined,
    doneMessage: clean(ai.doneMessage, 200) || undefined,
    snoozeMessage: clean(ai.snoozeMessage, 200) || undefined,
    notYetMessage: clean(ai.notYetMessage, 200) || undefined,
    source: ai.source === "ai" || ai.source === "fallback" ? ai.source : undefined,
  };
}

export async function POST(request: Request) {
  let body: CreateReminderInput & {
    notificationChannel?: "push" | "email" | "both";
    ai?: AIPayloadInput;
  };

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
  const notificationChannel = isChannel(body.notificationChannel) ? body.notificationChannel : "push";

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

    const ai = extractAIPayload(body.ai);

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
      ai_clean_goal: ai?.cleanGoal || null,
      ai_small_step: ai?.smallStep || null,
      ai_notification_title: ai?.notificationTitle || null,
      ai_notification_body: ai?.notificationBody || null,
      ai_reality_check: ai?.realityCheck || null,
      ai_variations: ai?.variations && ai.variations.length > 0 ? ai.variations : [],
      ai_done_message: ai?.doneMessage || null,
      ai_snooze_message: ai?.snoozeMessage || null,
      ai_not_yet_message: ai?.notYetMessage || null,
    };

    let insertResult = await supabase.from("reminders").insert(reminderInsert).select("id").single();

    if (insertResult.error && isMissingProductUpdatesColumn(insertResult.error.message)) {
      console.warn("[brutal-reminder/create] retrying without product_updates_opt_in");
      const { product_updates_opt_in: _ignored, ...legacyInsert } = reminderInsert;
      insertResult = await supabase.from("reminders").insert(legacyInsert).select("id").single();
    }

    if (insertResult.error && isMissingAIColumn(insertResult.error.message)) {
      console.warn("[brutal-reminder/create] retrying without AI columns");
      const legacyInsert = { ...reminderInsert };
      delete (legacyInsert as Record<string, unknown>).product_updates_opt_in;
      delete (legacyInsert as Record<string, unknown>).ai_clean_goal;
      delete (legacyInsert as Record<string, unknown>).ai_small_step;
      delete (legacyInsert as Record<string, unknown>).ai_notification_title;
      delete (legacyInsert as Record<string, unknown>).ai_notification_body;
      delete (legacyInsert as Record<string, unknown>).ai_reality_check;
      delete (legacyInsert as Record<string, unknown>).ai_variations;
      delete (legacyInsert as Record<string, unknown>).ai_done_message;
      delete (legacyInsert as Record<string, unknown>).ai_snooze_message;
      delete (legacyInsert as Record<string, unknown>).ai_not_yet_message;
      insertResult = await supabase.from("reminders").insert(legacyInsert).select("id").single();
    }

    if (
      insertResult.error &&
      insertResult.error.message === "TypeError: fetch failed"
    ) {
      await reportSupabaseFailure("insert.reminders", insertResult.error);
      throw new Error(
        "Supabase is unreachable. The reminder was not saved. Please try again shortly.",
      );
    }

    const { data, error } = insertResult;

    if (error || !data) {
      const supabaseError = error as
        | { message?: string; code?: string; details?: string; hint?: string }
        | null;
      console.error("[brutal-reminder/create] Supabase insert failed", {
        name: supabaseError?.code || "SupabaseError",
        message: supabaseError?.message || "Reminder could not be saved.",
        details: supabaseError?.details || null,
        hint: supabaseError?.hint || null,
      });
      throw new Error(supabaseError?.message || "Reminder could not be saved.");
    }

    let welcomeEmailStatus: "sent" | "skipped" | "failed" = "skipped";
    let welcomeEmailId: string | null = null;
    let welcomeEmailError: string | null = null;

    if (notificationChannel === "email" || notificationChannel === "both") {
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
    } else {
      welcomeEmailStatus = "skipped";
      welcomeEmailError = "Welcome email skipped: notification channel is push-only.";
    }

    if (notificationChannel === "email" || notificationChannel === "both") {
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
    }

    return NextResponse.json({
      ok: true,
      goal,
      firstStep,
      cadence,
      reminderTime,
      nextDueAt: nextDueAt.toISOString(),
      welcomeEmailStatus,
      notificationChannel,
      unsubscribeToken,
      pauseToken,
      ai: ai
        ? {
            cleanGoal: ai.cleanGoal || null,
            smallStep: ai.smallStep || null,
            notificationTitle: ai.notificationTitle || null,
            notificationBody: ai.notificationBody || null,
            realityCheck: ai.realityCheck || null,
            encouragement: ai.encouragement || null,
            variations: ai.variations || [],
            doneMessage: ai.doneMessage || null,
            snoozeMessage: ai.snoozeMessage || null,
            notYetMessage: ai.notYetMessage || null,
            source: ai.source || "fallback",
          }
        : null,
      message:
        welcomeEmailStatus === "sent"
          ? "Reminder active. Welcome email sent."
          : welcomeEmailStatus === "failed"
            ? "Reminder active, but the welcome email could not be sent."
            : notificationChannel === "push"
              ? "Reminder saved. Your first nudge is ready."
              : "Reminder active. Add RESEND_API_KEY to send emails.",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Could not activate the reminder.";
    const cause =
      error instanceof Error && "cause" in error
        ? (error as Error & { cause?: unknown }).cause
        : undefined;
    const causeObj = cause && typeof cause === "object" ? (cause as { code?: string; message?: string }) : undefined;

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const projectHost = (() => {
      try {
        return new URL(supabaseUrl).host;
      } catch {
        return null;
      }
    })();

    let isUnreachable = false;
    if (errorMessage === "fetch failed") {
      isUnreachable = true;
    } else if (causeObj?.code === "ENOTFOUND" || causeObj?.code === "ECONNREFUSED") {
      isUnreachable = true;
    } else if (
      typeof errorMessage === "string" &&
      (errorMessage.includes("fetch failed") ||
        errorMessage.includes("[object Object]") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.startsWith("Supabase is unreachable"))
    ) {
      isUnreachable = true;
    }

    console.error("[brutal-reminder/create] request failed", {
      name: error instanceof Error ? error.name : "Error",
      message: errorMessage,
      isUnreachable,
      projectHost,
      causeCode: causeObj?.code || null,
      causeMessage: causeObj?.message || null,
    });

    let message = errorMessage;
    if (isUnreachable) {
      const causeCode = causeObj?.code;
      if (causeCode === "ENOTFOUND" || !causeCode) {
        message = projectHost
          ? `Supabase is unreachable: the host ${projectHost} could not be resolved. Verify SUPABASE_URL in your environment and confirm the Supabase project is active.`
          : "Supabase is unreachable. Verify SUPABASE_URL in your environment and confirm the Supabase project is active.";
      } else if (causeCode === "ECONNREFUSED") {
        message = "Supabase is unreachable: connection refused. Verify SUPABASE_URL and that the Supabase project is active.";
      } else {
        message = "Supabase is unreachable. The reminder was not saved. Please try again shortly.";
      }
    }

    return NextResponse.json({ error: message }, { status: isUnreachable ? 502 : 500 });
  }
}

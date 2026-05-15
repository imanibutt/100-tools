import { getSupabaseAdmin } from "./db";
import { hashToken } from "./tokens";
import { calculateNextDueAt } from "./time";
import type { CheckinResponse, ReminderRecord } from "./types";

export async function recordCheckin(token: string, response: CheckinResponse) {
  const supabase = getSupabaseAdmin();
  const tokenHash = hashToken(token);
  const now = new Date();

  const { data: checkin, error: checkinError } = await supabase
    .from("checkins")
    .select("id, reminder_id, responded_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (checkinError || !checkin) {
    return { ok: false, message: "This check-in link is invalid or expired." };
  }

  if (!checkin.responded_at) {
    await supabase
      .from("checkins")
      .update({
        response,
        responded_at: now.toISOString(),
      })
      .eq("id", checkin.id);

    if (response === "done" || response === "snoozed") {
      const { data: reminder } = await supabase
        .from("reminders")
        .select("*")
        .eq("id", checkin.reminder_id)
        .single<ReminderRecord>();

      if (reminder) {
        const nextDueAt =
          response === "snoozed"
            ? new Date(now.getTime() + 3 * 60 * 60 * 1000)
            : calculateNextDueAt(
                reminder.cadence,
                reminder.timezone || "UTC",
                (reminder.preferred_local_time || "09:00").slice(0, 5),
                now,
              );

        await supabase
          .from("reminders")
          .update({
            streak_count: response === "done" ? (reminder.streak_count || 0) + 1 : reminder.streak_count || 0,
            next_due_at: nextDueAt.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", reminder.id);
      }
    }
  }

  return { ok: true, message: "Check-in recorded." };
}

export async function updateReminderStatusByToken(token: string, status: "paused" | "stopped") {
  const supabase = getSupabaseAdmin();
  const tokenHash = hashToken(token);
  const column = status === "paused" ? "pause_token_hash" : "unsubscribe_token_hash";
  const now = new Date().toISOString();

  const { data: reminder, error } = await supabase
    .from("reminders")
    .select("id, email")
    .eq(column, tokenHash)
    .maybeSingle();

  if (error || !reminder) {
    return { ok: false, message: "This link is invalid or expired." };
  }

  await supabase
    .from("reminders")
    .update({ status, updated_at: now })
    .eq("id", reminder.id);

  await supabase.from("suppressions").insert({
    reminder_id: reminder.id,
    email: reminder.email,
    reason: status === "paused" ? "paused" : "unsubscribed",
    source: "email_link",
  });

  return { ok: true, message: status === "paused" ? "Reminder paused." : "Reminder stopped." };
}

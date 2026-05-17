export type ReminderTone = "normal" | "brutal";
export type ReminderCadence = "daily" | "weekdays" | "weekly";
export type ReminderStatus = "active" | "paused" | "stopped";
export type CheckinResponse = "done" | "not_yet" | "snoozed";

export type ReminderRecord = {
  id: string;
  email: string;
  goal: string;
  why_it_matters: string | null;
  excuse: string | null;
  first_step: string;
  tone: ReminderTone;
  cadence: ReminderCadence;
  timezone: string | null;
  preferred_local_time: string | null;
  status: ReminderStatus;
  streak_count: number;
  last_sent_at: string | null;
  next_due_at: string | null;
  product_updates_opt_in: boolean;
  unsubscribe_token_hash: string;
  pause_token_hash: string;
  consented_at: string;
  consent_version: string;
  created_at: string;
  updated_at: string;
};

export type CreateReminderInput = {
  goal: string;
  whyItMatters?: string;
  excuse?: string;
  firstStep?: string;
  cadence: ReminderCadence;
  reminderTime: string;
  timezone: string;
  tone: ReminderTone;
  email: string;
  reminderConsent: boolean;
  productUpdates?: boolean;
};

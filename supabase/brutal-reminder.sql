create extension if not exists pgcrypto;

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  goal text not null,
  why_it_matters text,
  excuse text,
  first_step text not null,
  tone text not null check (tone in ('normal', 'brutal')),
  cadence text not null check (cadence in ('daily', 'weekdays', 'weekly')),
  timezone text,
  preferred_local_time time,
  status text not null default 'active' check (status in ('active', 'paused', 'stopped')),
  streak_count integer not null default 0,
  last_sent_at timestamptz,
  next_due_at timestamptz,
  product_updates_opt_in boolean not null default false,
  unsubscribe_token_hash text not null,
  pause_token_hash text not null,
  consented_at timestamptz not null,
  consent_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid references reminders(id) on delete cascade,
  kind text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  resend_message_id text,
  provider_status text,
  failure_reason text,
  created_at timestamptz not null default now()
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid references reminders(id) on delete cascade,
  token_hash text not null,
  response text check (response in ('done', 'not_yet', 'snoozed')),
  optional_note text,
  requested_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists suppressions (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid references reminders(id) on delete cascade,
  email text,
  reason text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid references reminders(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  consented_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Phase 2 AI fields (idempotent: safe to re-run)
alter table reminders add column if not exists ai_clean_goal text;
alter table reminders add column if not exists ai_small_step text;
alter table reminders add column if not exists ai_notification_title text;
alter table reminders add column if not exists ai_notification_body text;
alter table reminders add column if not exists ai_reality_check text;
alter table reminders add column if not exists ai_variations jsonb not null default '[]'::jsonb;
alter table reminders add column if not exists ai_done_message text;
alter table reminders add column if not exists ai_snooze_message text;
alter table reminders add column if not exists ai_not_yet_message text;

create index if not exists reminders_due_idx on reminders (status, next_due_at);
create index if not exists reminders_pause_token_idx on reminders (pause_token_hash);
create index if not exists reminders_unsubscribe_token_idx on reminders (unsubscribe_token_hash);
create index if not exists checkins_token_idx on checkins (token_hash);
create unique index if not exists push_subscriptions_endpoint_idx on push_subscriptions (endpoint);
create index if not exists push_subscriptions_reminder_idx on push_subscriptions (reminder_id);

alter table reminders enable row level security;
alter table deliveries enable row level security;
alter table checkins enable row level security;
alter table suppressions enable row level security;
alter table push_subscriptions enable row level security;

grant usage on schema public to service_role;
grant all on table reminders to service_role;
grant all on table deliveries to service_role;
grant all on table checkins to service_role;
grant all on table suppressions to service_role;
grant all on table push_subscriptions to service_role;

drop policy if exists "No public reminders access" on reminders;
drop policy if exists "No public deliveries access" on deliveries;
drop policy if exists "No public checkins access" on checkins;
drop policy if exists "No public suppressions access" on suppressions;
drop policy if exists "No public push_subscriptions access" on push_subscriptions;
drop policy if exists "Service role reminders access" on reminders;
drop policy if exists "Service role deliveries access" on deliveries;
drop policy if exists "Service role checkins access" on checkins;
drop policy if exists "Service role suppressions access" on suppressions;
drop policy if exists "Service role push_subscriptions access" on push_subscriptions;

create policy "No public reminders access" on reminders for all using (false) with check (false);
create policy "No public deliveries access" on deliveries for all using (false) with check (false);
create policy "No public checkins access" on checkins for all using (false) with check (false);
create policy "No public suppressions access" on suppressions for all using (false) with check (false);
create policy "No public push_subscriptions access" on push_subscriptions for all using (false) with check (false);

create policy "Service role reminders access" on reminders for all to service_role using (true) with check (true);
create policy "Service role deliveries access" on deliveries for all to service_role using (true) with check (true);
create policy "Service role checkins access" on checkins for all to service_role using (true) with check (true);
create policy "Service role suppressions access" on suppressions for all to service_role using (true) with check (true);
create policy "Service role push_subscriptions access" on push_subscriptions for all to service_role using (true) with check (true);

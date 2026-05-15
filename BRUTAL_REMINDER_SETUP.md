# Brutal Reminder Setup

Brutal Reminder is built for free-tier friendly services.

## Environment variables

Set these on Vercel and locally:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
BRUTAL_REMINDER_FROM_EMAIL="Brutal Reminder <reminders@100tools.pk>"
BRUTAL_REMINDER_CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://100tools.pk
```

`SUPABASE_SERVICE_ROLE_KEY` is only used inside server-side API routes. Do not expose it in client code.

## Database

Run `supabase/brutal-reminder.sql` in Supabase SQL editor. It creates the four MVP tables and enables Row Level Security with no public policies.

## Scheduler

`vercel.json` adds one daily Vercel Cron call to `/api/brutal-reminder/send-due`. For manual testing, call the same endpoint with:

```bash
curl -X POST https://100tools.pk/api/brutal-reminder/send-due \
  -H "Authorization: Bearer $BRUTAL_REMINDER_CRON_SECRET"
```

Local development allows this endpoint without the cron secret, but production requires it.

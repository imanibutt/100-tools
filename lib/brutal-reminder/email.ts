import { Resend } from "resend";
import { escapeHtml, getPreviewText, getReminderSubject } from "./content";
import type { CheckinResponse, ReminderRecord } from "./types";

let resend: Resend | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!resend) {
    resend = new Resend(apiKey);
  }

  return resend;
}

function baseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function responseHref(token: string, response: CheckinResponse) {
  return `${baseUrl()}/brutal-reminder/checkin?token=${encodeURIComponent(token)}&response=${response}`;
}

function actionLink(href: string, label: string, background = "#FF5A5F") {
  return `<a href="${href}" style="display:inline-block;margin:0 8px 10px 0;padding:12px 16px;border-radius:8px;background:${background};color:#ffffff;text-decoration:none;font-weight:700">${label}</a>`;
}

export function buildReminderEmailHtml(
  reminder: Pick<ReminderRecord, "goal" | "first_step" | "excuse" | "tone">,
  tokens: { checkin: string; pause: string; unsubscribe: string },
) {
  const body = getPreviewText(reminder.tone, reminder.goal, reminder.first_step, reminder.excuse ?? undefined)
    .split("\n")
    .map((line) => (line ? `<p style="margin:0 0 12px">${escapeHtml(line)}</p>` : `<div style="height:8px"></div>`))
    .join("");

  const pauseHref = `${baseUrl()}/brutal-reminder/pause?token=${encodeURIComponent(tokens.pause)}`;
  const unsubscribeHref = `${baseUrl()}/brutal-reminder/unsubscribe?token=${encodeURIComponent(tokens.unsubscribe)}`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#0B0F14;color:#F5F7FA;font-family:Inter,Arial,sans-serif">
    <div style="max-width:620px;margin:0 auto;padding:36px 20px">
      <div style="border:1px solid rgba(255,255,255,0.10);background:#141A23;border-radius:10px;padding:28px">
        <div style="margin:0 0 24px">
          <div style="color:#F5F7FA;font:900 24px/1 Inter,Arial,sans-serif;letter-spacing:.18em">BRUTAL</div>
          <div style="color:#F5F7FA;font:800 11px/1.4 Inter,Arial,sans-serif;letter-spacing:.55em;margin-top:7px">REMINDER</div>
          <div style="width:46px;height:4px;background:#FF4D3D;margin-top:14px"></div>
        </div>
        <p style="margin:0 0 20px;color:#FF4D3D;font:700 12px/1.2 monospace;letter-spacing:.14em">TODAY'S MOVE</p>
        <div style="font-size:16px;line-height:1.65;color:#F5F7FA">${body}</div>
        <div style="margin-top:24px">
          ${actionLink(responseHref(tokens.checkin, "done"), "Done", "#22C55E")}
          ${actionLink(responseHref(tokens.checkin, "not_yet"), "Not yet", "#FF5A5F")}
          ${actionLink(responseHref(tokens.checkin, "snoozed"), "Snooze", "#334155")}
        </div>
        <p style="margin:28px 0 8px;color:#94A3B8;font-size:13px">You asked for this reminder from Brutal Reminder by 100 Tools.</p>
        <p style="margin:0;color:#94A3B8;font-size:13px">
          <a href="${pauseHref}" style="color:#F5F7FA">Pause</a>
          <span>&nbsp;|&nbsp;</span>
          <a href="${unsubscribeHref}" style="color:#F5F7FA">Unsubscribe</a>
        </p>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendReminderEmail(
  reminder: Pick<ReminderRecord, "email" | "goal" | "first_step" | "excuse" | "tone">,
  tokens: { checkin: string; pause: string; unsubscribe: string },
) {
  const client = getResend();
  if (!client) {
    return { skipped: true, id: null };
  }

  const from = process.env.BRUTAL_REMINDER_FROM_EMAIL || "Brutal Reminder <reminders@100tools.pk>";
  const result = await client.emails.send({
    from,
    to: reminder.email,
    subject: getReminderSubject(reminder.tone),
    html: buildReminderEmailHtml(reminder, tokens),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { skipped: false, id: result.data?.id ?? null };
}

import nodemailer from "nodemailer";
import { Resend } from "resend";
import { escapeHtml, getPreviewText, getReminderSubject } from "./content";
import type { CheckinResponse, ReminderRecord } from "./types";

let resend: Resend | null = null;
let smtpTransport: ReturnType<typeof nodemailer.createTransport> | null = null;

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

function getEmailProvider() {
  return (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
}

function getSmtpTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  return smtpTransport;
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
  return `<a href="${href}" style="display:inline-block;margin:0 8px 10px 0;padding:13px 18px;border-radius:8px;background:${background};color:#ffffff;text-decoration:none;font-weight:800">${label}</a>`;
}

function textBlock(label: string, value: string, borderColor = "rgba(255,255,255,0.12)") {
  return `
    <div style="border:1px solid ${borderColor};background:#0B0F14;border-radius:8px;padding:16px 18px;margin:0 0 14px">
      <p style="margin:0 0 8px;color:#94A3B8;font:800 11px/1.2 monospace;letter-spacing:.16em;text-transform:uppercase">${label}</p>
      <p style="margin:0;color:#F5F7FA;font:800 20px/1.35 Inter,Arial,sans-serif">${value}</p>
    </div>`;
}

function buildReminderEmailText(reminder: Pick<ReminderRecord, "goal" | "first_step" | "excuse" | "tone">) {
  return getPreviewText(reminder.tone, reminder.goal, reminder.first_step, reminder.excuse ?? undefined);
}

export function buildReminderEmailHtml(
  reminder: Pick<ReminderRecord, "goal" | "first_step" | "excuse" | "tone">,
  tokens: { checkin: string; pause: string; unsubscribe: string },
) {
  const goal = escapeHtml(reminder.goal || "[goal]");
  const firstStep = escapeHtml(reminder.first_step || "[first_small_step]");
  const excuse = escapeHtml(reminder.excuse || "whatever usually stops you");
  const isBrutal = reminder.tone === "brutal";
  const preheader = "Your next small step is ready.";
  const realityLine = isBrutal
    ? `${excuse} is not the enemy. Repeating it without action is.`
    : "You do not need to finish everything today. You only need to complete the next visible action.";
  const pauseHref = `${baseUrl()}/brutal-reminder/pause?token=${encodeURIComponent(tokens.pause)}`;
  const unsubscribeHref = `${baseUrl()}/brutal-reminder/unsubscribe?token=${encodeURIComponent(tokens.unsubscribe)}`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#070A0E;color:#F5F7FA;font-family:Inter,Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent">${preheader}</div>
    <div style="max-width:660px;margin:0 auto;padding:32px 18px">
      <div style="border:1px solid rgba(255,255,255,0.10);background:#111820;border-radius:10px;overflow:hidden">
        <div style="background:#0B0E13;padding:26px 26px 22px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <div style="color:#F5F7FA;font:900 28px/1 Inter,Arial,sans-serif;letter-spacing:.16em">BRUTAL</div>
          <div style="color:#F5F7FA;font:800 11px/1.4 Inter,Arial,sans-serif;letter-spacing:.58em;margin-top:8px">REMINDER</div>
          <div style="width:58px;height:4px;background:#FF4D3D;margin-top:16px"></div>
        </div>

        <div style="padding:28px 26px 8px">
          <p style="margin:0 0 14px;color:#FF4D3D;font:800 12px/1.2 monospace;letter-spacing:.16em">TODAY'S MOVE</p>
          <h1 style="margin:0 0 22px;color:#F5F7FA;font:900 34px/1.05 Inter,Arial,sans-serif;letter-spacing:-.03em">Your goal is still waiting. Take the small step.</h1>

          ${textBlock("Goal", goal)}
          ${textBlock("Do this first", firstStep, "rgba(255,77,61,0.55)")}

          <div style="border-left:4px solid #FF4D3D;background:#0B0F14;border-radius:8px;padding:15px 16px;margin:18px 0 24px">
            <p style="margin:0 0 7px;color:#FF4D3D;font:800 11px/1.2 monospace;letter-spacing:.16em;text-transform:uppercase">Reality check</p>
            <p style="margin:0;color:#D7DEE9;font-size:16px;line-height:1.6">${realityLine}</p>
          </div>

          <p style="margin:0 0 14px;color:#94A3B8;font-size:15px;line-height:1.6">Tap one answer when the step is done. Keep the promise small enough to complete today.</p>
        </div>

        <div style="padding:0 26px 28px">
          ${actionLink(responseHref(tokens.checkin, "done"), "Done", "#22C55E")}
          ${actionLink(responseHref(tokens.checkin, "not_yet"), "Not yet", "#FF5A5F")}
          ${actionLink(responseHref(tokens.checkin, "snoozed"), "Snooze", "#334155")}
        </div>

        <div style="padding:18px 26px 26px;border-top:1px solid rgba(255,255,255,0.08);background:#0B0F14">
          <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;line-height:1.5">You asked for this reminder from Brutal Reminder by 100 Tools.</p>
          <p style="margin:0;color:#94A3B8;font-size:13px">
            <a href="${pauseHref}" style="color:#F5F7FA">Pause</a>
            <span>&nbsp;|&nbsp;</span>
            <a href="${unsubscribeHref}" style="color:#F5F7FA">Unsubscribe</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendReminderEmail(
  reminder: Pick<ReminderRecord, "email" | "goal" | "first_step" | "excuse" | "tone">,
  tokens: { checkin: string; pause: string; unsubscribe: string },
) {
  const from = process.env.EMAIL_FROM || process.env.BRUTAL_REMINDER_FROM_EMAIL || "Brutal Reminder <reminders@100tools.pk>";
  const provider = getEmailProvider();

  if (provider === "gmail") {
    const transport = getSmtpTransport();
    if (!transport) {
      throw new Error("Gmail SMTP is not configured.");
    }

    const result = await transport.sendMail({
      from,
      to: reminder.email,
      subject: getReminderSubject(reminder.tone),
      html: buildReminderEmailHtml(reminder, tokens),
      text: buildReminderEmailText(reminder),
    });

    return { skipped: false, id: result.messageId ?? null };
  }

  const client = getResend();
  if (!client) {
    return { skipped: true, id: null };
  }

  const result = await client.emails.send({
    from,
    to: reminder.email,
    subject: getReminderSubject(reminder.tone),
    html: buildReminderEmailHtml(reminder, tokens),
    text: buildReminderEmailText(reminder),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { skipped: false, id: result.data?.id ?? null };
}

export function buildWelcomeEmailHtml(
  reminder: Pick<ReminderRecord, "goal" | "first_step">,
  tokens: { pause: string; unsubscribe: string },
) {
  const goal = escapeHtml(reminder.goal || "[goal]");
  const firstStep = escapeHtml(reminder.first_step || "[first_small_step]");
  const pauseHref = `${baseUrl()}/brutal-reminder/pause?token=${encodeURIComponent(tokens.pause)}`;
  const unsubscribeHref = `${baseUrl()}/brutal-reminder/unsubscribe?token=${encodeURIComponent(tokens.unsubscribe)}`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#070A0E;color:#F5F7FA;font-family:Inter,Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent">Thanks for subscribing. Your first real reminder will arrive at the time you selected.</div>
    <div style="max-width:660px;margin:0 auto;padding:32px 18px">
      <div style="border:1px solid rgba(255,255,255,0.10);background:#111820;border-radius:10px;overflow:hidden">
        <div style="background:#0B0E13;padding:26px 26px 22px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <div style="color:#F5F7FA;font:900 28px/1 Inter,Arial,sans-serif;letter-spacing:.16em">BRUTAL</div>
          <div style="color:#F5F7FA;font:800 11px/1.4 Inter,Arial,sans-serif;letter-spacing:.58em;margin-top:8px">REMINDER</div>
          <div style="width:58px;height:4px;background:#FF4D3D;margin-top:16px"></div>
        </div>

        <div style="padding:28px 26px 30px">
          <p style="margin:0 0 14px;color:#FF4D3D;font:800 12px/1.2 monospace;letter-spacing:.16em">YOU ARE ON THE LIST</p>
          <h1 style="margin:0 0 18px;color:#F5F7FA;font:900 34px/1.05 Inter,Arial,sans-serif;letter-spacing:-.03em">Thanks for subscribing.</h1>
          <p style="margin:0 0 18px;color:#D7DEE9;font-size:17px;line-height:1.6">I will send you a brutal reality check at the time you selected. You can ignore noise. You cannot escape me.</p>

          ${textBlock("Goal", goal)}
          ${textBlock("First scheduled task", firstStep, "rgba(255,77,61,0.55)")}

          <p style="margin:18px 0 0;color:#94A3B8;font-size:14px;line-height:1.6">No action is needed from this email. The Done / Not yet / Snooze buttons will appear in your scheduled reminder.</p>
        </div>

        <div style="padding:18px 26px 26px;border-top:1px solid rgba(255,255,255,0.08);background:#0B0F14">
          <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;line-height:1.5">You asked for this reminder from Brutal Reminder by 100 Tools.</p>
          <p style="margin:0;color:#94A3B8;font-size:13px">
            <a href="${pauseHref}" style="color:#F5F7FA">Pause</a>
            <span>&nbsp;|&nbsp;</span>
            <a href="${unsubscribeHref}" style="color:#F5F7FA">Unsubscribe</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendWelcomeEmail(
  reminder: Pick<ReminderRecord, "email" | "goal" | "first_step">,
  tokens: { pause: string; unsubscribe: string },
) {
  const from = process.env.EMAIL_FROM || process.env.BRUTAL_REMINDER_FROM_EMAIL || "Brutal Reminder <reminders@100tools.pk>";
  const provider = getEmailProvider();

  if (provider === "gmail") {
    const transport = getSmtpTransport();
    if (!transport) {
      throw new Error("Gmail SMTP is not configured.");
    }

    const result = await transport.sendMail({
      from,
      to: reminder.email,
      subject: "You subscribed to Brutal Reminder",
      html: buildWelcomeEmailHtml(reminder, tokens),
      text: [
        "Thanks for subscribing.",
        "",
        "I will send you a brutal reality check at the time you selected. You can ignore noise. You cannot escape me.",
        "",
        `Goal: ${reminder.goal}`,
        `First scheduled task: ${reminder.first_step}`,
        "",
        "No action is needed from this email.",
      ].join("\n"),
    });

    return { skipped: false, id: result.messageId ?? null };
  }

  const client = getResend();
  if (!client) {
    return { skipped: true, id: null };
  }

  const result = await client.emails.send({
    from,
    to: reminder.email,
    subject: "You subscribed to Brutal Reminder",
    html: buildWelcomeEmailHtml(reminder, tokens),
    text: [
      "Thanks for subscribing.",
      "",
      "I will send you a brutal reality check at the time you selected. You can ignore noise. You cannot escape me.",
      "",
      `Goal: ${reminder.goal}`,
      `First scheduled task: ${reminder.first_step}`,
      "",
      "No action is needed from this email.",
    ].join("\n"),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { skipped: false, id: result.data?.id ?? null };
}

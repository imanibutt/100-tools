import webpush from "web-push";
import { getSupabaseAdmin } from "./db";

export type PushSubscriptionRecord = {
  id: string;
  reminder_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  revoked: boolean;
  last_seen_at: string;
};

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  reminderId?: string;
};

let configured = false;
let configurationError: string | null = null;

export function configureWebPush() {
  if (configured) {
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@100tools.pk";

  if (!publicKey || !privateKey) {
    configurationError = "VAPID keys are not configured.";
    return;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    configurationError = null;
  } catch (error) {
    configurationError = error instanceof Error ? error.message : "VAPID setup failed.";
  }
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export function getWebPushConfigurationStatus() {
  configureWebPush();
  return {
    configured,
    publicKey: getVapidPublicKey(),
    error: configurationError,
  };
}

function ensureConfigured() {
  configureWebPush();
  if (!configured) {
    throw new Error(configurationError || "Web Push is not configured.");
  }
}

export async function savePushSubscription(
  reminderId: string,
  subscription: PushSubscriptionInput,
  userAgent?: string | null,
) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing, error: lookupError } = await supabase
    .from("push_subscriptions")
    .select("id, reminder_id")
    .eq("endpoint", subscription.endpoint)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("push_subscriptions")
      .update({
        reminder_id: reminderId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent || null,
        revoked: false,
        last_seen_at: now,
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    return { id: existing.id, reused: true };
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .insert({
      reminder_id: reminderId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent || null,
      revoked: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Push subscription could not be saved.");
  }

  return { id: data.id, reused: false };
}

export async function revokePushSubscription(endpoint: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ revoked: true, last_seen_at: new Date().toISOString() })
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(error.message);
  }
}

export async function revokeAllSubscriptionsForReminder(reminderId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ revoked: true, last_seen_at: new Date().toISOString() })
    .eq("reminder_id", reminderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listActiveSubscriptionsForReminder(reminderId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("reminder_id", reminderId)
    .eq("revoked", false);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as PushSubscriptionRecord[];
}

export async function sendPushToSubscription(
  record: Pick<PushSubscriptionRecord, "endpoint" | "p256dh" | "auth">,
  payload: PushPayload,
) {
  ensureConfigured();

  const subscription = {
    endpoint: record.endpoint,
    keys: {
      p256dh: record.p256dh,
      auth: record.auth,
    },
  };

  return webpush.sendNotification(
    subscription,
    JSON.stringify(payload),
    {
      TTL: 60 * 60 * 24,
    },
  );
}

export async function sendPushToReminder(reminderId: string, payload: PushPayload) {
  const subscriptions = await listActiveSubscriptionsForReminder(reminderId);

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, errors: [] as string[] };
  }

  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      sendPushToSubscription(subscription, payload).then(() => subscription.endpoint),
    ),
  );

  const errors: string[] = [];
  let failed = 0;
  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      failed += 1;
      const reason = result.reason instanceof Error ? result.reason.message : "Push send failed.";
      errors.push(`${subscriptions[index].endpoint.slice(0, 80)}: ${reason}`);
      const statusCode =
        result.reason && typeof result.reason === "object" && "statusCode" in result.reason
          ? (result.reason as { statusCode?: number }).statusCode
          : undefined;
      if (statusCode === 404 || statusCode === 410) {
        await revokePushSubscription(subscriptions[index].endpoint).catch(() => null);
      }
    }
  }

  return { sent: results.length - failed, failed, errors };
}

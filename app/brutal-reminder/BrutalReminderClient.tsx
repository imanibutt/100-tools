"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateFirstStep, getPreviewText, getReminderSubject } from "@/lib/brutal-reminder/content";
import { formatSchedule } from "@/lib/brutal-reminder/time";
import type { ReminderCadence, ReminderTone } from "@/lib/brutal-reminder/types";
import { TopNav } from "@/components/top-nav";
import { ProductMark } from "@/components/product-icons";
import { SiteFooter } from "@/components/site-footer";
import styles from "./page.module.css";

const initialTime = "09:00";

type SuccessState = {
  goal: string;
  firstStep: string;
  cadence: ReminderCadence;
  reminderTime: string;
  email: string;
  welcomeEmailStatus: "sent" | "skipped" | "failed";
  notificationChannel: "push" | "email" | "both";
  unsubscribeToken: string;
  message: string;
  ai: AIMessage | null;
};

type NotificationSupport = "unknown" | "supported" | "unsupported";

type PushState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "testing" }
  | { status: "enabled" }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

type AIMessage = {
  cleanGoal: string | null;
  smallStep: string | null;
  notificationTitle: string | null;
  notificationBody: string | null;
  realityCheck: string | null;
  encouragement: string | null;
  variations: Array<{ title: string; body: string }>;
  doneMessage: string | null;
  snoozeMessage: string | null;
  notYetMessage: string | null;
  source: "ai" | "fallback";
};

type AIGenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; message: AIMessage }
  | { status: "error"; message: string };

const pushStorageKey = (token: string) => `brutal-reminder:push:${token}`;

export default function BrutalReminderClient() {
  const formRef = useRef<HTMLDivElement>(null);
  const [goal, setGoal] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [excuse, setExcuse] = useState("");
  const [firstStep, setFirstStep] = useState("");
  const [cadence, setCadence] = useState<ReminderCadence>("daily");
  const [reminderTime, setReminderTime] = useState(initialTime);
  const [timezone, setTimezone] = useState("UTC");
  const [tone, setTone] = useState<ReminderTone>("brutal");
  const [email, setEmail] = useState("");
  const [reminderConsent, setReminderConsent] = useState(false);
  const [productUpdates, setProductUpdates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [notificationSupport, setNotificationSupport] = useState<NotificationSupport>("unknown");
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushState>({ status: "idle" });
  const [emailFallbackChosen, setEmailFallbackChosen] = useState(false);
  const [aiState, setAiState] = useState<AIGenerationState>({ status: "idle" });
  const [aiSubmitError, setAiSubmitError] = useState("");

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      setTimezone(detected);
    }
  }, []);

  const resolvedFirstStep = useMemo(() => {
    return firstStep.trim() || generateFirstStep(goal);
  }, [firstStep, goal]);

  const subject = getReminderSubject(tone);
  const body = getPreviewText(tone, goal, resolvedFirstStep, excuse);

  const previewTitle =
    aiState.status === "ready" && aiState.message.notificationTitle
      ? aiState.message.notificationTitle
      : subject;

  const previewBody =
    aiState.status === "ready" && aiState.message.notificationBody
      ? aiState.message.notificationBody
      : body
          .split("\n")
          .filter(Boolean)
          .slice(0, 2)
          .join(" — ");

  const previewStep =
    aiState.status === "ready" && aiState.message.smallStep
      ? aiState.message.smallStep
      : resolvedFirstStep;

  function scrollToForm() {
    formRef.current?.scrollIntoView({ block: "start" });
  }

  async function preparePushFlow() {
    if (typeof window === "undefined") {
      return;
    }
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!supported) {
      setNotificationSupport("unsupported");
      setPushState({ status: "unsupported" });
      return;
    }

    setNotificationSupport("supported");

    try {
      const response = await fetch("/api/brutal-reminder/vapid-public-key", { cache: "no-store" });
      if (!response.ok) {
        setVapidPublicKey(null);
        return;
      }
      const data = await response.json();
      setVapidPublicKey(typeof data.publicKey === "string" ? data.publicKey : null);
    } catch {
      setVapidPublicKey(null);
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function enableNotifications() {
    if (!success || !success.unsubscribeToken) {
      return;
    }

    if (notificationSupport === "unsupported") {
      setPushState({ status: "unsupported" });
      return;
    }

    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      setPushState({ status: "denied" });
      return;
    }

    setPushState({ status: "requesting" });

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      let permission: NotificationPermission = "default";
      if (typeof Notification !== "undefined") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        setPushState({ status: "denied" });
        return;
      }

      if (!vapidPublicKey) {
        setPushState({ status: "error", message: "Push is not configured on the server." });
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const subscriptionJson = subscription.toJSON();
      const keys = subscriptionJson.keys as { p256dh?: string; auth?: string } | undefined;

      if (!keys || !keys.p256dh || !keys.auth) {
        setPushState({ status: "error", message: "Subscription keys are missing." });
        return;
      }

      const saveResponse = await fetch("/api/brutal-reminder/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: success.unsubscribeToken,
          subscription: {
            endpoint: subscription.endpoint,
            keys: { p256dh: keys.p256dh, auth: keys.auth },
          },
        }),
      });

      if (!saveResponse.ok) {
        const errorBody = await saveResponse.json().catch(() => ({}));
        throw new Error(errorBody.error || "Subscription could not be saved.");
      }

      try {
        window.localStorage.setItem(
          pushStorageKey(success.unsubscribeToken),
          JSON.stringify({ endpoint: subscription.endpoint, enabledAt: new Date().toISOString() }),
        );
      } catch {
        // localStorage may be blocked; non-fatal.
      }

      setPushState({ status: "testing" });

      const testResponse = await fetch("/api/brutal-reminder/test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: success.unsubscribeToken }),
      });

      if (!testResponse.ok) {
        const errorBody = await testResponse.json().catch(() => ({}));
        setPushState({ status: "error", message: errorBody.error || "Test notification failed." });
        return;
      }

      setPushState({ status: "enabled" });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not enable notifications.";
      setPushState({ status: "error", message });
    }
  }

  async function generateAIMessage() {
    if (!goal.trim()) {
      setAiState({ status: "error", message: "Add a goal first to generate a smarter reminder." });
      return;
    }
    setAiState({ status: "loading" });
    setAiSubmitError("");
    try {
      const response = await fetch("/api/brutal-reminder/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          whyItMatters,
          excuse,
          firstStep,
          tone,
          cadence,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.message) {
        throw new Error(payload.error || "AI generation failed.");
      }
      setAiState({ status: "ready", message: payload.message });
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not generate a smarter reminder right now.";
      setAiState({ status: "error", message });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(null);
    setAiSubmitError("");
    setIsSubmitting(true);

    let aiPayload: AIMessage | null = null;

    if (aiState.status === "ready") {
      aiPayload = aiState.message;
    } else {
      try {
        const response = await fetch("/api/brutal-reminder/generate-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal,
            whyItMatters,
            excuse,
            firstStep,
            tone,
            cadence,
          }),
        });
        const payload = await response.json();
        if (response.ok && payload.message) {
          aiPayload = payload.message;
        }
      } catch {
        aiPayload = null;
      }
    }

    try {
      const response = await fetch("/api/brutal-reminder/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          whyItMatters,
          excuse,
          firstStep,
          cadence,
          reminderTime,
          timezone,
          tone,
          email,
          reminderConsent,
          productUpdates,
          notificationChannel: emailFallbackChosen ? "email" : "push",
          ai: aiPayload,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not activate the reminder.");
      }

      const channel: "push" | "email" | "both" =
        payload.notificationChannel === "email" || payload.notificationChannel === "both"
          ? payload.notificationChannel
          : "push";

      const aiFromServer: AIMessage | null =
        payload.ai && typeof payload.ai === "object"
          ? {
              cleanGoal: payload.ai.cleanGoal ?? null,
              smallStep: payload.ai.smallStep ?? null,
              notificationTitle: payload.ai.notificationTitle ?? null,
              notificationBody: payload.ai.notificationBody ?? null,
              realityCheck: payload.ai.realityCheck ?? null,
              encouragement: payload.ai.encouragement ?? null,
              variations: Array.isArray(payload.ai.variations) ? payload.ai.variations : [],
              doneMessage: payload.ai.doneMessage ?? null,
              snoozeMessage: payload.ai.snoozeMessage ?? null,
              notYetMessage: payload.ai.notYetMessage ?? null,
              source: payload.ai.source === "ai" ? "ai" : "fallback",
            }
          : null;

      setSuccess({
        goal: payload.goal,
        firstStep: payload.firstStep,
        cadence: payload.cadence,
        reminderTime: payload.reminderTime,
        email,
        welcomeEmailStatus: payload.welcomeEmailStatus || "skipped",
        notificationChannel: channel,
        unsubscribeToken: typeof payload.unsubscribeToken === "string" ? payload.unsubscribeToken : "",
        message: payload.message || "Reminder active.",
        ai: aiFromServer,
      });

      if (channel === "push" && !emailFallbackChosen) {
        await preparePushFlow();
      }
    } catch (caught) {
      const caughtError = caught instanceof Error ? caught.message : "Something went wrong.";
      setError(caughtError);
      setAiSubmitError(caughtError);
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchToEmailFallback() {
    setEmailFallbackChosen(true);
  }

  return (
    <>
      <TopNav activeHref="/brutal-reminder" variant="centered" />
      <main className={`${styles.page} brutalReminderPage`}>
        <div className={styles.shell}>
        <section className="tool-hero">
          <div className="tool-hero-lockup">
            <ProductMark accent="reminder" size="md" />
            <span className="tool-status-pill">Live</span>
          </div>
          <h1 className="tool-hero-title">Your goal is not the problem. Your next step is.</h1>
          <p className="tool-hero-lede">
            Brutal Reminder turns one big goal into one small daily action and sends you honest
            accountability nudges through browser notifications. Email stays as a quiet fallback if you prefer it.
          </p>
          <div className="tool-hero-actions">
            <button className={styles.primaryButton} type="button" onClick={scrollToForm}>
              Set Brutal Reminder
            </button>
          </div>
          <div className="tool-hero-pills">
            <span>Private by default</span>
            <span>Browser push primary</span>
            <span>Email fallback</span>
            <span>Stop anytime</span>
          </div>
        </section>

        <aside className={styles.signalPanel} aria-label="Reminder signal">
          <p className={styles.monoLabel}>REALITY CHECK</p>
          <div className={styles.signalLine} />
          <div className={styles.signalMetric}><span>Goal</span><strong>One</strong></div>
          <div className={styles.signalMetric}><span>Action</span><strong>5-15 min</strong></div>
          <div className={styles.signalMetric}><span>Channel</span><strong>Browser push</strong></div>
          <div className={styles.signalMetric}><span>Fallback</span><strong>Email</strong></div>
        </aside>

        <section className={styles.cards} aria-label="How Brutal Reminder works">
          <article className={styles.infoCard}>
            <p className={styles.monoLabel}>01</p>
            <h2>One Goal</h2>
            <p>Focus on one thing that actually matters.</p>
          </article>
          <article className={styles.infoCard}>
            <p className={styles.monoLabel}>02</p>
            <h2>One Small Step</h2>
            <p>We reduce the goal into a tiny action you can do today.</p>
          </article>
          <article className={styles.infoCard}>
            <p className={styles.monoLabel}>03</p>
            <h2>One Honest Check-in</h2>
            <p>Done, Not Yet, or Snooze. No speeches. Just truth.</p>
          </article>
        </section>

        <section className={styles.setupGrid} ref={formRef}>
          <div className={styles.formCard}>
            <p className={styles.kicker}>Reminder setup</p>
            <h2>Build the reminder that will actually find you.</h2>
            <div className={styles.steps} aria-label="Setup progress">
              <span className={styles.step}>Step 1 Goal</span>
              <span className={styles.step}>Step 2 Small Step</span>
              <span className={styles.step}>Step 3 Reminder Setup</span>
            </div>

            {success ? (
              <div className={styles.success} role="status">
                <div className={styles.successHeader}>
                  <span className={styles.successPill}>Live</span>
                  <h3>
                    {success.notificationChannel === "push"
                      ? "Reminder saved. Your first nudge is ready."
                      : success.welcomeEmailStatus === "sent"
                        ? "Reminder active. Welcome email sent."
                        : success.welcomeEmailStatus === "skipped"
                          ? "Reminder active. Welcome email skipped."
                          : "Reminder active, but the welcome email failed."}
                  </h3>
                  <p>
                    {success.notificationChannel === "push"
                      ? "Your goal is saved. We turned it into one small action and prepared your first browser nudge."
                      : success.welcomeEmailStatus === "sent"
                        ? `Check ${success.email}. Your scheduled reminder will arrive at the time you selected.`
                        : success.welcomeEmailStatus === "skipped"
                          ? success.message
                        : success.message}
                  </p>
                </div>

                {success.ai ? (
                  <div className={styles.aiSuccessCard}>
                    <div className={styles.aiSuccessBadge}>
                      Personalized by {success.ai.source === "ai" ? "AI" : "fallback rules"}
                    </div>
                    {success.ai.cleanGoal ? (
                      <p className={styles.aiSuccessGoal}>
                        <span>Goal</span>
                        <strong>{success.ai.cleanGoal}</strong>
                      </p>
                    ) : null}
                    {success.ai.smallStep ? (
                      <p className={styles.aiSuccessStep}>
                        <span>Today&apos;s move</span>
                        <strong>{success.ai.smallStep}</strong>
                      </p>
                    ) : null}
                    <div className={styles.aiSuccessNotification}>
                      <p className={styles.aiSuccessKicker}>FIRST NUDGE</p>
                      <h4>{success.ai.notificationTitle || "Your nudge is ready"}</h4>
                      <p>{success.ai.notificationBody}</p>
                      {success.ai.realityCheck ? (
                        <p className={styles.aiSuccessReality}>{success.ai.realityCheck}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {success.notificationChannel === "push" && !emailFallbackChosen ? (
                  <div className={styles.pushConsentCard}>
                    <p className={styles.pushConsentTitle}>Enable browser notifications</p>
                    <p className={styles.pushConsentCopy}>
                      Brutal Reminder will send goal check-ins as browser notifications. You can stop anytime.
                    </p>

                    {notificationSupport === "unsupported" || pushState.status === "unsupported" ? (
                      <div className={styles.pushUnsupported}>
                        <strong>This browser does not support push notifications.</strong>
                        <span>You can still get reminders by email. Switch to email fallback below.</span>
                        <button type="button" className={styles.outlineButton} onClick={switchToEmailFallback}>
                          Use email instead
                        </button>
                      </div>
                    ) : pushState.status === "denied" ? (
                      <div className={styles.pushDenied}>
                        <strong>Notifications are blocked for this site.</strong>
                        <span>
                          Open your browser site settings, allow notifications for 100tools.pk, then reload this page and try again.
                          You can also switch to email fallback.
                        </span>
                        <button type="button" className={styles.outlineButton} onClick={switchToEmailFallback}>
                          Use email instead
                        </button>
                      </div>
                    ) : pushState.status === "error" ? (
                      <div className={styles.pushError}>
                        <strong>Could not enable notifications.</strong>
                        <span>{pushState.message}</span>
                        <button type="button" className={styles.outlineButton} onClick={switchToEmailFallback}>
                          Use email instead
                        </button>
                      </div>
                    ) : pushState.status === "enabled" ? (
                      <div className={styles.pushEnabled}>
                        <strong>Notifications enabled. A test notification was sent.</strong>
                        <span>If you did not see it, check your notification settings. Real reminders will follow your schedule.</span>
                      </div>
                    ) : (
                      <>
                        {!vapidPublicKey ? (
                          <div className={styles.pushNotice}>
                            <strong>Push is not configured yet on the server.</strong>
                            <span>Add VAPID keys to send browser notifications. For now, email is still available as a fallback.</span>
                            <button type="button" className={styles.outlineButton} onClick={switchToEmailFallback}>
                              Use email instead
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.submitButton}
                            onClick={enableNotifications}
                            disabled={pushState.status === "requesting" || pushState.status === "testing"}
                          >
                            {pushState.status === "requesting"
                              ? "Asking for permission..."
                              : pushState.status === "testing"
                                ? "Sending test notification..."
                                : "Enable notifications"}
                          </button>
                        )}
                        <p className={styles.pushFallbackNote}>
                          Prefer email? <button type="button" className={styles.linkButton} onClick={switchToEmailFallback}>Use email instead</button>
                        </p>
                      </>
                    )}
                  </div>
                ) : null}

                {success.notificationChannel === "email" || success.notificationChannel === "both" || emailFallbackChosen ? (
                  <div
                    className={
                      success.welcomeEmailStatus === "sent"
                        ? styles.successEmailSent
                        : success.welcomeEmailStatus === "skipped"
                          ? styles.successEmailSkipped
                          : styles.successEmailWarning
                    }
                  >
                    <strong>
                      {success.welcomeEmailStatus === "sent"
                        ? "Welcome email sent now"
                        : success.welcomeEmailStatus === "skipped"
                          ? "Welcome email skipped"
                          : "Welcome email failed"}
                    </strong>
                    <span>
                      {success.welcomeEmailStatus === "sent"
                        ? "Email fallback active. The reminder will arrive in your inbox at the time you selected."
                        : success.welcomeEmailStatus === "skipped"
                          ? "Reminder saved. Email delivery is not configured, so you will not receive this nudge until email is set up."
                          : "Reminder saved, but the welcome email could not be sent. We will retry at the next reminder time."}
                    </span>
                  </div>
                ) : null}

                <dl className={styles.successDetails}>
                  <div><dt>Goal</dt><dd>{success.goal}</dd></div>
                  <div><dt>Do this first</dt><dd>{success.firstStep}</dd></div>
                  <div><dt>Reminder schedule</dt><dd>{formatSchedule(success.cadence, success.reminderTime)}</dd></div>
                  <div>
                    <dt>Channel</dt>
                    <dd>
                      {success.notificationChannel === "push" && !emailFallbackChosen
                        ? "Browser push (email as fallback)"
                        : "Email only"}
                    </dd>
                  </div>
                </dl>
                <Link href="/" className={styles.outlineButton}>Back to 100 Tools</Link>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label htmlFor="goal">What do you want to achieve?</label>
                  <textarea id="goal" required value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Example: Build 100 AI tools" maxLength={500} />
                </div>

                <div className={styles.field}>
                  <label htmlFor="why">Why does this goal matter?</label>
                  <textarea id="why" value={whyItMatters} onChange={(event) => setWhyItMatters(event.target.value)} placeholder="Example: I want to create multiple income streams" maxLength={500} />
                </div>

                <div className={styles.field}>
                  <label htmlFor="excuse">What usually stops you?</label>
                  <textarea id="excuse" value={excuse} onChange={(event) => setExcuse(event.target.value)} placeholder="Example: I overthink, scroll, and delay" maxLength={400} />
                </div>

                <div className={styles.field}>
                  <label htmlFor="firstStep">What is the smallest useful step?</label>
                  <textarea id="firstStep" value={firstStep} onChange={(event) => setFirstStep(event.target.value)} placeholder="Example: Open the project and create the next tool page" maxLength={400} />
                  <small>Keep it small enough to do in 5 to 15 minutes. Leave blank and we&apos;ll generate a simple rule-based first step.</small>
                </div>

                <div className={styles.inlineGrid}>
                  <div className={styles.field}>
                    <label htmlFor="cadence">Reminder frequency</label>
                    <select id="cadence" value={cadence} onChange={(event) => setCadence(event.target.value as ReminderCadence)}>
                      <option value="daily">Daily</option>
                      <option value="weekdays">Weekdays only</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="reminderTime">Reminder time</label>
                    <input id="reminderTime" type="time" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} required />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="timezone">Timezone</label>
                  <input id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
                </div>

                <div className={styles.field}>
                  <label>Tone</label>
                  <div className={styles.toneControl}>
                    <label className={styles.toneOption}>
                      <input type="radio" name="tone" value="normal" checked={tone === "normal"} onChange={() => setTone("normal")} />
                      <strong>Normal</strong>
                      <span>calm, direct, supportive.</span>
                    </label>
                    <label className={styles.toneOption}>
                      <input type="radio" name="tone" value="brutal" checked={tone === "brutal"} onChange={() => setTone("brutal")} />
                      <strong>Brutal</strong>
                      <span>honest, sharp, no-excuse accountability.</span>
                    </label>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="your@email.com" maxLength={254} />
                </div>

                <label className={styles.checkbox}>
                  <input type="checkbox" checked={reminderConsent} onChange={(event) => setReminderConsent(event.target.checked)} required />
                  <span>I want Brutal Reminder to send me check-in nudges for this goal. Primary channel is browser notifications, with email as a quiet fallback. I can pause or unsubscribe anytime.</span>
                </label>

                <label className={styles.checkbox}>
                  <input type="checkbox" checked={productUpdates} onChange={(event) => setProductUpdates(event.target.checked)} />
                  <span>I also want occasional updates about 100 Tools.</span>
                </label>

                <p className={styles.finePrint}>Privacy-first: we only store what is needed to send your reminders. Your goals are not public, not sold, and not used for advertising.</p>

                {error ? <div className={styles.error}>{error}</div> : null}

                {isSubmitting ? <p className={styles.submitHint}>Saving your reminder and sending the welcome email now.</p> : null}

                <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Activating..." : "Activate Reminder"}
                </button>
              </form>
            )}
          </div>

          <aside className={styles.previewCard} aria-label="Notification preview">
            <p className={styles.kicker}>Notification preview</p>
            <h2>The nudge before it finds you.</h2>

            {aiState.status === "loading" ? (
              <div className={styles.aiLoading} role="status" aria-live="polite">
                <span className={styles.aiPulse} />
                <span>Generating smarter reminder…</span>
              </div>
            ) : null}

            {aiState.status === "error" ? (
              <div className={styles.aiError}>
                <strong>AI is unavailable right now.</strong>
                <span>{aiState.message}</span>
              </div>
            ) : null}

            <div className={styles.emailPreview}>
              <div className={styles.emailSubject}>
                <span>Title</span>
                <strong>{previewTitle}</strong>
              </div>
              <div className={styles.emailBody}>{previewBody}</div>
              {aiState.status === "ready" && aiState.message.realityCheck ? (
                <div className={styles.aiRealityCheck}>
                  <span>Reality check</span>
                  <p>{aiState.message.realityCheck}</p>
                </div>
              ) : null}
              <div className={styles.previewMove}>
                <span>Today&apos;s move</span>
                <p>{previewStep}</p>
              </div>
              <div className={styles.previewButtons}>
                <span className={`${styles.previewButton} ${styles.done}`}>Done</span>
                <span className={`${styles.previewButton} ${styles.notYet}`}>Not yet</span>
                <span className={`${styles.previewButton} ${styles.snooze}`}>Snooze</span>
              </div>
            </div>

            <div className={styles.previewMeta}>
              {aiState.status === "ready" ? (
                <span className={styles.aiBadge}>
                  Personalized by {aiState.message.source === "ai" ? "AI" : "fallback rules"}
                </span>
              ) : (
                <span className={styles.aiBadgeMuted}>Using default reminder copy</span>
              )}
              <button
                type="button"
                className={styles.outlineButton}
                onClick={generateAIMessage}
                disabled={aiState.status === "loading" || !goal.trim()}
              >
                {aiState.status === "loading"
                  ? "Generating…"
                  : aiState.status === "ready"
                    ? "Regenerate message"
                    : "Generate smarter reminder"}
              </button>
            </div>
          </aside>
        </section>

        <section className={styles.privacyBand}>
          <div>
            <h2>Privacy-first promise</h2>
            <p>Your goal is private, stored only to send the reminder you asked for, and never used for advertising.</p>
          </div>
          <Link href="/brutal-reminder/privacy" className={styles.outlineButton}>Read Privacy</Link>
        </section>

        <section className={styles.phaseList} aria-label="Coming later">
          {["WhatsApp reminders", "Multiple goals", "Weekly accountability report", "Accountability partner", "Advanced reminder schedule"].map((item) => (
            <article className={styles.phaseItem} key={item}>
              <div className={styles.phaseBadge}>Coming later</div>
              <p>{item}</p>
            </article>
          ))}
        </section>

        <section className={styles.faq} aria-label="FAQ">
          {[
            ["Is this a normal reminder app?", "No. Normal reminders tell you not to forget. Brutal Reminder gives you one small action and asks if you actually did it."],
            ["Is my goal public?", "No. Your goal is private and only used to send your reminders."],
            ["Can I stop reminders?", "Yes. Every email includes pause and unsubscribe links."],
            ["Is the brutal tone insulting?", "No. It is direct, but it criticizes excuses and inaction, not the person."],
            ["Does it use WhatsApp?", "Not yet. WhatsApp reminders are coming later."],
            ["Is it free?", "Yes, the MVP is free."],
          ].map(([question, answer]) => (
            <article className={styles.faqItem} key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </section>

        <footer className={styles.footer}>
          <span>Brutal Reminder by 100 Tools</span>
          <Link href="/brutal-reminder/privacy" className={styles.secondaryLink}>Privacy</Link>
        </footer>
      </div>
      <SiteFooter />
    </main>
    </>
  );
}

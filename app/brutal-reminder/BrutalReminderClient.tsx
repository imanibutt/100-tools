"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateFirstStep, getPreviewText, getReminderSubject } from "@/lib/brutal-reminder/content";
import { formatSchedule } from "@/lib/brutal-reminder/time";
import type { ReminderCadence, ReminderTone } from "@/lib/brutal-reminder/types";
import styles from "./page.module.css";

const initialTime = "09:00";

type SuccessState = {
  goal: string;
  firstStep: string;
  cadence: ReminderCadence;
  reminderTime: string;
};

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

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(null);
    setIsSubmitting(true);

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
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not activate the reminder.");
      }

      setSuccess({
        goal: payload.goal,
        firstStep: payload.firstStep,
        cadence: payload.cadence,
        reminderTime: payload.reminderTime,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Brutal Reminder">
          <Link href="/" className={styles.brand}>
            <img src="/brutal-reminder-logo-dark.svg" alt="Brutal Reminder" className={styles.brandLogo} />
          </Link>
          <Link href="/" className={styles.backLink}>Back to 100 Tools</Link>
        </nav>

        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Set your goal. Take the small step. No excuses.</p>
            <h1 className={styles.title}>Your goal is not the problem. Your next step is.</h1>
            <p className={styles.subtitle}>
              Brutal Reminder turns one big goal into one small daily action and sends you honest
              accountability emails, without spam, noise, or fake motivation.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.primaryButton} type="button" onClick={scrollToForm}>
                Set Brutal Reminder
              </button>
              <span className={styles.microcopy}>Private by default. Email only. Stop anytime.</span>
            </div>
          </div>

          <aside className={styles.signalPanel} aria-label="Reminder signal">
            <p className={styles.monoLabel}>REALITY CHECK</p>
            <div className={styles.signalLine} />
            <div className={styles.signalMetric}><span>Goal</span><strong>One</strong></div>
            <div className={styles.signalMetric}><span>Action</span><strong>5-15 min</strong></div>
            <div className={styles.signalMetric}><span>Tracking</span><strong>Email only</strong></div>
          </aside>
        </section>

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
                <h3>Your brutal reminder is active.</h3>
                <p>We&apos;ll keep you focused on the small step, not just the big dream.</p>
                <dl>
                  <div><dt>Goal</dt><dd>{success.goal}</dd></div>
                  <div><dt>Today&apos;s first step</dt><dd>{success.firstStep}</dd></div>
                  <div><dt>Reminder schedule</dt><dd>{formatSchedule(success.cadence, success.reminderTime)}</dd></div>
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
                  <span>I want Brutal Reminder to email me the reminders and check-ins I set up. I understand these emails may include the goal and action text I enter, and I can pause or unsubscribe anytime.</span>
                </label>

                <label className={styles.checkbox}>
                  <input type="checkbox" checked={productUpdates} onChange={(event) => setProductUpdates(event.target.checked)} />
                  <span>I also want occasional updates about 100 Tools.</span>
                </label>

                <p className={styles.finePrint}>Privacy-first: we only store what is needed to send your reminders. Your goals are not public, not sold, and not used for advertising.</p>

                {error ? <div className={styles.error}>{error}</div> : null}

                <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Activating..." : "Activate Reminder"}
                </button>
              </form>
            )}
          </div>

          <aside className={styles.previewCard} aria-label="Reminder email preview">
            <p className={styles.kicker}>Email preview</p>
            <h2>The message before it hits your inbox.</h2>
            <div className={styles.emailPreview}>
              <div className={styles.emailSubject}>
                <span>Subject</span>
                <strong>{subject}</strong>
              </div>
              <div className={styles.emailBody}>{body}</div>
              <div className={styles.previewButtons}>
                <span className={`${styles.previewButton} ${styles.done}`}>Done</span>
                <span className={`${styles.previewButton} ${styles.notYet}`}>Not yet</span>
                <span className={`${styles.previewButton} ${styles.snooze}`}>Snooze</span>
              </div>
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
    </main>
  );
}

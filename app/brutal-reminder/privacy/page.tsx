import type { Metadata } from "next";
import Link from "next/link";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Brutal Reminder Privacy",
  description: "Simple privacy notes for Brutal Reminder by 100 Tools.",
  alternates: {
    canonical: "/brutal-reminder/privacy",
  },
};

export default function BrutalReminderPrivacyPage() {
  return (
    <main className={styles.resultPage}>
      <section className={styles.resultCard}>
        <p className={styles.kicker}>PRIVACY</p>
        <h1>Your goal is private.</h1>
        <p>
          Brutal Reminder only stores the information needed to send your reminders: email, goal,
          first step, reminder time, tone, and check-in status.
        </p>
        <p>Your goal is private.</p>
        <p>We do not sell your data.</p>
        <p>We do not use your goal for advertising.</p>
        <p>You can pause or stop reminders anytime.</p>
        <p>You can request deletion later by contacting us.</p>
        <div className={styles.resultActions}>
          <Link className={styles.outlineButton} href="/brutal-reminder">Back to Brutal Reminder</Link>
          <Link className={styles.outlineButton} href="/">Back to 100 Tools</Link>
        </div>
      </section>
    </main>
  );
}

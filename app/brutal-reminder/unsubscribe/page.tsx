import Link from "next/link";
import { updateReminderStatusByToken } from "@/lib/brutal-reminder/actions";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token
    ? await updateReminderStatusByToken(token, "stopped").catch(() => ({
        ok: false,
        message: "Unsubscribe links are not connected until Supabase environment variables are configured.",
      }))
    : { ok: false, message: "Missing token." };

  return (
    <main className={styles.resultPage}>
      <section className={styles.resultCard}>
        <p className={styles.kicker}>STOPPED</p>
        <h1>{result.ok ? "Your reminder is stopped." : "This unsubscribe link did not work."}</h1>
        <p>{result.ok ? "This goal will not receive more reminder emails." : result.message}</p>
        <div className={styles.resultActions}>
          <Link className={styles.outlineButton} href="/brutal-reminder">Create a new reminder</Link>
          <Link className={styles.outlineButton} href="/">Back to 100 Tools</Link>
        </div>
      </section>
    </main>
  );
}

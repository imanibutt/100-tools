import Link from "next/link";
import { recordCheckin } from "@/lib/brutal-reminder/actions";
import type { CheckinResponse } from "@/lib/brutal-reminder/types";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

const copy: Record<CheckinResponse, string> = {
  done: "Good. Evidence beats intention. One small step done consistently beats a big plan you never start.",
  not_yet:
    "Be honest, then move. Was it impossible, or did distraction win? Make the step smaller and do five minutes now.",
  snoozed: "Okay. You bought time, not escape. We'll remind you again later.",
};

const titles: Record<CheckinResponse, string> = {
  done: "Done recorded.",
  not_yet: "Not yet recorded.",
  snoozed: "Snoozed for 3 hours.",
};

function isResponse(value: string | undefined): value is CheckinResponse {
  return value === "done" || value === "not_yet" || value === "snoozed";
}

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; response?: string }>;
}) {
  const params = await searchParams;
  const response = isResponse(params.response) ? params.response : undefined;
  const token = params.token || "";
  const result =
    response && token
      ? await recordCheckin(token, response).catch(() => ({
          ok: false,
          message: "Check-ins are not connected until Supabase environment variables are configured.",
        }))
      : null;

  return (
    <main className={styles.resultPage}>
      <section className={styles.resultCard}>
        <p className={styles.kicker}>TODAY&apos;S MOVE</p>
        <h1>{result?.ok && response ? titles[response] : "Did you do the step?"}</h1>
        <p>{result?.ok && response ? "Your check-in was saved." : "No speeches. Just answer honestly."}</p>

        {result?.ok && response ? <p>{copy[response]}</p> : null}
        {result && !result.ok ? <p>{result.message}</p> : null}

        <div className={styles.resultActions}>
          <Link className={styles.outlineButton} href="/brutal-reminder">Set another reminder</Link>
          <Link className={styles.outlineButton} href="/">Back to 100 Tools</Link>
        </div>
      </section>
    </main>
  );
}

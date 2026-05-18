import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How 100 Tools handles reminder data, extraction requests, logs, and contact information.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "100 Tools Privacy Policy",
    description:
      "How 100 Tools handles reminder data, extraction requests, logs, and contact information.",
    url: "/privacy-policy",
    type: "article",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <SiteShell compact>
      <section className="doc-hero">
        <p className="site-kicker">Legal</p>
        <h1>Privacy Policy</h1>
        <p>
          100 Tools aims to collect the minimum information required to run the products people ask
          for. This page explains what is stored, why it is stored, and how reminder data is handled.
        </p>
      </section>

      <section className="doc-body">
        <article className="doc-section">
          <h2>1. Information you submit</h2>
          <p>
            Brutal Reminder stores the email address, goal text, reminder schedule, consent state,
            token hashes, and related delivery records needed to send the reminders you requested.
            100 Tools does not publish that content and does not sell it.
          </p>
        </article>

        <article className="doc-section">
          <h2>2. Extraction and utility requests</h2>
          <p>
            Tools such as BeDownloader process the URLs and request data needed to complete the task.
            Temporary logs or caches may exist for reliability, security, and performance, but the
            goal is to avoid collecting more data than the workflow needs.
          </p>
        </article>

        <article className="doc-section">
          <h2>3. Email providers and infrastructure</h2>
          <p>
            Reminder emails may be sent through Gmail SMTP or other mail infrastructure configured by
            the service. Data may also be stored in Supabase or equivalent infrastructure required to
            run the product reliably.
          </p>
        </article>

        <article className="doc-section">
          <h2>4. Cookies and local storage</h2>
          <p>
            The site may use functional cookies or local storage for preferences and reliability. If
            analytics or advertising are introduced later, this page and the cookie policy will be
            updated before those systems become active.
          </p>
        </article>

        <article className="doc-section">
          <h2>5. Retention and deletion</h2>
          <p>
            Reminder records are retained while the reminder is active and may remain in backups or
            logs for a limited period required for service operations. Deletion requests can be sent
            to the contact address listed on the site.
          </p>
        </article>
      </section>
    </SiteShell>
  );
}


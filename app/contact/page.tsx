import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact 100 Tools for product support, feedback, partnerships, or privacy requests.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact 100 Tools",
    description: "Contact 100 Tools for product support, feedback, partnerships, or privacy requests.",
    url: "/contact",
    type: "article",
  },
};

export default function ContactPage() {
  return (
    <SiteShell compact>
      <section className="doc-hero">
        <p className="site-kicker">Contact</p>
        <h1>Get in touch</h1>
        <p>
          Use the email below for support, bug reports, privacy requests, or partnership questions.
          During the current domain transition, replies may come from the temporary Gmail inbox.
        </p>
      </section>

      <section className="doc-body">
        <article className="doc-section">
          <h2>Support</h2>
          <p>
            Email <a href="mailto:hellobrutalreminder@gmail.com">hellobrutalreminder@gmail.com</a>{" "}
            with the tool name, page URL, and a short description of the issue.
          </p>
        </article>

        <article className="doc-section">
          <h2>What to include</h2>
          <p>
            For downloader issues, include the source URL and what result you expected. For Brutal
            Reminder issues, include the email used to sign up and the approximate time of the last
            reminder attempt.
          </p>
        </article>

        <article className="doc-section">
          <h2>Privacy and data requests</h2>
          <p>
            If you want a reminder deleted or need help with a suppression or unsubscribe state,
            send the request from the subscribed email address so it can be verified quickly.
          </p>
        </article>
      </section>
    </SiteShell>
  );
}


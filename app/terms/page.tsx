import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of use for 100 Tools, including BeDownloader, Brutal Reminder, and supporting site content.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "100 Tools Terms of Use",
    description:
      "Terms of use for 100 Tools, including BeDownloader, Brutal Reminder, and supporting site content.",
    url: "/terms",
    type: "article",
  },
};

export default function TermsPage() {
  return (
    <SiteShell compact>
      <section className="doc-hero">
        <p className="site-kicker">Legal</p>
        <h1>Terms of Use</h1>
        <p>
          These terms govern access to 100 Tools and its products, including BeDownloader,
          Brutal Reminder, and future utilities released under the same brand.
        </p>
      </section>

      <section className="doc-body">
        <article className="doc-section">
          <h2>1. Acceptable use</h2>
          <p>
            You agree to use the site and its tools only for lawful purposes. Do not abuse the
            downloader endpoints, attempt to bypass rate limits, interfere with infrastructure, or
            use the services in a way that harms third parties.
          </p>
        </article>

        <article className="doc-section">
          <h2>2. Third-party content</h2>
          <p>
            BeDownloader works with public Behance project URLs. You are responsible for respecting
            the rights of the original creator and the rules of the platform that hosts the content.
            Using the tool does not transfer ownership or create permission to reuse assets.
          </p>
        </article>

        <article className="doc-section">
          <h2>3. Reminder email service</h2>
          <p>
            Brutal Reminder sends emails only when you explicitly request them. You are responsible
            for the goal, action text, and email address you submit. Every reminder flow includes
            pause and unsubscribe controls.
          </p>
        </article>

        <article className="doc-section">
          <h2>4. Availability and changes</h2>
          <p>
            100 Tools is an actively evolving product set. Features may change, move, or be removed
            as products improve. We may limit or suspend access if a route is being abused or if an
            upstream provider changes its rules.
          </p>
        </article>

        <article className="doc-section">
          <h2>5. Warranty disclaimer</h2>
          <p>
            The tools are provided on an “as is” and “as available” basis. No guarantee is made that
            every route, extraction, or reminder flow will be uninterrupted or error-free. You use
            the services at your own risk.
          </p>
        </article>
      </section>
    </SiteShell>
  );
}


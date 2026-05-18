import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie and local storage policy for 100 Tools and its tool pages.",
  alternates: {
    canonical: "/cookie-policy",
  },
  openGraph: {
    title: "100 Tools Cookie Policy",
    description: "Cookie and local storage policy for 100 Tools and its tool pages.",
    url: "/cookie-policy",
    type: "article",
  },
};

export default function CookiePolicyPage() {
  return (
    <SiteShell compact>
      <section className="doc-hero">
        <p className="site-kicker">Legal</p>
        <h1>Cookie Policy</h1>
        <p>
          100 Tools keeps tracking light. This page explains the functional storage used today and
          how the policy will change if analytics or advertising are introduced later.
        </p>
      </section>

      <section className="doc-body">
        <article className="doc-section">
          <h2>Functional storage</h2>
          <p>
            The site may use local storage or essential cookies to keep the experience stable,
            remember simple preferences, and support product flows that would otherwise reset on
            every page load.
          </p>
        </article>

        <article className="doc-section">
          <h2>Analytics and diagnostics</h2>
          <p>
            Lightweight diagnostics or server-side logs may be used to understand failures, abuse,
            or route performance. If third-party analytics are added later, this page will be updated
            to explain what data is collected and how to control it.
          </p>
        </article>

        <article className="doc-section">
          <h2>Advertising cookies</h2>
          <p>
            Google AdSense or similar advertising systems are not active by default in the current
            temporary deployment. If advertising is enabled later, any required consent and policy
            details will be added before those cookies are used.
          </p>
        </article>
      </section>
    </SiteShell>
  );
}


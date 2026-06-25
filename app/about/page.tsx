import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "About",
  description: "About 100 Tools and the build-in-public approach behind the product roadmap.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About 100 Tools",
    description: "About 100 Tools and the build-in-public approach behind the product roadmap.",
    url: "/about",
    type: "article",
  },
};

export default function AboutPage() {
  return (
    <SiteShell compact>
      <section className="doc-hero doc-hero--centered">
        <span className="section-eyebrow">About</span>
        <h1 className="doc-hero-title">A small product lab. Useful tools. Built in public.</h1>
        <p className="doc-hero-lede">
          100 Tools is a founder-led product studio shipping focused AI tools for creators,
          operators, and builders. Each tool solves one real problem and stays simple to use.
        </p>
      </section>

      <section className="doc-body doc-body--grid">
        <article className="doc-card">
          <h2>What 100 Tools is</h2>
          <p>
            A small catalogue of focused products. Not a suite, not a platform — just useful
            tools that do one sharp job each.
          </p>
        </article>

        <article className="doc-card">
          <h2>How tools are built</h2>
          <p>
            Each tool starts with a real workflow, not a feature list. We ship the smallest
            version that solves the problem, then improve it from real usage.
          </p>
        </article>

        <article className="doc-card">
          <h2>Why small tools</h2>
          <p>
            Small tools stay fast, readable, and honest. They do one thing well instead of ten
            things badly. That is the whole reason this studio exists.
          </p>
        </article>

        <article className="doc-card">
          <h2>Built in public</h2>
          <p>
            The work is shared openly: what shipped, what failed, what changed. Public shipping
            keeps the roadmap grounded in reality and builds real trust with users.
          </p>
        </article>
      </section>

      <section className="doc-cta">
        <p>Try the current tools:</p>
        <div className="doc-cta-row">
          <Link href="/brutal-reminder" className="doc-cta-link">Brutal Reminder</Link>
          <Link href="/bedownloader" className="doc-cta-link">BeDownloader</Link>
          <Link href="/ats-cv-maker" className="doc-cta-link">ATS CV Maker</Link>
          <Link href="/humanpass" className="doc-cta-link">HumanPass</Link>
        </div>
      </section>
    </SiteShell>
  );
}


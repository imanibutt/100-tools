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
      <section className="doc-hero">
        <p className="site-kicker">About</p>
        <h1>100 Tools is a small product studio with a narrow rule: ship useful software.</h1>
        <p>
          The studio is building a public catalogue of focused tools for creators, developers, and
          operators. Each product is designed to solve one sharp problem with as little friction as
          possible.
        </p>
      </section>

      <section className="doc-body">
        <article className="doc-section">
          <h2>What gets built here</h2>
          <p>
            100 Tools focuses on products that can stay compact and fast: extractors, reminder
            systems, workflow accelerators, and practical utilities for repeat tasks.
          </p>
        </article>

        <article className="doc-section">
          <h2>Why it is public</h2>
          <p>
            Building in public is useful when it produces better products, clearer trust, and faster
            iteration. The goal is not performance marketing. The goal is to keep the work visible
            enough that improvements remain grounded in reality.
          </p>
        </article>

        <article className="doc-section">
          <h2>Current products</h2>
          <p>
            BeDownloader helps with public Behance asset extraction. Brutal Reminder turns goals
            into small daily actions with honest accountability emails. More focused tools will be
            added as the catalogue grows.
          </p>
          <p>
            Start with <Link href="/bedownloader">BeDownloader</Link> or{" "}
            <Link href="/brutal-reminder">Brutal Reminder</Link>.
          </p>
        </article>
      </section>
    </SiteShell>
  );
}


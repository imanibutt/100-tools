import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BlogCard } from "@/components/blog-card";
import { SiteShell } from "@/components/site-shell";
import { getAllBlogPosts } from "@/lib/blog";

const featuredPosts = getAllBlogPosts().slice(0, 3);

export const metadata: Metadata = {
  title: "100 Tools",
  description:
    "Focused tools for creators and developers. Explore BeDownloader, Brutal Reminder, the roadmap, and practical notes from building in public.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "100 Tools",
    description:
      "Focused tools for creators and developers. Explore BeDownloader, Brutal Reminder, the roadmap, and practical notes from building in public.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "100 Tools",
    url: "/",
    description:
      "Focused tools for creators and developers. Explore BeDownloader, Brutal Reminder, the roadmap, and practical notes from building in public.",
  };

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />

      <section className="home-hero">
        <div className="home-copy">
          <p className="site-kicker">Build in public</p>
          <h1>100 Tools</h1>
          <p className="home-lead">
            A growing toolkit for creators, operators, and developers. Every product is built to
            remove one real point of friction, not to add another dashboard.
          </p>
          <div className="home-actions">
            <Link href="/brutal-reminder" className="btn btn-primary">
              Open Brutal Reminder
            </Link>
            <Link href="/bedownloader" className="btn btn-secondary">
              Open BeDownloader
            </Link>
            <Link href="/blog" className="btn btn-secondary">
              Read the blog
            </Link>
          </div>
          <div className="home-trust">
            <span>Focused tools</span>
            <span>Minimal UI</span>
            <span>Privacy-first habits</span>
            <span>Built in public</span>
          </div>
        </div>

        <div className="home-visual">
          <div className="home-image-wrap">
            <Image
              src="/hero.png"
              alt="100 Tools cinematic hero"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 44vw"
              className="home-image"
            />
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="section-copy">
          <p className="site-kicker">Featured tools</p>
          <h2>Clear workflows. Small surfaces. No noise.</h2>
          <p>
            100 Tools is growing as a library of narrow, production-minded tools. The current live
            releases focus on asset extraction and daily accountability.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-tag">Live now</span>
            <h3>BeDownloader</h3>
            <p>
              Download public Behance assets in original quality. Fast extraction, clean naming,
              and predictable output for design research and reference work.
            </p>
            <Link href="/bedownloader" className="feature-link">
              Open tool
            </Link>
          </article>

          <article className="feature-card">
            <span className="feature-tag">Live now</span>
            <h3>Brutal Reminder</h3>
            <p>
              Turn a goal into one small action and get honest email check-ins with Done, Not yet,
              Snooze, Pause, and Unsubscribe controls.
            </p>
            <Link href="/brutal-reminder" className="feature-link">
              Open tool
            </Link>
          </article>

          <article className="feature-card feature-card-muted">
            <span className="feature-tag">Roadmap</span>
            <h3>What comes next</h3>
            <p>
              Future releases will stay narrow and utility-first: creator workflow tools, extractors,
              publishing helpers, and focused operator utilities.
            </p>
            <Link href="/about" className="feature-link">
              See the direction
            </Link>
          </article>
        </div>
      </section>

      <section className="site-section site-section-tight">
        <div className="section-copy">
          <p className="site-kicker">Build in public</p>
          <h2>Trust comes from shipping, not from promises.</h2>
          <p>
            The goal is simple: keep releasing tools that are small enough to stay fast, useful
            enough to earn repeat use, and transparent enough to improve in the open.
          </p>
        </div>
        <div className="notes-grid">
          <article className="note-card">
            <h3>Useful over broad</h3>
            <p>
              Every tool is scoped around a specific job-to-be-done. That keeps interfaces lean and
              makes product quality easier to maintain.
            </p>
          </article>
          <article className="note-card">
            <h3>Operational honesty</h3>
            <p>
              Shipping publicly means bugs, fixes, and improvements stay visible. The product gets
              better because the work is real, not hidden behind launch theatre.
            </p>
          </article>
          <article className="note-card">
            <h3>SEO with substance</h3>
            <p>
              The site content is being expanded with practical guides, tool explainers, and policy
              pages so growth comes from useful pages instead of thin search bait.
            </p>
          </article>
        </div>
      </section>

      <section className="site-section">
        <div className="section-copy">
          <p className="site-kicker">Latest notes</p>
          <h2>Practical writing for people who are still in the work.</h2>
          <p>
            The blog tracks accountability, productivity, AI tools, creator workflow, and what the
            100 Tools roadmap is learning as it ships.
          </p>
        </div>
        <div className="blog-grid">
          {featuredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}


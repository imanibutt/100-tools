import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BlogCard } from "@/components/blog-card";
import { getAllBlogPosts } from "@/lib/blog";

const featuredPosts = getAllBlogPosts().slice(0, 3);

export const metadata: Metadata = {
  title: "100 Tools — Building AI Tools in Public",
  description:
    "Follow the journey of building 100 AI-powered tools in public, from BeDownloader to Brutal Reminder and beyond.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "100 Tools — Building AI Tools in Public",
      description: "Follow the journey of building 100 AI-powered tools in public, from BeDownloader to Brutal Reminder and beyond.",
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
      "Follow the journey of building 100 AI-powered tools in public, from BeDownloader to Brutal Reminder and beyond.",
  };

  return (
    <div className="tools-home">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />

      <div className="tools-content">
        {/* Custom Premium Navbar */}
        <header className="tools-nav">
          <Link href="/" className="tools-brand">
            <Image
              src="/logo.svg"
              alt="100 Tools Logo"
              width={36}
              height={36}
              priority
              className="tools-brandmark"
            />
            <span>100 Tools</span>
          </Link>
          <nav className="tools-nav-links" style={{display: "flex", gap: "16px"}}>
                <Link href="/" className="tools-nav-link">Home</Link>
                <Link href="/bedownloader" className="tools-nav-link">BeDownloader</Link>
                <Link href="/brutal-reminder" className="tools-nav-link">Brutal Reminder</Link>
                <Link href="/blog" className="tools-nav-link">Blog</Link>
                <Link href="/about" className="tools-nav-link">About</Link>
                <Link href="/contact" className="tools-nav-link">Contact</Link>
              </nav>

        </header>

        {/* Premium Hero Section */}
        <section className="tools-hero">
          <div className="hero-text animate-fade-in">
            <span className="tools-kicker">BUILDING 100 AI TOOLS IN PUBLIC</span>
            <h1 className="tools-title">From Designer to Builder to Founder.</h1>
            <p className="tools-subtitle">
                I’m building 100 small AI-powered tools, one by one, to solve real problems, test real demand, and create useful digital products in public.
              </p>
            <div className="home-actions">
                              <a href="/" className="btn btn-primary">Explore Tools</a>
                <a href="/about" className="btn btn-secondary ml-4">Follow the Journey</a>
            </div>
          </div>

          {/* Hero visual removed for darker cinematic style */}
        </section>

        {/* Featured Tools Grid */}
        <section id="tools" className="tools-section">
          <h2 className="section-title">Clear workflows. Small surfaces. No noise.</h2>
          <div className="tools-grid">
            {/* Card 1: BeDownloader */}
            <Link href="/bedownloader" className="tool-card">
              <div className="tool-card-head">
                <span className="tool-card-tag">Live now</span>
                <div className="tool-icon">⚡</div>
              </div>
              <h3>BeDownloader</h3>
              <p>
                Download public Behance assets in original quality. Fast extraction, clean naming,
                and predictable output for design research and reference work.
              </p>
              <div className="tool-link">
                Open tool <span>&rarr;</span>
              </div>
            </Link>

            {/* Card 2: Brutal Reminder */}
            <Link href="/brutal-reminder" className="tool-card">
              <div className="tool-card-head">
                <span className="tool-card-tag">Live now</span>
                <div className="tool-icon">⏰</div>
              </div>
              <h3>Brutal Reminder</h3>
              <p>
                Turn a goal into one small action and get honest email check-ins with Done, Not yet,
                Snooze, Pause, and Unsubscribe controls.
              </p>
              <div className="tool-link">
                Open tool <span>&rarr;</span>
              </div>
            </Link>

            {/* Card 3: Roadmap */}
            <Link href="/about" className="tool-card">
              <div className="tool-card-head">
                <span
                  className="tool-card-tag"
                  style={{ color: "#94a3b8", background: "rgba(255, 255, 255, 0.05)" }}
                >
                  Roadmap
                </span>
                <div className="tool-icon">🚀</div>
              </div>
              <h3>What comes next</h3>
              <p>
                Future releases will stay narrow and utility-first: creator workflow tools, extractors,
                publishing helpers, and focused operator utilities.
              </p>
              <div className="tool-link">
                See the direction <span>&rarr;</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Build in Public Section */}
        <section className="tools-section">
          <h2 className="section-title">Trust comes from shipping, not from promises.</h2>
          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-icon">🎯</div>
              <h3>Useful over broad</h3>
              <p>
                Every tool is scoped around a specific job-to-be-done. That keeps interfaces lean and
                makes product quality easier to maintain.
              </p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">📢</div>
              <h3>Operational honesty</h3>
              <p>
                Shipping publicly means bugs, fixes, and improvements stay visible. The product gets
                better because the work is real, not hidden behind launch theatre.
              </p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">📈</div>
              <h3>SEO with substance</h3>
              <p>
                The site content is being expanded with practical guides, tool explainers, and policy
                pages so growth comes from useful pages instead of thin search bait.
              </p>
            </div>
          </div>
        </section>

        {/* Latest Notes Blog Grid */}
        <section className="tools-section">
          <h2 className="section-title">Practical writing for people who are still in the work.</h2>
          <div className="tools-grid">
            {featuredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* Custom Premium Footer */}
        <footer className="footer mt-16 pb-10">
          <div className="footer-top" />
          <div className="site-footer-grid">
            <p className="text-slate-400 text-sm">
              100 Tools builds small, useful products for creators and operators.
            </p>
            <div className="site-footer-links">
              <Link href="/about" className="footer-link">About</Link>
              <Link href="/contact" className="footer-link">Contact</Link>
              <Link href="/privacy-policy" className="footer-link">Privacy</Link>
              <Link href="/terms" className="footer-link">Terms</Link>
              <Link href="/cookie-policy" className="footer-link">Cookies</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

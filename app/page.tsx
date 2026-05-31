import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "100 Tools — Building AI Tools in Public",
  description:
    "Follow the journey of building 100 AI-powered tools in public, from BeDownloader to Brutal Reminder and beyond.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "100 Tools — Building AI Tools in Public",
    description:
      "Follow the journey of building 100 AI-powered tools in public, from BeDownloader to Brutal Reminder and beyond.",
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
        <header className="tools-nav">
          <Link href="/" className="tools-brand">
            <span className="tools-brandmark">100</span>
            <span>100 Tools</span>
          </Link>
          <nav className="tools-nav-links" aria-label="Primary">
            <Link href="/" className="tools-nav-link">Home</Link>
            <Link href="/bedownloader" className="tools-nav-link">BeDownloader</Link>
            <Link href="/brutal-reminder" className="tools-nav-link">Brutal Reminder</Link>
            <Link href="/blog" className="tools-nav-link">Blog</Link>
            <Link href="/about" className="tools-nav-link">About</Link>
            <Link href="/contact" className="tools-nav-link">Contact</Link>
          </nav>
        </header>

        <section className="tools-hero">
          <div className="hero-text animate-fade-in">
            <span className="tools-kicker">BUILDING 100 AI TOOLS IN PUBLIC</span>
            <h1 className="tools-title">Small tools for real internet work.</h1>
            <p className="tools-subtitle">
              100 Tools is a growing collection of focused products for creators,
              operators, and builders. Each tool starts with one clear job and ships
              with the boring parts handled.
            </p>
            <div className="home-actions">
              <Link href="/#tools" className="btn btn-primary">Explore Tools</Link>
              <Link href="/blog" className="btn btn-secondary">Follow the Journey</Link>
            </div>
            <div className="home-trust">
              <span>Live tools</span>
              <span>Public roadmap</span>
              <span>Practical product notes</span>
            </div>
          </div>
          <div className="hero-product-panel" aria-label="100 Tools product status">
            <div className="hero-panel-top">
              <span>Now shipping</span>
              <strong>2 / 100</strong>
            </div>
            <div className="hero-panel-list">
              <Link href="/brutal-reminder">
                <span className="hero-panel-index">01</span>
                <span>
                  <strong>Brutal Reminder</strong>
                  <small>Goal check-ins that do not flatter you.</small>
                </span>
              </Link>
              <Link href="/bedownloader">
                <span className="hero-panel-index">02</span>
                <span>
                  <strong>BeDownloader</strong>
                  <small>Clean Behance asset extraction for design research.</small>
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section id="tools" className="tools-section">
          <div className="section-copy">
            <span className="tools-kicker">TOOLS</span>
            <h2 className="section-title">Useful products, shipped one at a time.</h2>
          </div>
          <div className="tools-grid">
            <Link href="/brutal-reminder" className="tool-card">
              <div className="tool-card-head">
                <span className="tool-card-tag">Live now</span>
                <div className="tool-icon">BR</div>
              </div>
              <h3>Brutal Reminder</h3>
              <p>
                Turn a goal into one small action and get honest email check-ins with
                Done, Not yet, Snooze, Pause, and Unsubscribe controls.
              </p>
              <div className="tool-link">
                Open Brutal Reminder <span>&rarr;</span>
              </div>
            </Link>

            <Link href="/bedownloader" className="tool-card">
              <div className="tool-card-head">
                <span className="tool-card-tag">Live now</span>
                <div className="tool-icon">BD</div>
              </div>
              <h3>BeDownloader</h3>
              <p>
                Download public Behance assets in original quality. Fast extraction,
                clean naming, and predictable output for design reference work.
              </p>
              <div className="tool-link">
                Open BeDownloader <span>&rarr;</span>
              </div>
            </Link>
          </div>
        </section>

        <section className="tools-section build-public-section">
          <div className="build-public-copy">
            <span className="tools-kicker">BUILD IN PUBLIC</span>
            <h2 className="section-title">The project is the product record.</h2>
            <p>
              100 Tools is being built in public so the useful parts stay visible:
              what shipped, what broke, what got improved, and which ideas proved
              worth turning into real products.
            </p>
          </div>
          <div className="build-public-points">
            <div>
              <strong>Focused launches</strong>
              <span>Small surfaces, clear jobs, fast feedback.</span>
            </div>
            <div>
              <strong>Transparent notes</strong>
              <span>Product thinking, fixes, and lessons on the blog.</span>
            </div>
            <div>
              <strong>Compounding library</strong>
              <span>A public collection that gets more useful with each release.</span>
            </div>
          </div>
        </section>

        <footer className="footer mt-16 pb-10">
          <div className="footer-top" />
          <div className="site-footer-grid">
            <p className="text-slate-400 text-sm">
              100 Tools builds small, useful products for creators and operators.
            </p>
            <div className="site-footer-links">
              <Link href="/privacy-policy" className="footer-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-link">Terms</Link>
              <Link href="/cookie-policy" className="footer-link">Cookie Policy</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

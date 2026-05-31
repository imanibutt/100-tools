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
            <span className="tools-kicker">BUILD IN PUBLIC</span>
            <h1 className="tools-title">
              <span className="text-gradient">Small tools</span> for real internet work.
            </h1>
            <p className="tools-subtitle">
              A growing collection of focused AI-powered products for creators,
              operators, and builders. Each tool starts with one real problem and
              ships in public.
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

          <div className="hero-visual-dashboard" aria-label="100 Tools product dashboard">
            <div className="dashboard-glow" />
            <div className="dashboard-shell">
              <div className="dashboard-topbar">
                <div>
                  <span className="dashboard-eyebrow">100 Tools OS</span>
                  <strong>Product dashboard</strong>
                </div>
                <span className="dashboard-count">2 / 100 live</span>
              </div>

              <div className="dashboard-metrics" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="dashboard-tool-list">
                <Link href="/brutal-reminder" className="dashboard-tool-card dashboard-tool-card-reminder">
                  <span className="dashboard-tool-number">Tool 01</span>
                  <span className="dashboard-tool-icon dashboard-tool-icon-reminder">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                      <path d="M7 8h8M7 8v7M7 24v-9M7 24h8M25 8h-8M25 8v7M25 24v-9M25 24h-8" />
                      <path d="M11 17l4 4L24 10" />
                    </svg>
                  </span>
                  <span className="dashboard-tool-copy">
                    <strong>Brutal Reminder</strong>
                    <small>Goal check-ins that make action hard to dodge.</small>
                  </span>
                </Link>

                <Link href="/bedownloader" className="dashboard-tool-card dashboard-tool-card-download">
                  <span className="dashboard-tool-number">Tool 02</span>
                  <span className="dashboard-tool-icon dashboard-tool-icon-download">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                      <path d="M16 6v13" />
                      <path d="M10 14l6 6 6-6" />
                      <path d="M8 24h16" />
                      <path d="M7 8h5M20 8h5" />
                    </svg>
                  </span>
                  <span className="dashboard-tool-copy">
                    <strong>BeDownloader</strong>
                    <small>Extract public Behance assets for cleaner research.</small>
                  </span>
                </Link>
              </div>

              <div className="dashboard-footer">
                <span>Founder-led shipping log</span>
                <span>Next idea loading</span>
              </div>
            </div>
          </div>
        </section>

        <section id="tools" className="tools-section">
          <div className="section-copy">
            <span className="tools-kicker">TOOLS</span>
            <h2 className="section-title">Useful products, shipped one at a time.</h2>
          </div>
          <div className="tools-grid">
            <Link href="/brutal-reminder" className="tool-card tool-card-reminder">
              <div className="tool-card-head">
                <div className="tool-icon tool-icon-reminder">
                  <svg viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M7 8h8M7 8v7M7 24v-9M7 24h8M25 8h-8M25 8v7M25 24v-9M25 24h-8" />
                    <path d="M11 17l4 4L24 10" />
                  </svg>
                </div>
                <span className="tool-card-tag">Live now</span>
              </div>
              <span className="tool-card-number">Tool 01</span>
              <h3>Brutal Reminder</h3>
              <p>
                Turn a goal into one small action and get honest email check-ins with
                Done, Not yet, Snooze, Pause, and Unsubscribe controls.
              </p>
              <div className="tool-link">
                Open Brutal Reminder <span aria-hidden="true">&rarr;</span>
              </div>
            </Link>

            <Link href="/bedownloader" className="tool-card tool-card-download">
              <div className="tool-card-head">
                <div className="tool-icon tool-icon-download">
                  <svg viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M16 6v13" />
                    <path d="M10 14l6 6 6-6" />
                    <path d="M8 24h16" />
                    <path d="M7 8h5M20 8h5" />
                  </svg>
                </div>
                <span className="tool-card-tag">Live now</span>
              </div>
              <span className="tool-card-number">Tool 02</span>
              <h3>BeDownloader</h3>
              <p>
                Download public Behance assets in original quality. Fast extraction,
                clean naming, and predictable output for design reference work.
              </p>
              <div className="tool-link">
                Open BeDownloader <span aria-hidden="true">&rarr;</span>
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

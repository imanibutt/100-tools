import Link from "next/link";
import type { ReactNode } from "react";

export function SiteShell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <main className={compact ? "site-shell site-shell-compact" : "site-shell"}>
      <div className="site-shell-inner">
        <header className="site-header">
          <Link href="/" className="site-brand">
            <span className="site-brand-mark">100</span>
            <span>100 Tools</span>
          </Link>
          <nav className="site-nav" aria-label="Primary">
            <Link href="/">Home</Link>
            <Link href="/bedownloader">BeDownloader</Link>
            <Link href="/brutal-reminder">Brutal Reminder</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div className="site-footer-grid">
            <p>100 Tools builds small, useful products for creators and operators.</p>
            <div className="site-footer-links">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy-policy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/cookie-policy">Cookies</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

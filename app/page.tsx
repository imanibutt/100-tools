import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    absolute: '100 Tools'
  },
  description: 'Building 100 AI tools in public, one tool at a time.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: '100 Tools',
    description: 'Building 100 AI tools in public, one tool at a time.',
    url: '/',
    type: 'website'
  }
};

export default function Home() {
  return (
    <main className="container tools-home fade-in">
      <nav className="tools-nav" aria-label="100 Tools">
        <Link href="/" className="tools-brand">
          <span className="tools-brandmark">100</span>
          <span>100 Tools</span>
        </Link>
        <a
          href="https://github.com/imanibutt/Bedownloader"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
        >
          GitHub
        </a>
      </nav>

      <section className="tools-hero" aria-labelledby="home-title">
        <p className="tools-kicker">Build in public</p>
        <h1 id="home-title" className="tools-title">100 Tools</h1>
        <p className="tools-subtitle">Building 100 AI tools in public, one tool at a time.</p>
      </section>

      <section className="tools-section" aria-labelledby="tools-built-title">
        <div className="tools-section-head">
          <p className="tools-kicker">01 / 100</p>
          <h2 id="tools-built-title">Tools Built So Far</h2>
        </div>

        <article className="tool-card card">
          <div className="tool-card-count">Tool #1</div>
          <div className="tool-card-body">
            <h3>BeDownloader</h3>
            <p className="text-secondary">
              Download public Behance project assets in original quality.
            </p>
          </div>
          <Link href="/bedownloader" className="btn btn-primary">
            Open Tool
          </Link>
        </article>
      </section>

      <footer className="footer" style={{ marginTop: '120px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-secondary text-sm">
            © {new Date().getFullYear()} 100 Tools. Building in public.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="text-secondary hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="text-secondary hover:text-white transition-colors">Privacy</Link>
            <Link href="https://github.com/imanibutt/Bedownloader" target="_blank" className="text-secondary hover:text-white transition-colors">Source</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

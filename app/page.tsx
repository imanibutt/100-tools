'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function Home() {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardsRef.current) return;
      const cards = cardsRef.current.getElementsByClassName('tool-card');
      for (const card of cards as any) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="tools-home fade-in">
      <div className="tools-content">
        <nav className="tools-nav" aria-label="100 Tools">
          <Link href="/" className="tools-brand">
            <img src="/logo-transparent.png" alt="100 Tools Logo" className="tools-brandmark" />
            <span>100 Tools</span>
          </Link>
          <a
            href="https://github.com/imanibutt/Bedownloader"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            GitHub
          </a>
        </nav>

        <section className="tools-hero">
          <div className="hero-text">
            <p className="tools-kicker">Build in public</p>
            <h1 className="tools-title">Foundry for Creators</h1>
            <p className="tools-subtitle">
              We are building 100 high-performance utility tools for designers and developers. 
              Vetted, open-source, and free forever.
            </p>
            <Link href="#collection" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              Explore All Tools
            </Link>
          </div>
          
          <div className="hero-visual">
            <div className="visual-container">
              <img src="/hero.png" alt="Foundry Visual" className="visual-image" />
            </div>
          </div>
        </section>

        <section className="tools-section" id="collection">
          <h2 className="section-title">The Collection</h2>
          <div className="tools-grid" ref={cardsRef}>
            <Link href="/bedownloader" className="tool-card">
              <div className="tool-card-head">
                <div className="tool-icon">📦</div>
                <div className="tool-card-tag">Released</div>
              </div>
              <h3>BeDownloader</h3>
              <p>
                Professional asset extraction for Behance. Grab original quality images, 
                videos, and animations in seconds.
              </p>
              <div className="tool-link">
                Open Application <span>→</span>
              </div>
            </Link>

            <Link href="/brutal-reminder" className="tool-card">
              <div className="tool-card-head">
                <div className="tool-icon" aria-hidden="true">
                  <img src="/brutal-reminder-mark-transparent.svg" alt="" style={{ width: '30px', height: '30px' }} />
                </div>
                <div className="tool-card-tag">Tool #2</div>
              </div>
              <h3>Brutal Reminder</h3>
              <p>
                Turn one big goal into one small daily action. Get privacy-first
                accountability emails that ask if you actually did it.
              </p>
              <div className="tool-link">
                Open Tool <span>→</span>
              </div>
            </Link>

            <div className="tool-card" style={{ opacity: 0.6, cursor: 'default' }}>
              <div className="tool-card-head">
                <div className="tool-icon">🎨</div>
                <div className="tool-card-tag" style={{ color: '#94a3b8', background: 'rgba(148, 163, 184, 0.1)' }}>In Progress</div>
              </div>
              <h3>Dribbble Extractor</h3>
              <p>
                Advanced shot extraction with original resolution support. 
                Coming soon to the foundry.
              </p>
              <div className="tool-link" style={{ color: '#475569' }}>
                Coming Soon
              </div>
            </div>

            <div className="tool-card" style={{ opacity: 0.4, cursor: 'default' }}>
              <div className="tool-card-head">
                <div className="tool-icon">✨</div>
                <div className="tool-card-tag" style={{ color: '#94a3b8', background: 'rgba(148, 163, 184, 0.1)' }}>Planned</div>
              </div>
              <h3>Asset Optimizer</h3>
              <p>
                Lossless compression for extracted assets. Prepare your files for production 
                automatically.
              </p>
            </div>
          </div>
        </section>

        <footer className="footer" style={{ marginTop: '160px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '60px' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              <Link href="/" className="tools-brand" style={{ fontSize: '16px' }}>
                <img src="/logo-transparent.png" alt="100 Tools Logo" className="tools-brandmark" style={{ width: '24px', height: '24px', background: 'transparent', boxShadow: 'none' }} />
                <span>100 Tools</span>
              </Link>
              <p className="text-secondary text-sm mt-2">© {new Date().getFullYear()} Building in public.</p>
            </div>
            <div className="flex gap-8 text-sm">
              <Link href="/terms" className="text-secondary hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="text-secondary hover:text-white transition-colors">Privacy</Link>
              <a href="https://github.com/imanibutt/Bedownloader" target="_blank" rel="noreferrer" className="text-secondary hover:text-white transition-colors">Source</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

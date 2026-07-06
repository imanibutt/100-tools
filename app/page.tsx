import Link from "next/link";
import type { Metadata } from "next";
import { TopNav } from "@/components/top-nav";
import { ProductIcon } from "@/components/product-icons";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "100 Tools — Useful AI tools, built in public.",
  description:
    "A founder-led collection of focused AI tools for creators, operators, and builders.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "100 Tools — Useful AI tools, built in public.",
    description:
      "A founder-led collection of focused AI tools for creators, operators, and builders.",
    url: "/",
    type: "website",
  },
};

const TOOLS = [
  { accent: "invoice" as const, href: "/invoice-maker", name: "AI Invoice Maker" },
  { accent: "reminder" as const, href: "/brutal-reminder", name: "Brutal Reminder" },
  { accent: "download" as const, href: "/bedownloader", name: "BeDownloader" },
  { accent: "cv" as const, href: "/ats-cv-maker", name: "ATS CV Maker" },
  { accent: "humanpass" as const, href: "/humanpass", name: "HumanPass" },
];

export default function Home() {
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "100 Tools",
    url: "/",
    description:
      "A founder-led collection of focused AI tools for creators, operators, and builders.",
  };

  return (
    <div className="tools-home">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />

      <div className="tools-content">
        <TopNav variant="centered" />

        {/* ─── HERO (full viewport, Vanta FOG in root layout, text floats above) ─── */}
        <section className="home-hero">
          <div className="home-hero-center">
            <span className="home-hero-pill">
              <span className="home-hero-pill-dot" aria-hidden />
              100 tools in public
            </span>
            <h1 className="home-hero-title">
              Useful AI tools, built in public.
            </h1>
            <p className="home-hero-sub">
              Small focused tools for creators, operators, and builders.
            </p>
            <div className="home-hero-cta-row">
              <Link href="#tools" className="home-hero-cta">
                Explore tools
                <span className="arrow" aria-hidden>
                  →
                </span>
              </Link>
            </div>
            <div className="home-hero-scroll" aria-hidden>
              <span>5 tools live</span>
              <span className="home-hero-scroll-line" />
            </div>
          </div>
        </section>

        {/* ─── TOOLS DOCK (below the fold, minimal) ─── */}
        <section id="tools" className="home-tools-launcher">
          <div className="home-tools-launcher-row">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={"home-tool-chip home-tool-chip--" + t.accent}
                aria-label={t.name}
              >
                <span className="home-tool-chip-icon">
                  <ProductIcon accent={t.accent} />
                </span>
                <span className="home-tool-chip-name">{t.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}

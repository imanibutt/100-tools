import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact 100 Tools for product support, feedback, partnerships, or privacy requests.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact 100 Tools",
    description: "Contact 100 Tools for product support, feedback, partnerships, or privacy requests.",
    url: "/contact",
    type: "article",
  },
};

export default function ContactPage() {
  return (
    <SiteShell compact>
      <section className="doc-hero doc-hero--centered">
        <span className="section-eyebrow">Contact</span>
        <h1 className="doc-hero-title">Get in touch</h1>
        <p className="doc-hero-lede">
          Support, feedback, partnerships, or privacy requests — pick the channel that works
          best for you.
        </p>
      </section>

      <section className="doc-body doc-body--grid">
        <article className="doc-card doc-card--cta">
          <span className="doc-card-eyebrow">Fastest</span>
          <h2>WhatsApp</h2>
          <p>
            Message us directly on WhatsApp for quick questions, bug reports, or partnership
            ideas. Usually the fastest way to reach a real person.
          </p>
          <Link
            href="https://wa.me/9232387565050"
            target="_blank"
            rel="noreferrer"
            className="doc-card-button doc-card-button--whatsapp"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                fill="currentColor"
                d="M20.52 3.48A11.94 11.94 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12c0-3.19-1.25-6.19-3.48-8.52ZM12 21.82a9.8 9.8 0 0 1-5-1.37l-.36-.21l-3.67.96l.98-3.58l-.23-.37A9.82 9.82 0 1 1 21.82 12c0 5.42-4.4 9.82-9.82 9.82Zm5.39-7.36c-.3-.15-1.76-.87-2.03-.97c-.27-.1-.47-.15-.67.15c-.2.3-.77.97-.94 1.17c-.17.2-.35.22-.65.07c-.3-.15-1.26-.46-2.4-1.48c-.89-.79-1.49-1.77-1.66-2.07c-.17-.3-.02-.46.13-.61c.13-.13.3-.35.45-.52c.15-.17.2-.3.3-.5c.1-.2.05-.37-.02-.52c-.07-.15-.67-1.62-.92-2.22c-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37c-.27.3-1.04 1.02-1.04 2.49c0 1.47 1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.09 4.5c.71.31 1.27.49 1.7.63c.71.23 1.36.2 1.87.12c.57-.08 1.76-.72 2.01-1.41c.25-.7.25-1.29.17-1.41c-.07-.13-.27-.2-.57-.35Z"
              />
            </svg>
            Message on WhatsApp
          </Link>
        </article>

        <article className="doc-card">
          <span className="doc-card-eyebrow">Email</span>
          <h2>Support</h2>
          <p>
            Email{" "}
            <a href="mailto:hellobrutalreminder@gmail.com">
              hellobrutalreminder@gmail.com
            </a>{" "}
            for support, privacy requests, or partnership questions.
          </p>
        </article>

        <article className="doc-card">
          <span className="doc-card-eyebrow">Bugs</span>
          <h2>Bug reports</h2>
          <p>
            Include the tool name, page URL, and a short description of the issue. For
            downloader issues, add the source URL.
          </p>
        </article>

        <article className="doc-card">
          <span className="doc-card-eyebrow">Privacy</span>
          <h2>Data requests</h2>
          <p>
            Need a reminder deleted or an unsubscribe updated? Send the request from the
            subscribed email so it can be verified quickly.
          </p>
        </article>
      </section>
    </SiteShell>
  );
}


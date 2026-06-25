import Link from "next/link";

/**
 * 100 Tools shared site footer. One component, used by every page,
 * so the closing line of the site reads identically across surfaces.
 *
 * Renders the same grid the homepage already used but in a single
 * component. Optional `compact` mode for tool pages with a tighter
 * bottom margin.
 */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={"site-footer" + (compact ? " site-footer-compact" : "")}>
      <div className="site-footer-top" aria-hidden />
      <div className="site-footer-grid">
        <p className="site-footer-copy">
          100 Tools builds small, useful products for creators and operators.
        </p>
        <div className="site-footer-links">
          <Link href="/about" className="site-footer-link">
            About
          </Link>
          <Link href="/contact" className="site-footer-link">
            Contact
          </Link>
          <Link href="/privacy-policy" className="site-footer-link">
            Privacy
          </Link>
          <Link href="/terms" className="site-footer-link">
            Terms
          </Link>
          <Link href="/cookie-policy" className="site-footer-link">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}

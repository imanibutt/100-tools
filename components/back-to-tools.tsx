import Link from "next/link";

/**
 * Slim "← Back to 100 Tools" link rendered above the product lockup on
 * every tool page. Sits below the shared TopNav so users can always
 * return to the main site from any tool.
 */
export function BackToTools({ className }: { className?: string }) {
  return (
    <div className={"back-to-tools" + (className ? " " + className : "")}>
      <Link href="/" className="back-to-tools-link">
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden
          className="back-to-tools-arrow"
        >
          <path
            d="M10 3 L5 8 L10 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Back to 100 Tools</span>
      </Link>
    </div>
  );
}

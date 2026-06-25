import Link from "next/link";
import { ProductIcon, type ProductAccent } from "./product-icons";

export type ToolCardProps = {
  accent: ProductAccent;
  href: string;
  number: string;
  title: string;
  description: string;
  tag?: string;
  /** Compact variant (used in tool grid + dashboard). */
  compact?: boolean;
};

/**
 * 100 Tools shared tool card. The product surface for a single tool
 * in the homepage grid. Same DNA on every card: accent rail, icon
 * tile, number, title, description, CTA.
 */
export function ToolCard({
  accent,
  href,
  number,
  title,
  description,
  tag = "Live now",
  compact = false,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className={
        "tool-card tool-card--" +
        accent +
        " tool-card-component" +
        (compact ? " tool-card-component--compact" : "")
      }
    >
      <span className="tool-card-accent" aria-hidden />
      <div className="tool-card-head">
        <div className={"tool-icon tool-icon--" + accent}>
          <ProductIcon accent={accent} />
        </div>
        <span className="tool-card-tag">{tag}</span>
      </div>
      <span className="tool-card-number">{number}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="tool-link arrow-shift">
        <span>Open {title}</span>
        <span className="arrow" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}

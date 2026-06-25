import Link from "next/link";
import { ProductIcon, type ProductAccent } from "./product-icons";

export type DashboardCardProps = {
  accent: ProductAccent;
  href: string;
  number: string;
  title: string;
  description: string;
};

/**
 * 100 Tools shared dashboard card. Used in the homepage product
 * dashboard. Tighter than the homepage tool-card: number on the
 * left, icon tile, name + short description, and an arrow.
 */
export function DashboardCard({
  accent,
  href,
  number,
  title,
  description,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className={
        "dashboard-tool-card dashboard-tool-card-component dashboard-tool-card--" +
        accent
      }
    >
      <span className="dashboard-tool-number">{number}</span>
      <span className={"dashboard-tool-icon dashboard-tool-icon--" + accent}>
        <ProductIcon accent={accent} />
      </span>
      <span className="dashboard-tool-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="dashboard-tool-arrow arrow" aria-hidden>
        →
      </span>
    </Link>
  );
}

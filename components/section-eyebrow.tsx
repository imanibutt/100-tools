import type { ReactNode } from "react";

export type SectionEyebrowTone =
  | "blue"
  | "cyan"
  | "emerald"
  | "violet"
  | "red"
  | "white";

/**
 * 100 Tools section eyebrow — the small uppercase beat label that
 * names each section in the story (e.g. "THE OS", "TOOLS",
 * "SHIPPING LOG", "PRODUCT 01"). Same shape on every page so the
 * reader knows where they are in the page.
 *
 * Pure presentational. Renders a styled <span> with optional leading
 * dot and children.
 */
export function SectionEyebrow({
  tone = "white",
  withDot = true,
  children,
  className,
}: {
  tone?: SectionEyebrowTone;
  withDot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={
        "section-eyebrow" +
        (tone ? " section-eyebrow--" + tone : "") +
        (className ? " " + className : "")
      }
    >
      {withDot ? <span className="eyebrow-dot" aria-hidden /> : null}
      {children}
    </span>
  );
}

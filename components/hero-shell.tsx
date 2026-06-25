import type { ReactNode } from "react";
import { SectionEyebrow, type SectionEyebrowTone } from "./section-eyebrow";

export type HeroAtmosAccent = SectionEyebrowTone;

export type HeroShellProps = {
  /** The section eyebrow (e.g. "THE OS", "PRODUCT 01"). */
  eyebrow?: string;
  /** Accent tone for the eyebrow and atmospheric glow. */
  accent?: HeroAtmosAccent;
  /** Whether to show a leading dot inside the eyebrow. */
  eyebrowWithDot?: boolean;
  /** Main headline. The first <span> child becomes the accent gradient. */
  title: ReactNode;
  /** Sub-headline / lede paragraph. */
  lede?: ReactNode;
  /** CTA row. */
  actions?: ReactNode;
  /** Trust line / status row below the CTAs. */
  trust?: ReactNode;
  /** Content rendered above the eyebrow (e.g. ProductMark). */
  above?: ReactNode;
  /** Children rendered below the lede/actions/trust block. */
  children?: ReactNode;
  /** Center-align everything. */
  centered?: boolean;
  /** Compact spacing for small tool pages. */
  compact?: boolean;
  className?: string;
};

/**
 * 100 Tools shared hero shell. The same vertical structure on every
 * page:
 *   [above slot]            <- e.g. <ProductMark>
 *   [eyebrow]               <- section beat label
 *   [title]                 <- display headline
 *   [lede]                  <- sub-headline
 *   [actions]               <- CTAs
 *   [trust]                 <- trust / status row
 *   [children]              <- extra content below the hero
 *
 * Use as the wrapper for every page-level hero so all pages feel
 * like part of the same story.
 */
export function HeroShell({
  eyebrow,
  accent = "white",
  eyebrowWithDot = true,
  title,
  lede,
  actions,
  trust,
  above,
  children,
  centered = false,
  compact = false,
  className,
}: HeroShellProps) {
  return (
    <section
      className={
        "hero-shell" +
        (compact ? " hero-shell--compact" : "") +
        (centered ? " hero-shell--centered" : "") +
        (accent ? " hero-atmos hero-atmos--" + accent : "") +
        (className ? " " + className : "")
      }
    >
      {above ? <div className="hero-shell-above">{above}</div> : null}
      {eyebrow ? (
        <SectionEyebrow tone={accent} withDot={eyebrowWithDot}>
          {eyebrow}
        </SectionEyebrow>
      ) : null}
      <h1 className="hero-shell-title">{title}</h1>
      {lede ? <p className="hero-shell-lede">{lede}</p> : null}
      {actions ? <div className="hero-shell-actions">{actions}</div> : null}
      {trust ? <div className="hero-shell-trust">{trust}</div> : null}
      {children ? <div className="hero-shell-children">{children}</div> : null}
    </section>
  );
}

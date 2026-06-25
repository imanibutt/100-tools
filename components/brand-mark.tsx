type BrandMarkProps = {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "auto" | "light" | "dark";
  className?: string;
};

const INNER_PX: Record<NonNullable<BrandMarkProps["size"]>, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 88,
};

type BrandLockupProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const LOCKUP_TEXT_PX: Record<NonNullable<BrandLockupProps["size"]>, number> = {
  sm: 16,
  md: 22,
  lg: 32,
};

const LOCKUP_MARK_PX: Record<NonNullable<BrandLockupProps["size"]>, number> = {
  sm: 32,
  md: 44,
  lg: 64,
};

/**
 * 100 Tools brand mark — "Tool Platform".
 *
 * A bold rounded dark tile holding a stylised "100":
 *   • The "1" is a thick vertical module bar with a triangular cap on top.
 *   • The two "0"s are hollow rounded-square app modules, each with an
 *     inner accent dot, linked by a thick connector line — a tiny
 *     system grid that reads as "100 tools connected".
 *   • Two faint grid lines behind the modules reinforce the "system" feel.
 *   • A small accent spark in the top-right corner signals
 *     "build-in-public".
 *
 * Designed to read clearly at nav size — every stroke is >= 3.0 px and the
 * fill is a strong three-stop gradient (blue → emerald → violet) that
 * echoes the per-product accent palette.
 */
export function BrandMark({
  size = "sm",
  tone = "auto",
  className,
}: BrandMarkProps) {
  const inner = INNER_PX[size];
  return (
    <span
      className={"brand-mark" + (className ? " " + className : "")}
      data-size={size}
      data-tone={tone}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        width={inner}
        height={inner}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="100 Tools"
      >
        <defs>
          <linearGradient
            id="bmBg"
            x1="4"
            y1="4"
            x2="44"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#0B1220" />
            <stop offset="0.55" stopColor="#111827" />
            <stop offset="1" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient
            id="bmFg"
            x1="6"
            y1="12"
            x2="42"
            y2="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#60A5FA" />
            <stop offset="0.55" stopColor="#34D399" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
          <linearGradient
            id="bmRing"
            x1="0"
            y1="0"
            x2="48"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="rgba(255,255,255,0.30)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
          <linearGradient
            id="bmModA"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor="rgba(96,165,250,0.22)" />
            <stop offset="1" stopColor="rgba(96,165,250,0.06)" />
          </linearGradient>
          <linearGradient
            id="bmModB"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor="rgba(167,139,250,0.22)" />
            <stop offset="1" stopColor="rgba(167,139,250,0.06)" />
          </linearGradient>
        </defs>

        {/* tile — stronger outer ring for more confident nav presence */}
        <rect
          x="1.5"
          y="1.5"
          width="45"
          height="45"
          rx="12.5"
          fill="url(#bmBg)"
          stroke="url(#bmRing)"
          strokeWidth="1.8"
        />

        {/* faint system grid behind the modules */}
        <line
          x1="3"
          y1="24"
          x2="45"
          y2="24"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        <line
          x1="24"
          y1="3"
          x2="24"
          y2="45"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        {/* "1" — bold vertical module bar with a triangular cap */}
        <path
          d="M7 14 L13 11.5 V36"
          fill="none"
          stroke="url(#bmFg)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* "0" left — hollow rounded-square app module (blue accent) */}
        <rect
          x="16.5"
          y="13.5"
          width="9"
          height="21"
          rx="2.8"
          fill="url(#bmModA)"
          stroke="url(#bmFg)"
          strokeWidth="3.4"
        />
        <circle cx="21" cy="24" r="1.7" fill="url(#bmFg)" />

        {/* "0" right — hollow rounded-square app module (violet accent) */}
        <rect
          x="29.5"
          y="13.5"
          width="9"
          height="21"
          rx="2.8"
          fill="url(#bmModB)"
          stroke="url(#bmFg)"
          strokeWidth="3.4"
        />
        <circle cx="34" cy="24" r="1.7" fill="url(#bmFg)" />

        {/* bold connector between modules — linked apps */}
        <line
          x1="26"
          y1="24"
          x2="29"
          y2="24"
          stroke="url(#bmFg)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* accent spark — build-in-public dot */}
        <circle cx="40.5" cy="9.5" r="2.2" fill="#34D399" />
      </svg>
    </span>
  );
}

/**
 * 100 Tools brand lockup — the bold mark alongside the "100 Tools"
 * wordmark. Used on the homepage hero and page-level headers where the
 * standalone mark would be too small to carry the brand.
 */
export function BrandLockup({
  size = "md",
  className,
}: BrandLockupProps) {
  const markPx = LOCKUP_MARK_PX[size];
  const textPx = LOCKUP_TEXT_PX[size];
  return (
    <span
      className={"brand-lockup" + (className ? " " + className : "")}
      data-size={size}
      aria-label="100 Tools"
    >
      <BrandMark size={size === "lg" ? "lg" : size === "md" ? "md" : "sm"} />
      <span
        className="brand-lockup-text"
        style={{ fontSize: `${textPx}px`, lineHeight: 1 }}
      >
        <span className="brand-lockup-name">100 Tools</span>
      </span>
      {/* visually-hidden but accessible name on the wrapper already
          provides the aria-label; the inline svg keeps its own. */}
      <style>{`
        .brand-lockup { display: inline-flex; align-items: center; gap: ${Math.round(
          markPx * 0.34
        )}px; }
      `}</style>
    </span>
  );
}

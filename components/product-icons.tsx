export type ProductAccent = "reminder" | "download" | "cv" | "humanpass";

type ProductIconProps = {
  accent: ProductAccent;
  className?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Larger product lockup — bold product mark + wordmark, used on each
 * tool's own page header. Renders the inline SVG icons (cv, humanpass)
 * at a larger size and pairs them with a strong wordmark.
 */
type ProductMarkProps = {
  accent: ProductAccent;
  name?: string;
  size?: "md" | "lg";
  className?: string;
};

const PRODUCT_NAME: Record<ProductAccent, string> = {
  cv: "ATS CV Maker",
  humanpass: "HumanPass",
  download: "BeDownloader",
  reminder: "Brutal Reminder",
};

const PRODUCT_MARK_PX = { md: 48, lg: 64 } as const;
const PRODUCT_TEXT_PX = { md: 22, lg: 30 } as const;

/**
 * Product marks used in the top nav, mobile drawer, homepage dashboard,
 * and homepage tools grid.
 *
 * - `download` (BeDownloader) and `reminder` (Brutal Reminder) use the
 *   actual brand assets that already live in /public — `/logo.svg` and
 *   `/symbol mark 2.png` respectively. They are loaded through <img>
 *   with object-fit: contain so the original brand design is preserved
 *   everywhere the product appears.
 * - `cv` (ATS CV Maker) and `humanpass` (HumanPass) are new inline SVG
 *   marks — they have no existing brand asset yet.
 */
export function ProductIcon({ accent, className }: ProductIconProps) {
  const baseCls = className ? " " + className : "";

  switch (accent) {
    case "download":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.svg"
          alt="BeDownloader"
          className={"product-image" + baseCls}
          data-accent="download"
        />
      );

    case "reminder":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/symbol%20mark%202.png"
          alt="Brutal Reminder"
          className={"product-image" + baseCls}
          data-accent="reminder"
        />
      );

    case "cv":
      return (
        <svg
          viewBox="0 0 32 32"
          className={"product-icon" + baseCls}
          data-accent="cv"
          aria-hidden
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="cvDoc"
              x1="6"
              y1="4"
              x2="23"
              y2="26"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="currentColor" stopOpacity="0.10" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* ATS scan beam (faint vertical stripe to the left of the doc) */}
          <path
            d="M3.5 6 L6 8 M3.5 12 L6 12 M3.5 18 L6 16"
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeLinecap="round"
          />

          {/* document body */}
          <rect
            x="6.5"
            y="4.5"
            width="16"
            height="22"
            rx="2.6"
            fill="url(#cvDoc)"
            stroke="currentColor"
            strokeWidth="1.6"
          />

          {/* scan-line text content */}
          <path
            d="M10 10h9M10 14h9M10 18h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* AI sparkle top-right */}
          <path
            d="M26 4.5 L27 7 L29.5 8 L27 9 L26 11.5 L25 9 L22.5 8 L25 7 Z"
            fill="currentColor"
          />

          {/* green check-seal badge bottom-right */}
          <circle cx="23.5" cy="24" r="5" fill="currentColor" />
          <path
            d="M21.2 24.1 L23 25.8 L25.9 22.6"
            stroke="#052E1B"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );

    case "humanpass":
      return (
        <svg
          viewBox="0 0 32 32"
          className={"product-icon" + baseCls}
          data-accent="humanpass"
          aria-hidden
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="hpPen"
              x1="18"
              y1="3"
              x2="28"
              y2="14"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#A78BFA" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
          </defs>

          {/* fountain pen body — tilted */}
          <g transform="rotate(-32 18 13)">
            <rect
              x="16"
              y="3"
              width="4"
              height="14"
              rx="1.2"
              fill="url(#hpPen)"
            />
            {/* nib */}
            <path d="M18 17 L15 23 L21 23 Z" fill="#7C3AED" />
            {/* nib slit */}
            <path
              d="M18 19 L18 22"
              stroke="#EDE9FE"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            {/* cap line */}
            <rect
              x="15.4"
              y="3"
              width="5.2"
              height="2.6"
              rx="0.8"
              fill="#5B21B6"
            />
          </g>

          {/* flowing handwriting curve */}
          <path
            d="M3.5 24.5 C 7 22, 10 26, 13 24 S 19 22, 22.5 24.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* the humanised "smile" arc + dot at the end of the curve */}
          <path
            d="M21.5 27 q 1.6 -1.8 3.2 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="28.5" cy="21" r="1.4" fill="currentColor" />

          {/* sparkle (AI source element being rewritten) */}
          <path
            d="M27.5 7 L28.4 8.7 L30.1 9.6 L28.4 10.5 L27.5 12.2 L26.6 10.5 L24.9 9.6 L26.6 8.7 Z"
            fill="#C4B5FD"
          />
        </svg>
      );
  }
}

/**
 * Larger product lockup used on each tool's own page header. Renders the
 * inline SVG mark (cv, humanpass) at a larger size and pairs it with a
 * strong wordmark in the matching accent color.
 *
 * - `cv` and `humanpass` render their inline SVG marks here.
 * - `download` and `reminder` would render their brand assets via <img>
 *   but for the page header lockup, we prefer the inline SVG so the
 *   page header doesn't fight with the brand assets already used on the
 *   product's own landing hero (those stay as-is).
 */
export function ProductMark({
  accent,
  name,
  size = "md",
  className,
}: ProductMarkProps) {
  const px = PRODUCT_MARK_PX[size];
  const textPx = PRODUCT_TEXT_PX[size];
  const displayName = name ?? PRODUCT_NAME[accent];
  return (
    <span
      className={"product-mark" + (className ? " " + className : "")}
      data-accent={accent}
      data-size={size}
      aria-label={displayName}
    >
      <span
        className="product-mark-symbol"
        style={{ width: px, height: px }}
      >
        <ProductIcon accent={accent} />
      </span>
      <span
        className="product-mark-text"
        style={{ fontSize: `${textPx}px`, lineHeight: 1 }}
      >
        {displayName}
      </span>
    </span>
  );
}

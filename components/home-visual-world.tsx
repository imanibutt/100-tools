/**
 * 100 Tools HomeVisualWorld — the "midnight tool observatory" centerpiece.
 *
 * A cohesive, intentional composition that sits behind the hero copy:
 *   - A soft central "island" glow (the observatory core)
 *   - 3 faint orbital rings around the core
 *   - 4 tool nodes in the 4 brand accent colors, positioned at the
 *     4 cardinal-diagonal points of the outer ring
 *   - 2 very faint organic silhouettes in the corners (abstract
 *     digital flowers / crystals, barely visible — just texture)
 *   - A subtle "horizon" fog at the bottom for depth
 *
 * Pure inline SVG. No images, no JS, no external requests, no npm
 * packages. The nodes have a very subtle twinkle (opacity animation,
 * GPU-friendly, respects prefers-reduced-motion).
 */
export function HomeVisualWorld() {
  return (
    <div className="home-visual-world" aria-hidden="true">
      <svg
        className="home-visual-svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Central island glow — white at the core, fading through
              blue and violet to transparent. */}
          <radialGradient id="islandGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
            <stop offset="22%" stopColor="rgba(147,197,253,0.22)" />
            <stop offset="55%" stopColor="rgba(139,92,246,0.10)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Per-node glow gradients (the 4 tool accents) */}
          <radialGradient id="nodeRed" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCA5A5" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#FCA5A5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nodeCyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#7DD3FC" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nodeEmerald" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#6EE7B7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nodeViolet" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#C4B5FD" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Organic silhouettes — very faint, in the deep background */}
        <g className="home-visual-organics">
          {/* Top-left abstract flower (5 overlapping petals) */}
          <g opacity="0.10" fill="rgba(96,165,250,0.55)">
            <circle cx="120" cy="120" r="42" />
            <circle cx="88" cy="156" r="36" />
            <circle cx="152" cy="156" r="36" />
            <circle cx="105" cy="178" r="30" />
            <circle cx="135" cy="178" r="30" />
            <circle cx="120" cy="138" r="16" fill="rgba(255,255,255,0.25)" />
          </g>
          {/* Bottom-right abstract crystal (concentric circles) */}
          <g opacity="0.10" fill="rgba(167,139,250,0.50)">
            <circle cx="1080" cy="680" r="56" />
            <circle cx="1080" cy="680" r="40" />
            <circle cx="1080" cy="680" r="24" />
            <circle cx="1080" cy="680" r="10" fill="rgba(255,255,255,0.20)" />
          </g>
          {/* Mid-right faint petal cluster */}
          <g opacity="0.07" fill="rgba(52,211,153,0.50)">
            <circle cx="1130" cy="380" r="28" />
            <circle cx="1108" cy="404" r="22" />
            <circle cx="1152" cy="404" r="22" />
          </g>
        </g>

        {/* Central island glow */}
        <circle
          className="home-visual-island"
          cx="600"
          cy="400"
          r="220"
          fill="url(#islandGlow)"
        />

        {/* Orbital rings — very faint, concentric ellipses */}
        <g className="home-visual-orbits" fill="none">
          <ellipse
            cx="600"
            cy="400"
            rx="260"
            ry="78"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.8"
          />
          <ellipse
            cx="600"
            cy="400"
            rx="360"
            ry="108"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.8"
          />
          <ellipse
            cx="600"
            cy="400"
            rx="460"
            ry="138"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.8"
          />
        </g>

        {/* Tool nodes — 4 brand accents on the outer ring at 45°/135°/225°/315° */}
        <g className="home-visual-nodes">
          {/* BR (red) — top-left */}
          <g className="home-visual-node home-visual-node--br">
            <circle cx="303" cy="312" r="22" fill="url(#nodeRed)" />
            <circle cx="303" cy="312" r="3.5" fill="#FCA5A5" />
          </g>
          {/* BE (cyan) — top-right */}
          <g className="home-visual-node home-visual-node--be">
            <circle cx="897" cy="312" r="22" fill="url(#nodeCyan)" />
            <circle cx="897" cy="312" r="3.5" fill="#7DD3FC" />
          </g>
          {/* ATS (emerald) — bottom-left */}
          <g className="home-visual-node home-visual-node--ats">
            <circle cx="303" cy="488" r="22" fill="url(#nodeEmerald)" />
            <circle cx="303" cy="488" r="3.5" fill="#6EE7B7" />
          </g>
          {/* HP (violet) — bottom-right */}
          <g className="home-visual-node home-visual-node--hp">
            <circle cx="897" cy="488" r="22" fill="url(#nodeViolet)" />
            <circle cx="897" cy="488" r="3.5" fill="#C4B5FD" />
          </g>
        </g>
      </svg>

      {/* Subtle horizon fog at the bottom — suggests depth */}
      <div className="home-visual-horizon" />
    </div>
  );
}

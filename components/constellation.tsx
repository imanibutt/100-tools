/**
 * 100 Tools "Constellation" — decorative CSS-only layer that visually
 * connects the four tool nodes with faint dotted lines, sitting behind
 * the product dashboard or the /about page hero. Pure SVG, no JS, no
 * image asset, no external dependency.
 *
 * This is the "tool constellation" metaphor that makes the homepage
 * feel like a small tools operating system instead of a feature grid.
 *
 * Use as:
 *   <Constellation />           // 4 nodes, default spacing
 *   <Constellation compact />   // smaller, for about page
 */
export function Constellation({ compact = false }: { compact?: boolean }) {
  const size = compact ? 320 : 480;
  const nodeR = compact ? 10 : 14;
  return (
    <svg
      className={"constellation" + (compact ? " constellation--compact" : "")}
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="constellationGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(96, 165, 250, 0.40)" />
          <stop offset="60%" stopColor="rgba(96, 165, 250, 0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* central glow */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.42}
        fill="url(#constellationGlow)"
      />

      {/* connecting dotted lines (rendered first so they sit under nodes) */}
      <g className="constellation-lines" strokeWidth="1" fill="none">
        <line x1={size * 0.18} y1={size * 0.30} x2={size * 0.82} y2={size * 0.30} />
        <line x1={size * 0.18} y1={size * 0.30} x2={size * 0.30} y2={size * 0.78} />
        <line x1={size * 0.82} y1={size * 0.30} x2={size * 0.70} y2={size * 0.78} />
        <line x1={size * 0.30} y1={size * 0.78} x2={size * 0.70} y2={size * 0.78} />
        <line x1={size * 0.50} y1={size * 0.50} x2={size * 0.18} y2={size * 0.30} />
        <line x1={size * 0.50} y1={size * 0.50} x2={size * 0.82} y2={size * 0.30} />
        <line x1={size * 0.50} y1={size * 0.50} x2={size * 0.30} y2={size * 0.78} />
        <line x1={size * 0.50} y1={size * 0.50} x2={size * 0.70} y2={size * 0.78} />
      </g>

      {/* 4 outer tool nodes + 1 center node */}
      <g className="constellation-nodes">
        {/* BR (top-left) — red */}
        <circle
          className="constellation-node constellation-node--red"
          cx={size * 0.18}
          cy={size * 0.30}
          r={nodeR}
        />
        {/* BE (top-right) — cyan */}
        <circle
          className="constellation-node constellation-node--cyan"
          cx={size * 0.82}
          cy={size * 0.30}
          r={nodeR}
        />
        {/* ATS (bottom-left) — emerald */}
        <circle
          className="constellation-node constellation-node--emerald"
          cx={size * 0.30}
          cy={size * 0.78}
          r={nodeR}
        />
        {/* HP (bottom-right) — violet */}
        <circle
          className="constellation-node constellation-node--violet"
          cx={size * 0.70}
          cy={size * 0.78}
          r={nodeR}
        />
        {/* center — 100 Tools */}
        <circle
          className="constellation-node constellation-node--center"
          cx={size * 0.50}
          cy={size * 0.50}
          r={nodeR * 1.2}
        />
      </g>
    </svg>
  );
}

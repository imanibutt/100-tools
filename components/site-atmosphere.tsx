/**
 * 100 Tools SiteAtmosphere — deep cinematic background.
 *
 * Sits behind the HomeVisualWorld centerpiece. Provides depth and mood:
 *   - Deep navy base
 *   - 3 soft drifting gradient waves (blue, emerald, violet)
 *   - 1 violet/blue nebula cloud in the top-right corner
 *   - 60 tiny stars (deterministic, no client randomness)
 *
 * Pure CSS + inline SVG. No images, no JS, no external requests, no
 * npm packages. Animations are GPU-accelerated (transform only) and
 * respect prefers-reduced-motion.
 */
export function SiteAtmosphere() {
  return (
    <div className="site-atmosphere" aria-hidden="true">
      {/* Deep navy base */}
      <div className="site-atmosphere-base" />

      {/* Nebula cloud — adds depth in one corner */}
      <div className="site-atmosphere-nebula" />

      {/* Soft animated gradient waves */}
      <div className="site-atmosphere-wave site-atmosphere-wave--blue" />
      <div className="site-atmosphere-wave site-atmosphere-wave--emerald" />
      <div className="site-atmosphere-wave site-atmosphere-wave--violet" />

      {/* Tiny dust / star layer */}
      <svg
        className="site-atmosphere-stars"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 60 }).map((_, i) => {
          const x = ((i * 41 + 13) % 1200) + ((i * 11) % 7) / 7;
          const y = ((i * 59 + 23) % 800) + ((i * 17) % 5) / 5;
          const r = i % 9 === 0 ? 1.0 : i % 5 === 0 ? 0.7 : i % 3 === 0 ? 0.55 : 0.4;
          const o = i % 11 === 0 ? 0.32 : i % 5 === 0 ? 0.20 : i % 3 === 0 ? 0.12 : 0.07;
          return (
            <circle
              key={i}
              cx={Math.round(x * 10) / 10}
              cy={Math.round(y * 10) / 10}
              r={r}
              fill={`rgba(255,255,255,${o})`}
            />
          );
        })}
      </svg>
    </div>
  );
}

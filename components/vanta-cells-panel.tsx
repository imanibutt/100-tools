"use client";

import { useEffect, useRef } from "react";

type VantaEffect = {
  destroy: () => void;
};

/**
 * Floating hero stage animation: a Vanta CELLS panel tinted with the
 * 100 Tools brand palette (dark teal / cyan / emerald). Renders inside
 * `.home-hero-stage` on the homepage only. Uses the same dynamic-import
 * pattern as the global FOG background so SSR is safe.
 */
export function VantaCellsPanel() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Respect reduced motion: skip WebGL entirely. The static CSS gradient
    // inside `.home-hero-stage` remains as a fallback.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Mobile performance guard: CELLS is a heavier shader than FOG. If
    // we're on a small screen with a coarse pointer (touch), skip the
    // WebGL effect and let the static CSS gradient inside the stage show.
    const isCoarsePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    const isSmallScreen =
      typeof window !== "undefined" && window.innerWidth < 720;
    if (isCoarsePointer && isSmallScreen) {
      return;
    }

    let effect: VantaEffect | null = null;
    let cancelled = false;

    async function load() {
      try {
        const THREE = await import("three");
        if (cancelled || !ref.current) return;
        const VANTA = await import("vanta/dist/vanta.cells.min");
        if (cancelled || !ref.current) return;

        const init = VANTA.default as unknown as (opts: Record<string, unknown>) => VantaEffect;

        effect = init({
          el: ref.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1,
          // 100 Tools brand palette: dark teal base, cyan/emerald cells.
          // Deliberately avoid the default Vanta yellow/green look.
          color1: 0x0b8c86,
          color2: 0x1dd6b5,
          colorMode: "variance",
          size: 1.35,
          speed: 0.55,
          zoom: 0.9,
        });
      } catch {
        // Vanta / WebGL unavailable. Static CSS gradient fallback.
      }
    }

    load();

    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, []);

  return <div ref={ref} className="vanta-cells-panel" aria-hidden />;
}

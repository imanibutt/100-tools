"use client";

import { useEffect, useRef } from "react";

type VantaEffect = {
  destroy: () => void;
};

/**
 * Global 100 Tools atmosphere: a single Vanta FOG canvas that lives behind
 * every page in the app. Mounted once in the root layout so there's never
 * a duplicate canvas per page.
 */
export function VantaBackground() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Respect reduced motion: skip WebGL entirely and let the static
    // dark gradient in CSS be the fallback.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let effect: VantaEffect | null = null;
    let cancelled = false;

    async function load() {
      try {
        const THREE = await import("three");
        if (cancelled || !ref.current) return;
        const VANTA = await import("vanta/dist/vanta.fog.min");
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
          scaleMobile: 1,
          // Dark premium fog palette tuned for 100 Tools
          highlightColor: 0x7df7ff,
          midtoneColor: 0x4357ff,
          lowlightColor: 0x071629,
          baseColor: 0x020407,
          blurFactor: 0.58,
          speed: 0.85,
          zoom: 0.85,
        });
      } catch {
        // Vanta / WebGL unavailable (very old browsers, SSR edge cases).
        // The static dark gradient in CSS remains as a fallback.
      }
    }

    load();

    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, []);

  return <div ref={ref} className="vanta-background" aria-hidden />;
}

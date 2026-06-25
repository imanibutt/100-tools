"use client";

import { useEffect, useRef } from "react";

type VantaEffect = {
  destroy: () => void;
};

type DotsVariant = "default" | "tools";

type Props = {
  variant?: DotsVariant;
};

/**
 * Vanta DOTS panel tinted with the 100 Tools brand palette
 * (white dots / cyan-teal accent / dark blue base). Two variants:
 *   - default : subtle, used inside the centered hero stage
 *   - tools   : slightly denser, used in the full-width tools showcase
 *               section below the hero
 * Uses the same dynamic-import pattern as the global FOG background so
 * SSR is safe.
 */
const DOTS_THEMES: Record<DotsVariant, Record<string, unknown>> = {
  default: {
    backgroundColor: 0x000000,
    color: 0xffffff,
    color2: 0x5fffe6,
    size: 2.4,
    spacing: 34,
    showLines: false,
    speed: 1,
  },
  tools: {
    backgroundColor: 0x020407,
    color: 0xffffff,
    color2: 0x55ffe0,
    size: 2.2,
    spacing: 36,
    showLines: true,
    speed: 1,
  },
};

export function VantaDotsPanel({ variant = "default" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Respect reduced motion: skip WebGL entirely. The static CSS gradient
    // inside the parent section remains as a fallback.
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
        // The DOTS effect captures `window.THREE` at module-load time,
        // so we need to expose the THREE namespace on the window before
        // importing the effect. (Same pattern recommended by Vanta docs.)
        (window as unknown as { THREE: unknown }).THREE = THREE;
        const VANTA = await import("vanta/dist/vanta.dots.min");
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
          ...DOTS_THEMES[variant],
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
  }, [variant]);

  return (
    <div
      ref={ref}
      className={
        "vanta-dots-panel vanta-dots-panel--" + variant
      }
      aria-hidden
    />
  );
}

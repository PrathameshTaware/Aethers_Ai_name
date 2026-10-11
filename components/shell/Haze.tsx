'use client';

import { useEffect } from 'react';
import { useUi } from '@/lib/store';
import { stageByNumber } from '@/lib/stage';

/**
 * The haze: one fixed layer behind all content whose density and tint follow the GRAP stage.
 * Cards and tables sit on opaque paper above it, so text contrast never changes with the stage.
 */
export function Haze() {
  const stage = useUi((s) => s.stage);

  useEffect(() => {
    const meta = stageByNumber(stage);
    const root = document.documentElement;
    root.style.setProperty('--haze', String(meta.haze));
    root.style.setProperty('--stage-color', meta.hex);
  }, [stage]);

  return (
    <div aria-hidden>
      <div className="haze-layer" />
      <svg className="haze-grain h-full w-full">
        <filter id="haze-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.32  0 0 0 0 0.26  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#haze-noise)" />
      </svg>
    </div>
  );
}

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

  // The grain is the same SVG noise as a tiled background (see .haze-grain), so the browser rasterises it once
  // instead of re-running a full-viewport filter on every repaint.
  return (
    <div aria-hidden>
      <div className="haze-layer" />
      <div className="haze-grain" />
    </div>
  );
}

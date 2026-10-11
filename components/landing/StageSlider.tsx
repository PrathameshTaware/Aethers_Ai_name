'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useUi } from '@/lib/store';
import { STAGES, stageByNumber } from '@/lib/stage';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { StageNumber } from '@/lib/types';

/** Four-stop GRAP stage slider. Drag, click a stop, or use the arrow keys. */
export function StageSlider({ className }: { className?: string }) {
  const stage = useUi((s) => s.stage);
  const setStage = useUi((s) => s.setStage);
  const { t, lang } = useT();
  const track = useRef<HTMLDivElement>(null);
  const meta = stageByNumber(stage);

  const pick = (n: number) => {
    const next = Math.min(4, Math.max(1, Math.round(n))) as StageNumber;
    if (next === stage) return;
    setStage(next);
    const url = new URL(window.location.href);
    url.searchParams.set('stage', String(next));
    window.history.replaceState(null, '', url);
  };

  const fromPointer = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    pick(1 + ((clientX - r.left) / r.width) * 3);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    if (e.key in delta) pick(stage + delta[e.key]);
    else if (e.key === 'Home') pick(1);
    else if (e.key === 'End') pick(4);
    else return;
    e.preventDefault();
  };

  return (
    <div className={cn('select-none', className)}>
      <p className="label mb-4" id="stage-slider-label" lang={lang}>{t('slider')}</p>

      <div className="px-4">
        <div
          ref={track}
          className="stage-track cursor-pointer touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            fromPointer(e.clientX);
          }}
          onPointerMove={(e) => e.buttons === 1 && fromPointer(e.clientX)}
        >
          {STAGES.map((s) => (
            <span
              key={s.n}
              aria-hidden
              className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink bg-paper-light"
              style={{ left: `${((s.n - 1) / 3) * 100}%` }}
            />
          ))}
          <motion.div
            role="slider"
            tabIndex={0}
            aria-labelledby="stage-slider-label"
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={stage}
            aria-valuetext={`Stage ${meta.code}, ${meta.band.toLowerCase()}`}
            onKeyDown={onKeyDown}
            animate={{ left: `${((stage - 1) / 3) * 100}%` }}
            transition={{ type: 'spring', stiffness: 480, damping: 32 }}
            whileTap={{ scale: 1.12 }}
            className={cn(
              'stage-fill absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center',
              'rounded-full border-2 border-ink font-mono text-[15px] font-bold shadow-[0_3px_0_var(--color-ink)] active:cursor-grabbing',
              `stage-${stage}`,
            )}
          >
            {meta.code}
          </motion.div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-1.5">
        {STAGES.map((s) => {
          const active = s.n === stage;
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => pick(s.n)}
              tabIndex={-1}
              className={cn(
                'cursor-pointer rounded-md border px-2 py-2 text-left transition-colors',
                active ? 'border-ink bg-paper-light' : 'border-transparent hover:bg-paper-2',
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className={cn('stage-fill size-2.5 rounded-full border border-ink', `stage-${s.n}`)} />
                <span className="font-mono text-[13px] font-semibold">Stage {s.code}</span>
              </span>
              <span className="mt-0.5 block text-[13px] leading-tight text-ink-soft">{s.band}</span>
              <span className="num hidden text-[11.5px] text-ink-soft sm:block">{s.aqi}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

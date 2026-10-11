'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { stageByNumber, type StageMeta } from '@/lib/stage';

/** The breath ring: a pulsing circle, 4 s in and 4 s out. Loader, countdown and logo mark. */
export function BreathRing({ size = 18, fast, className }: { size?: number; fast?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('breath-ring shrink-0', fast && 'breath-fast', className)}
      style={{ width: size, height: size }}
    />
  );
}

const STAMP_TONE = {
  breath: 'text-breath-ink',
  seal: 'text-seal',
  danger: 'text-danger',
  saffron: 'text-[#9a5200]',
} as const;

/** The ink stamp: APPROVED, VERIFIED, CHAIN BROKEN, FAIL-SAFE, GENUINE. Lands with a thud. */
export function Stamp({ children, tone = 'breath', className }: {
  children: ReactNode; tone?: keyof typeof STAMP_TONE; className?: string;
}) {
  return (
    <motion.span
      initial={{ scale: 2.4, opacity: 0, rotate: -14 }}
      animate={{ scale: 1, opacity: 1, rotate: -4 }}
      transition={{ type: 'spring', stiffness: 520, damping: 22 }}
      className={cn('stamp', STAMP_TONE[tone], className)}
      role="status"
    >
      {children}
    </motion.span>
  );
}

/** Stage chip: numeral, label and an ink border, never colour alone. */
export function StageChip({ stage, className }: { stage: StageMeta | number; className?: string }) {
  const meta = typeof stage === 'number' ? stageByNumber(stage) : stage;
  return (
    <span className={cn('chip stage-fill', `stage-${meta.n}`, className)}>
      <span className="font-bold">Stage {meta.code}</span>
      <span aria-hidden>·</span>
      <span>{meta.band}</span>
    </span>
  );
}

/**
 * Scroll-reveal wrapper used for every section. `now` animates on mount instead of on scroll,
 * for content that appears after data loads and is already in view.
 */
export function Reveal({ children, delay = 0, className, as = 'div', now }: {
  children: ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'li'; now?: boolean;
}) {
  const Tag = motion[as];
  return (
    <Tag
      initial={{ opacity: 0, y: 28 }}
      {...(now
        ? { animate: { opacity: 1, y: 0 } }
        : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' } })}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** A card that tilts in 3D towards the pointer; its hard shadow shifts the other way. */
export function TiltCard({ children, className, shadow, style }: {
  children: ReactNode; className?: string; shadow?: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--tx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--ty', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const reset = () => {
    ref.current?.style.setProperty('--tx', '0');
    ref.current?.style.setProperty('--ty', '0');
  };

  return (
    <div className="tilt-scene h-full">
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        className={cn('tilt-card h-full rounded-lg border-[1.5px] border-ink bg-paper-light', className)}
        style={{ ...style, ...(shadow ? ({ '--tilt-shadow': shadow } as CSSProperties) : null) }}
      >
        {children}
      </div>
    </div>
  );
}

/** Small "modelled" / "draft" / "snapshot" honesty tag next to any estimate. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('rounded-sm border border-(--rule-strong) px-1.5 py-px font-mono text-[10.5px] uppercase tracking-wider text-ink-soft', className)}>
      {children}
    </span>
  );
}

export function SectionHead({ kicker, title, children, id }: {
  kicker: string; title: ReactNode; children?: ReactNode; id?: string;
}) {
  return (
    <header className="section-head" id={id}>
      <span className="label">{kicker}</span>
      <h2 className="display text-[clamp(2rem,4.4vw,3.4rem)]">{title}</h2>
      {children && <p className="max-w-[62ch] text-ink-soft">{children}</p>}
    </header>
  );
}

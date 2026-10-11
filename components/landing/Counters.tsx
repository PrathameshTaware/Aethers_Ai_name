'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import { Tag } from '@/components/shell/primitives';
import type { Plan } from '@/lib/types';
import { cn } from '@/lib/utils';

/** A number that counts from its previous value to the new one. */
export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(last.current, value, {
      duration: 0.6,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => { el.textContent = `${Math.round(v)}${suffix}`; },
    });
    last.current = value;
    return () => controls.stop();
  }, [value, suffix]);

  return <span ref={ref} className="num">{value}{suffix}</span>;
}

/** The five live numbers from /rehearse. Estimates carry a "modelled" tag. */
export function Counters({ plan, className }: { plan: Plan; className?: string }) {
  const pe = plan.pe_minutes;
  const items = [
    { label: 'Moved to a cleaner slot', value: plan.plan_a.length, unit: 'periods' },
    { label: 'Replaced indoors', value: plan.plan_b.length, unit: 'periods' },
    { label: 'PE minutes kept active', value: pe.kept_active, unit: `of ${pe.scheduled}` },
    { label: 'PE minutes lost', value: pe.lost, unit: 'min' },
    { label: 'Outdoor exposure cut', value: Math.round(plan.exposure_reduction_pct), suffix: '%', modelled: true },
  ];

  return (
    <dl className={cn('grid grid-cols-2 border-y-2 border-ink sm:grid-cols-3 lg:grid-cols-5', className)}>
      {items.map((it, i) => (
        <div
          key={it.label}
          className={cn(
            'flex flex-col gap-1 border-(--rule) px-4 py-5',
            i > 0 && 'lg:border-l',
            i % 2 === 1 && 'max-sm:border-l',
            i % 3 !== 0 && 'sm:max-lg:border-l',
            i >= 2 && 'max-sm:border-t',
            i >= 3 && 'sm:max-lg:border-t',
          )}
        >
          <dt className="label">{it.label}</dt>
          <dd className="flex items-baseline gap-2">
            <span className="text-[clamp(2rem,4vw,3rem)] font-medium leading-none">
              <CountUp value={it.value} suffix={it.suffix} />
            </span>
            {it.unit && <span className="num text-[13px] text-ink-soft">{it.unit}</span>}
            {it.modelled && <Tag>modelled</Tag>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

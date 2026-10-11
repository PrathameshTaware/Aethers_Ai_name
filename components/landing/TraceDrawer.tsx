'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CloudRain, FileText, Gauge, ListChecks, Lock, ShieldPlus, Target, X } from 'lucide-react';
import { Tag } from '@/components/shell/primitives';
import { traceFor } from '@/lib/rehearsal';
import type { Plan } from '@/lib/types';
import { cn, venueName } from '@/lib/utils';

function Step({ n, icon, title, children }: { n: number; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + n * 0.07, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="grid grid-cols-[36px_1fr] gap-3"
    >
      <span className="grid size-9 place-items-center rounded-full border-[1.5px] border-ink bg-paper-light">{icon}</span>
      <div className="min-w-0 pb-6">
        <p className="label mb-1.5">{n}. {title}</p>
        <div className="space-y-2 text-[15px] leading-snug">{children}</div>
      </div>
    </motion.li>
  );
}

function Meter({ label, value, limit, max }: { label: string; value: number; limit: number; max: number }) {
  const over = value > limit;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span>{label}</span>
        <span className="num text-[14px]">
          <strong>{Math.round(value)}</strong> vs limit {limit} µg/m³
        </span>
      </div>
      <div className="relative h-2.5 rounded-full bg-paper-2">
        <motion.div
          className={cn('absolute inset-y-0 left-0 rounded-full', over ? 'bg-ink' : 'bg-breath')}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        />
        <span
          className="absolute -top-1 h-4.5 w-0.5 bg-danger"
          style={{ left: `${(limit / max) * 100}%` }}
          aria-hidden
        />
      </div>
      <p className="mt-1 text-[13px] text-ink-soft">{over ? 'Over the limit.' : 'Within the limit.'}</p>
    </div>
  );
}

/** The reasoning for one period, straight from `decision_trace`. Right drawer; bottom sheet on mobile. */
export function TraceDrawer({ plan, target, onClose }: {
  plan: Plan | undefined;
  target: { cls: string; period: string } | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const trace = plan && target ? traceFor(plan, target.cls, target.period) : undefined;
  const indoor = plan && target ? plan.plan_b.find((b) => b.class === target.cls && b.period === target.period) : undefined;
  const move = plan && target ? plan.plan_a.find((m) => m.class === target.cls && m.from_period === target.period) : undefined;
  const isOpen = !!target;

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const limit = trace?.sensitivity?.restricted_at ?? 120;
  const max = trace ? Math.max(trace.forecast_pm25.pessimistic, limit) * 1.08 : 1;
  const banned = trace?.label === 'banned';
  const choice = indoor?.venue_choice;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Why ${target.cls} ${target.period} changed`}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl border-t-2 border-ink bg-paper md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(520px,92vw)] md:rounded-none md:border-l-2 md:border-t-0"
            initial={{ x: '100%', y: 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: '100%', y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-(--rule-strong) px-6 py-5">
              <div>
                <p className="label mb-1">Decision trace</p>
                <h3 className="display text-[30px]">
                  {target.cls} · {target.period}{' '}
                  <span className="font-normal text-ink-soft">{trace?.subject ?? ''}</span>
                </h3>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} className="btn btn-quiet size-11 !px-0" aria-label="Close">
                <X className="size-5" />
              </button>
            </header>

            <div className="hide-scrollbar flex-1 overflow-y-auto px-6 py-6">
              {!trace ? (
                <p className="text-ink-soft">The plan for this stage has no trace for this period.</p>
              ) : (
                <ol>
                  <Step n={1} icon={<FileText className="size-4" />} title="The order">
                    <p>
                      <span className={cn('chip mr-2 align-middle', banned ? 'chip-danger' : 'chip-saffron')}>
                        {trace.label}
                      </span>
                      {trace.reason}
                    </p>
                    <p className="text-[13.5px] text-ink-soft">
                      {trace.rule_ids.length
                        ? <>Rule <span className="num">{trace.rule_ids.join(', ')}</span>, quoted verbatim from the circular.</>
                        : 'The order permits outdoor PE at this stage, so the forecast decides.'}
                    </p>
                  </Step>

                  <Step n={2} icon={<Gauge className="size-4" />} title="Forecast">
                    <Meter label="Nominal PM2.5" value={trace.forecast_pm25.nominal} limit={limit} max={max} />
                    {trace.sensitivity && (
                      <p className="flex items-start gap-2 rounded-md bg-seal-tint px-3 py-2 text-[13.5px]">
                        <ShieldPlus className="mt-0.5 size-4 shrink-0 text-seal" aria-hidden />
                        <span>
                          <strong>Stricter limit.</strong> This class has students with respiratory conditions, so its
                          limits are scaled to {Math.round(trace.sensitivity.threshold_multiplier * 100)}% and it chooses
                          first. Only counts are stored, and they are never published.
                        </span>
                      </p>
                    )}
                  </Step>

                  <Step n={3} icon={<CloudRain className="size-4" />} title="Pessimistic (+20%)">
                    <Meter label="If the forecast is 20% low" value={trace.forecast_pm25.pessimistic} limit={limit} max={max} />
                    <p className="text-[13.5px] text-ink-soft">A swap must pass both forecasts.</p>
                  </Step>

                  <Step n={4} icon={<ListChecks className="size-4" />} title="Candidate slots">
                    <ul className="divide-y divide-(--rule) rounded-md border border-(--rule) bg-paper-light">
                      {trace.candidates.map((c) => {
                        const chosen = c.verdict === 'chosen';
                        const locked = c.reasons.includes('locked period');
                        return (
                          <li key={c.period} className={cn('grid grid-cols-[52px_1fr] gap-2 px-3 py-2', chosen && 'bg-breath-tint')}>
                            <span className="num text-[13.5px] font-semibold">{c.period}</span>
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-x-2">
                                <span>{c.subject}</span>
                                <span className="num text-[12.5px] text-ink-soft">
                                  {Math.round(c.forecast_pm25.nominal)} / {Math.round(c.forecast_pm25.pessimistic)}
                                </span>
                                {chosen
                                  ? <span className="flex items-center gap-1 text-[13px] font-semibold text-breath-ink"><Check className="size-3.5" /> chosen</span>
                                  : <span className="flex items-center gap-1 text-[13px] text-ink-soft">{locked ? <Lock className="size-3.5" /> : <X className="size-3.5" />} rejected</span>}
                              </span>
                              {c.reasons.map((r) => (
                                <span key={r} className="block text-[12.5px] leading-snug text-ink-soft">{r}</span>
                              ))}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="text-[12.5px] text-ink-soft">Numbers are nominal / pessimistic PM2.5 in µg/m³.</p>
                  </Step>

                  <Step n={5} icon={<Target className="size-4" />} title="Result">
                    {move ? (
                      <p>
                        <strong>Moved to {move.to_period}</strong>, swapping with {move.partner_subject}. Forecast{' '}
                        <span className="num">{Math.round(move.exposure_after)}</span> instead of{' '}
                        <span className="num">{Math.round(move.exposure_before)}</span> µg/m³, with no teacher or venue clash.
                      </p>
                    ) : choice ? (
                      <>
                        <p>
                          <strong>Indoors in {venueName(choice.chosen.venue_id)}:</strong> {indoor!.assigned_activity}.
                          Modelled <span className="num">{Math.round(choice.chosen.indoor_pm25_modelled)}</span> vs{' '}
                          <span className="num">{Math.round(choice.outdoor_pm25_forecast)}</span> µg/m³ outdoors.
                        </p>
                        <p className="text-[13.5px] text-ink-soft">{trace.outcome.why && `Why indoors: ${trace.outcome.why}.`}</p>
                        <ul className="space-y-1.5">
                          {[choice.chosen, ...choice.alternatives]
                            .sort((a, b) => a.indoor_pm25_modelled - b.indoor_pm25_modelled)
                            .map((v) => {
                              const picked = v.venue_id === choice.chosen.venue_id;
                              return (
                                <li key={v.venue_id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-[13.5px]">
                                  <span className={cn('truncate', picked && 'font-semibold text-breath-ink')}>
                                    {picked && '✓ '}{v.label}
                                  </span>
                                  <span className="num">{Math.round(v.indoor_pm25_modelled)}</span>
                                  <span className="col-span-2 h-1.5 rounded-full bg-paper-2">
                                    <motion.span
                                      className={cn('block h-full rounded-full', picked ? 'bg-breath' : 'bg-haze')}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(v.indoor_pm25_modelled / choice.outdoor_pm25_forecast) * 100}%` }}
                                      transition={{ duration: 0.6, delay: 0.5 }}
                                    />
                                  </span>
                                </li>
                              );
                            })}
                        </ul>
                        <p className="flex items-start gap-2 text-[12.5px] text-ink-soft">
                          <Tag className="shrink-0">assumption</Tag>
                          <span>Indoor PM2.5 is outdoor PM2.5 × an infiltration factor per ventilation type. Not measured.</span>
                        </p>
                      </>
                    ) : (
                      <p>{trace.outcome.why ?? 'No change was needed.'}</p>
                    )}
                  </Step>
                </ol>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

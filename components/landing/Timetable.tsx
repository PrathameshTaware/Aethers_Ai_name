'use client';

import { useMemo, useRef, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { ArrowRight, Lock, MoveRight, Sun, Wind } from 'lucide-react';
import { BreathRing, Reveal, SectionHead, Tag } from '@/components/shell/primitives';
import { TraceDrawer } from '@/components/landing/TraceDrawer';
import { buildGrid, explainingPeriod, useRehearsal, type Cell } from '@/lib/rehearsal';
import { stageByNumber } from '@/lib/stage';
import { cn, venueName } from '@/lib/utils';

const KIND_CLASS: Record<Cell['kind'], string> = {
  plain: '',
  outdoor: 'tt-outdoor',
  moved: 'tt-moved',
  partner: 'tt-partner',
  indoor: 'tt-indoor',
};

function Block({ cell, onOpen, locked }: { cell: Cell; onOpen: (cell: Cell, el: HTMLElement) => void; locked: boolean }) {
  const clickable = cell.kind !== 'plain';
  const label =
    cell.kind === 'indoor' ? cell.indoor!.assigned_activity
    : cell.origin.subject;
  const place =
    cell.kind === 'indoor' ? venueName(cell.indoor!.venue_choice?.chosen.venue_id ?? cell.indoor!.fallback_venue)
    : venueName(cell.origin.venue);

  const body = (
    <>
      <span className={cn('font-semibold', cell.kind === 'plain' && 'font-medium text-ink-soft')}>{label}</span>
      <span className={cn('flex items-center gap-1 font-mono text-[11px]', cell.kind === 'indoor' ? 'text-white/85' : 'text-ink-soft')}>
        {cell.kind === 'outdoor' && <><Sun className="size-3" aria-hidden /> Outdoors · {place}</>}
        {cell.kind === 'indoor' && <><Wind className="size-3" aria-hidden /> Indoors · {place}</>}
        {cell.kind === 'moved' && <><MoveRight className="size-3" aria-hidden /> from {cell.move!.from_period} · outdoors</>}
        {cell.kind === 'partner' && <>swapped from {cell.move!.to_period}</>}
        {cell.kind === 'plain' && (locked ? <><Lock className="size-3" aria-label="Locked period" /> {place}</> : place)}
      </span>
    </>
  );

  // layoutId is the block's identity as timetabled, so it slides between slots when the plan changes.
  const shared = {
    layoutId: `${cell.cls}-${cell.origin.period}`,
    layout: true,
    transition: { type: 'spring' as const, stiffness: 240, damping: 30 },
    className: cn('tt-block', KIND_CLASS[cell.kind]),
  };

  if (!clickable) return <motion.div {...shared}>{body}</motion.div>;
  return (
    <motion.button
      type="button"
      {...shared}
      onClick={(e) => onOpen(cell, e.currentTarget)}
      aria-label={`${cell.cls} ${cell.slot}: ${label}, ${cell.kind}. Show why.`}
      whileHover={{ y: -2 }}
    >
      {body}
    </motion.button>
  );
}

export function Timetable() {
  const { plan, stage, planStage, loading, error, refetch } = useRehearsal();
  const [view, setView] = useState<'before' | 'after'>('after');
  const [open, setOpen] = useState<{ cls: string; period: string } | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const grid = useMemo(() => (plan ? buildGrid(plan, view) : null), [plan, view]);
  const lockedPeriods = useMemo(() => {
    // The public plan does not list locked periods; a candidate rejected as "locked period" reveals one.
    const set = new Set<string>();
    plan?.decision_trace.forEach((t) =>
      t.candidates.forEach((c) => c.reasons.includes('locked period') && set.add(`${t.class}-${c.period}`)));
    return set;
  }, [plan]);
  const maxPm = grid ? Math.max(...grid.periods.map((p) => p.pm25)) : 1;
  const meta = stageByNumber(planStage ?? stage);

  const onOpen = (cell: Cell, el: HTMLElement) => {
    const period = explainingPeriod(cell);
    if (!period) return;
    opener.current = el;
    setOpen({ cls: cell.cls, period });
  };

  return (
    <section className="wrap scroll-mt-24 pt-24" id="plan">
      <Reveal>
        <SectionHead
          kicker="The re-plan · POST /rehearse"
          title={<>Tomorrow&rsquo;s timetable at <em className="font-normal">Stage {meta.code}</em></>}
        >
          Six classes, eight periods, six outdoor PE periods. Saans tries a cleaner permitted slot first, then an
          indoor active session in the cleanest free room. Click any coloured period to see exactly why.
        </SectionHead>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full border-[1.5px] border-ink bg-paper-light p-0.5" role="group" aria-label="Timetable view">
            {(['before', 'after'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className="relative min-h-9 cursor-pointer rounded-full px-4 text-[14px] font-semibold"
              >
                {view === v && (
                  <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                )}
                <span className={cn('relative', view === v ? 'text-paper' : 'text-ink-soft')}>
                  {v === 'before' ? 'As timetabled' : 'Re-planned'}
                </span>
              </button>
            ))}
          </div>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft" aria-label="Legend">
            <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm border-[1.5px] border-saffron bg-saffron-tint" /> Outdoor PE at risk</li>
            <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm border-2 border-breath bg-paper-light" /> Moved to a cleaner slot</li>
            <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-breath" /> Indoor active session</li>
            {loading && <li className="flex items-center gap-1.5 text-breath"><BreathRing size={12} /> updating</li>}
          </ul>
        </div>

        {error && !grid ? (
          <div className="sheet flex flex-col items-start gap-3 p-6">
            <p><strong>Could not load the rehearsal.</strong> The API and the saved snapshot were both unreachable.</p>
            <button type="button" className="btn" onClick={() => refetch()}>Try again</button>
          </div>
        ) : !grid ? (
          <div className="loading-sweep h-[520px] rounded-md bg-paper-2" aria-label="Loading timetable" />
        ) : (
          <div className="sheet hide-scrollbar overflow-x-auto p-3 sm:p-4">
            <LayoutGroup>
              <div className="tt-grid" role="table" aria-label={`Timetable at Stage ${meta.code}, ${view === 'after' ? 're-planned' : 'as timetabled'}`}>
                {/* Column heads: period, time and that period's forecast PM2.5 */}
                <div role="row" className="contents">
                  <div role="columnheader" className="label self-end pb-1">Class</div>
                  {grid.periods.map((p) => (
                    <div role="columnheader" key={p.period} className="flex flex-col gap-1 pb-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-[13px] font-semibold">{p.period}</span>
                        <span className="num text-[11px] text-ink-soft">{p.start}</span>
                      </div>
                      <div className="flex h-9 items-end gap-1.5" title={`Forecast PM2.5 ${p.pm25} µg/m³`}>
                        <motion.span
                          className="w-full rounded-t-sm bg-haze"
                          initial={false}
                          animate={{ height: `${Math.max(8, (p.pm25 / maxPm) * 100)}%` }}
                        />
                      </div>
                      <span className="num text-[11px] text-ink-soft">{Math.round(p.pm25)} <span className="text-[10px]">µg/m³</span></span>
                    </div>
                  ))}
                </div>

                {grid.classes.map((cls) => (
                  <div role="row" className="contents" key={cls}>
                    <div role="rowheader" className="display flex items-center text-[22px]">{cls}</div>
                    {grid.rows[cls].map((cell) => (
                      <div role="cell" className="tt-slot" key={cell.slot}>
                        <Block cell={cell} onOpen={onOpen} locked={lockedPeriods.has(`${cls}-${cell.origin.period}`)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </LayoutGroup>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-soft">
          <span className="flex flex-wrap items-center gap-2">
            {plan?.forecast && <Tag>{plan.forecast.is_replay ? 'Replay scenario' : 'Live forecast'}</Tag>}
            <span>{plan?.forecast?.model}</span>
          </span>
          <span className="flex items-center gap-1">
            Ruleset <span className="num">{plan?.ruleset_version}</span>
            <ArrowRight className="size-3.5" aria-hidden />
            <a className="prose-link" href="#how">where the rules come from</a>
          </span>
        </div>
      </Reveal>

      <TraceDrawer
        plan={plan}
        target={open}
        onClose={() => {
          setOpen(null);
          opener.current?.focus();
        }}
      />
    </section>
  );
}

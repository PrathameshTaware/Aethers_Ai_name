'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMounted } from '@/lib/hooks';
import { useUi } from '@/lib/store';
import { stageByCode, stageByNumber } from '@/lib/stage';
import type { ClassifiedPeriod, DecisionTrace, Plan, PlanIndoor, PlanMove } from '@/lib/types';

/**
 * The live rehearsal for the stage on the slider. Debounced 150 ms; the previous request is
 * cancelled and the previous plan stays on screen while the next one loads, so nothing blanks.
 */
export function useRehearsal() {
  const stage = useUi((s) => s.stage);
  const [debounced, setDebounced] = useState(stage);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(stage), 150);
    return () => clearTimeout(id);
  }, [stage]);

  const code = stageByNumber(debounced).code;
  const query = useQuery({
    queryKey: ['rehearse', code],
    queryFn: ({ signal }) => api.rehearse(code, signal),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    // On the labelled snapshot (the API was unreachable), keep trying quietly and switch back to live.
    refetchInterval: (q) => (q.state.data?.origin === 'snapshot' ? 20_000 : false),
  });

  // Held back until mount so the first client render matches the prerendered HTML.
  const mounted = useMounted();
  const plan = mounted ? query.data?.data : undefined;
  return {
    stage,
    plan,
    /** The stage the plan on screen was computed for (lags `stage` while loading). */
    planStage: plan ? stageByCode(plan.declared_stage).n : null,
    origin: query.data?.origin ?? null,
    loading: query.isFetching || debounced !== stage,
    error: query.isError && !plan ? query.error : null,
    refetch: query.refetch,
  };
}

export type CellKind = 'plain' | 'outdoor' | 'moved' | 'partner' | 'indoor';

export interface Cell {
  cls: string;
  /** The period this block sits in now. */
  slot: string;
  /** The period as timetabled. `origin.period` identifies the block across views. */
  origin: ClassifiedPeriod;
  kind: CellKind;
  move?: PlanMove;
  indoor?: PlanIndoor;
}

export interface Grid {
  classes: string[];
  periods: { period: string; start: string; end: string; pm25: number; pessimistic?: number }[];
  /** rows[class][slotIndex] */
  rows: Record<string, Cell[]>;
}

/** Lays the 48 classified periods out as timetabled (`before`) or as re-planned (`after`). */
export function buildGrid(plan: Plan, view: 'before' | 'after'): Grid {
  const classes = [...new Set(plan.classified_periods.map((p) => p.class))];
  const first = plan.classified_periods.filter((p) => p.class === classes[0]);
  const pess = new Map(plan.forecast?.periods.map((p) => [p.period, p.pm25_pessimistic]));
  const periods = first.map((p) => ({
    period: p.period, start: p.start, end: p.end, pm25: p.pm25, pessimistic: pess.get(p.period),
  }));
  const slotIndex = new Map(periods.map((p, i) => [p.period, i]));

  const rows: Record<string, Cell[]> = {};
  for (const cls of classes) {
    const cells: Cell[] = plan.classified_periods
      .filter((p) => p.class === cls)
      .map((origin) => ({ cls, slot: origin.period, origin, kind: origin.is_outdoor ? 'outdoor' : 'plain' }));

    if (view === 'after') {
      for (const move of plan.plan_a.filter((m) => m.class === cls)) {
        const mover = cells.find((c) => c.origin.period === move.from_period);
        const partner = cells.find((c) => c.origin.period === move.to_period);
        if (!mover || !partner) continue;
        Object.assign(mover, { slot: move.to_period, kind: 'moved', move });
        Object.assign(partner, { slot: move.from_period, kind: 'partner', move });
      }
      for (const indoor of plan.plan_b.filter((b) => b.class === cls)) {
        const cell = cells.find((c) => c.origin.period === indoor.period);
        if (cell) Object.assign(cell, { kind: 'indoor', indoor });
      }
    }
    rows[cls] = cells.sort((a, b) => (slotIndex.get(a.slot) ?? 0) - (slotIndex.get(b.slot) ?? 0));
  }
  return { classes, periods, rows };
}

export const traceFor = (plan: Plan, cls: string, originPeriod: string): DecisionTrace | undefined =>
  plan.decision_trace.find((t) => t.class === cls && t.period === originPeriod);

/** The period whose decision explains this cell (a partner cell is explained by the block that moved). */
export const explainingPeriod = (cell: Cell): string | null =>
  cell.kind === 'plain' ? null : cell.kind === 'partner' ? cell.move!.from_period : cell.origin.period;

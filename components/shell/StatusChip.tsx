'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, TriangleAlert, WifiOff, X } from 'lucide-react';
import { api, API_BASE } from '@/lib/api';
import { useMounted } from '@/lib/hooks';
import { cn, fmtDateTime, shortHash } from '@/lib/utils';

export function useHealth() {
  const mounted = useMounted();
  const query = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => api.health(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  // Sections hydrate at different times. Holding cached data back until mount keeps the first
  // client render identical to the prerendered HTML.
  return mounted ? query : { ...query, data: undefined, isPending: true as const, isError: false as const };
}

const REGION = /execute-api\.([a-z0-9-]+)\./.exec(API_BASE)?.[1] ?? 'aws';

/** Live system status from GET /health. Says LIVE, REPLAY, SNAPSHOT or DOWN, and never guesses. */
export function StatusChip() {
  const { data, isPending, isError } = useHealth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (isPending) return <span className="chip chip-quiet">Checking…</span>;
  if (isError || !data) {
    return <span className="chip chip-quiet"><WifiOff className="size-3" /> Offline</span>;
  }

  const { data: health, origin } = data;
  const c = health.checks;
  const replay = c.forecast?.source !== 'live';
  const mode =
    origin === 'snapshot' ? 'SNAPSHOT'
    : health.status === 'down' ? 'DOWN'
    : replay ? 'REPLAY' : 'LIVE';
  const tone =
    mode === 'LIVE' ? 'chip-seal' : mode === 'REPLAY' ? 'chip-saffron' : mode === 'DOWN' ? 'chip-danger' : 'chip-quiet';

  const rows: { ok: boolean; name: string; detail: string }[] = [
    { ok: !!c.table?.ok, name: 'Table', detail: c.table?.ok ? `reachable · ${c.table.latency_ms} ms` : 'unreachable' },
    {
      ok: !!c.ruleset, name: 'Ruleset',
      detail: c.ruleset ? `${c.ruleset.version} · ${c.ruleset.rules} rules · ${shortHash(c.ruleset.sha256, 8)}` : '—',
    },
    {
      ok: !!c.declared_stage?.stage, name: 'Declared stage',
      detail: c.declared_stage?.stage
        ? `Stage ${c.declared_stage.stage}${c.declared_stage.source?.label ? ` · ${c.declared_stage.source.label}` : ''}`
        : 'not seeded',
    },
    {
      ok: !replay, name: 'Forecast',
      detail: `${c.forecast?.source ?? '—'}${c.forecast?.fallback_reason ? ` · ${c.forecast.fallback_reason}` : ''}`,
    },
    {
      ok: !!c.bedrock?.usable, name: 'Bedrock',
      detail: c.bedrock?.usable ? c.bedrock.model : 'not usable: notices use the labelled static template',
    },
    {
      ok: !!c.audit?.chain_valid, name: 'Audit chain',
      detail: c.audit ? `${c.audit.rows} rows · head ${shortHash(c.audit.head_hash, 8)} · ${c.audit.chain_valid ? 'valid' : 'BROKEN'}` : '—',
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`System status: ${mode}. Show details.`}
        className={cn('chip cursor-pointer !px-2 sm:!px-3 !py-1 text-[12px] sm:text-[13px]', tone)}
      >
        <span className={cn('size-1.5 rounded-full bg-current', mode === 'LIVE' && 'animate-pulse')} />
        <span>{mode}</span>
        <span className="hidden sm:inline">· {REGION}</span>
        {c.audit?.head_hash && <span className="hidden md:inline">· chain {shortHash(c.audit.head_hash)}</span>}
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="sheet absolute right-0 top-9 z-50 w-[min(360px,calc(100vw-32px))] p-4 shadow-(--lift)"
            role="dialog"
            aria-label="System status"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="label">GET /health</span>
              <span className="num text-[11.5px] text-ink-soft">{fmtDateTime(health.checked_at)} IST</span>
            </div>
            <ul className="space-y-2 text-[13.5px]">
              {rows.map((r) => (
                <li key={r.name} className="flex gap-2.5">
                  {r.ok
                    ? <Check className="mt-0.5 size-4 shrink-0 text-breath-ink" aria-label="ok" />
                    : r.name === 'Audit chain' || r.name === 'Table'
                      ? <X className="mt-0.5 size-4 shrink-0 text-danger" aria-label="error" />
                      : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#9a5200]" aria-label="fallback" />}
                  <span><strong className="font-semibold">{r.name}.</strong> <span className="text-ink-soft">{r.detail}</span></span>
                </li>
              ))}
            </ul>
            {origin === 'snapshot' && (
              <p className="mt-3 border-t border-(--rule) pt-3 text-[13px] text-ink-soft">
                The API could not be reached. This is a saved copy of a real response.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

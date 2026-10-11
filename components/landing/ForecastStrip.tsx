'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BreathRing, Reveal, SectionHead, Tag } from '@/components/shell/primitives';
import { api } from '@/lib/api';
import { cn, fmtDateTime } from '@/lib/utils';

const W = 1000;
const H = 300;
const PAD = { l: 44, r: 16, t: 20, b: 34 };

/** 48 hours of hourly PM2.5 from GET /forecast with the advisory and restricted bands. */
export function ForecastStrip() {
  const [source, setSource] = useState<'live' | 'replay'>('live');
  const [hover, setHover] = useState<number | null>(null);
  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ['forecast', source],
    queryFn: ({ signal }) => api.forecast(source, signal),
    staleTime: 10 * 60_000,
  });

  const fc = data?.data;
  const chart = useMemo(() => {
    if (!fc?.hours.length) return null;
    const limits = Object.fromEntries(fc.thresholds.filter((t) => t.value != null).map((t) => [t.name, t.value!]));
    const advisory = limits.advisory ?? 90;
    const restricted = limits.restricted ?? 120;
    const top = Math.max(restricted * 1.25, ...fc.hours.map((h) => h.pm25 * 1.2)) * 1.05;
    const x = (i: number) => PAD.l + (i / (fc.hours.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => H - PAD.b - (v / top) * (H - PAD.t - PAD.b);
    const line = (scale: number) => fc.hours.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(h.pm25 * scale).toFixed(1)}`).join('');
    const area = `${line(1)}L${x(fc.hours.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;

    // Contiguous school-hours bands.
    const bands: [number, number][] = [];
    fc.hours.forEach((h, i) => {
      if (!h.school_hours) return;
      const last = bands[bands.length - 1];
      if (last && last[1] === i - 1) last[1] = i;
      else bands.push([i, i]);
    });
    const crossing = fc.first_crossing?.time ? fc.hours.findIndex((h) => h.time === fc.first_crossing!.time) : -1;
    const ticks = fc.hours.map((h, i) => ({ i, hour: Number(h.time.slice(11, 13)) })).filter((t) => t.hour % 6 === 0);
    const step = top > 300 ? 100 : top > 150 ? 50 : 30;
    const yTicks = Array.from({ length: Math.floor(top / step) }, (_, k) => (k + 1) * step);
    return { advisory, restricted, x, y, line, area, bands, crossing, ticks, yTicks, top };
  }, [fc]);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!fc) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (fc.hours.length - 1));
    setHover(Math.min(fc.hours.length - 1, Math.max(0, i)));
  };
  const point = fc && hover != null ? fc.hours[hover] : null;

  return (
    <section className="wrap scroll-mt-24 pt-28" id="forecast">
      <Reveal>
        <SectionHead kicker="The forecast · GET /forecast" title={<>The next 48 hours of <em className="font-normal">air</em></>}>
          Hourly PM2.5 for the school&rsquo;s grid point. The thresholds only decide advisory and restricted periods
          within what the order allows. Saans never declares a GRAP stage.
        </SectionHead>
      </Reveal>

      <Reveal delay={0.1} className="sheet mt-8 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full border-[1.5px] border-ink p-0.5" role="group" aria-label="Forecast source">
            {(['live', 'replay'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                aria-pressed={source === s}
                className={cn(
                  'min-h-9 cursor-pointer rounded-full px-4 text-[14px] font-semibold transition-colors',
                  source === s ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
                )}
              >
                {s === 'live' ? 'Live forecast' : 'Replay scenario'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-soft">
            {isFetching && <span className="text-breath"><BreathRing size={14} /></span>}
            {fc && <Tag>{fc.source === 'replay' ? 'Replay' : 'Live'}</Tag>}
            {data?.origin === 'snapshot' && <Tag>Snapshot</Tag>}
            <Tag>modelled</Tag>
            <span>{fc?.model}</span>
          </div>
        </div>

        {isPending ? (
          <div className="loading-sweep h-[300px] rounded-md bg-paper-2" />
        ) : isError || !fc || !chart ? (
          <p className="py-12 text-center text-ink-soft">The forecast could not be loaded.</p>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full touch-none"
              role="img"
              aria-label={`Hourly PM2.5 forecast, ${fc.label}. Peak ${Math.round(Math.max(...fc.hours.map((h) => h.pm25)))} micrograms per cubic metre.`}
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            >
              {chart.bands.map(([a, b]) => (
                <rect key={a} x={chart.x(a)} y={PAD.t} width={Math.max(2, chart.x(b) - chart.x(a))} height={H - PAD.t - PAD.b} className="fill-paper-2" />
              ))}
              {chart.yTicks.map((v) => (
                <g key={v}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={chart.y(v)} y2={chart.y(v)} className="stroke-ink/10" />
                  <text x={PAD.l - 8} y={chart.y(v) + 4} textAnchor="end" className="fill-ink-soft font-mono text-[11px]">{v}</text>
                </g>
              ))}
              {chart.ticks.map((t) => (
                <text key={t.i} x={chart.x(t.i)} y={H - 10} textAnchor="middle" className="fill-ink-soft font-mono text-[11px]">
                  {String(t.hour).padStart(2, '0')}:00
                </text>
              ))}

              <motion.path
                key={`area-${source}`}
                d={chart.area}
                className="fill-haze/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
              {/* Faint +20% line: the pessimistic forecast a swap must also pass. */}
              <path d={chart.line(1.2)} fill="none" className="stroke-ink/30" strokeWidth={1.2} strokeDasharray="3 5" />
              <motion.path
                key={`line-${source}`}
                d={chart.line(1)}
                fill="none"
                className="stroke-ink"
                strokeWidth={2.4}
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
              />

              {([['Advisory', chart.advisory, 'stroke-saffron'], ['Restricted', chart.restricted, 'stroke-danger']] as const).map(([name, v, stroke]) => (
                <g key={name}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={chart.y(v)} y2={chart.y(v)} className={stroke} strokeWidth={1.5} strokeDasharray="7 5" />
                  <text x={W - PAD.r - 4} y={chart.y(v) - 6} textAnchor="end" className="fill-ink font-mono text-[11.5px] font-semibold">
                    {name} {v}
                  </text>
                </g>
              ))}

              {chart.crossing >= 0 && (
                <g>
                  <line x1={chart.x(chart.crossing)} x2={chart.x(chart.crossing)} y1={PAD.t} y2={H - PAD.b} className="stroke-danger" strokeWidth={1.5} />
                  <text
                    x={chart.x(chart.crossing) + (chart.crossing > fc.hours.length * 0.7 ? -6 : 6)}
                    y={PAD.t + 12}
                    textAnchor={chart.crossing > fc.hours.length * 0.7 ? 'end' : 'start'}
                    className="fill-danger font-mono text-[11.5px] font-semibold"
                  >
                    First crosses {fc.first_crossing!.threshold}
                  </text>
                </g>
              )}

              {point && hover != null && (
                <g>
                  <line x1={chart.x(hover)} x2={chart.x(hover)} y1={PAD.t} y2={H - PAD.b} className="stroke-seal" strokeWidth={1} />
                  <circle cx={chart.x(hover)} cy={chart.y(point.pm25)} r={5} className="fill-paper-light stroke-seal" strokeWidth={2.5} />
                </g>
              )}
            </svg>

            {point && hover != null && (
              <div
                className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-ink bg-paper-light px-2.5 py-1.5 text-[12.5px] shadow-(--fold)"
                style={{ left: `${Math.min(88, Math.max(12, (chart.x(hover) / W) * 100))}%` }}
              >
                <span className="num font-semibold">{point.pm25} µg/m³</span>
                <span className="num block text-ink-soft">
                  {fmtDateTime(point.time).replace(/:\d\d$/, '')}{point.school_hours ? ' · school hours' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-(--rule) pt-4 text-[13px] text-ink-soft">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-ink" /> PM2.5, hourly mean</span>
          <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t border-dashed border-ink/50" /> +20% pessimistic</span>
          <span className="flex items-center gap-1.5"><span className="size-3 bg-paper-2 ring-1 ring-(--rule)" /> School hours</span>
          {fc?.first_crossing && !fc.first_crossing.time && <span>No restricted crossing in this window.</span>}
          {fc && <span className="ml-auto num">generated {fmtDateTime(fc.generated_at)} IST</span>}
        </div>
      </Reveal>
    </section>
  );
}

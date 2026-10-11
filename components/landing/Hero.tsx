'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight, MousePointer2 } from 'lucide-react';
import { BreathRing, StageChip, Tag } from '@/components/shell/primitives';
import { StageSlider } from '@/components/landing/StageSlider';
import { Counters } from '@/components/landing/Counters';
import { useRehearsal } from '@/lib/rehearsal';
import { useUi } from '@/lib/store';
import { sameOrderGroup, stageByNumber } from '@/lib/stage';
import { translate, useT } from '@/lib/i18n';
import type { StageNumber } from '@/lib/types';

const SchoolScene = dynamic(() => import('@/components/landing/SchoolScene').then((m) => m.SchoolScene), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-breath"><BreathRing size={44} /></div>
  ),
});

const HEADLINE = ['Bad air.', 'Better day.'];

export function Hero() {
  const { stage, plan, planStage, loading, origin } = useRehearsal();
  const setStage = useUi((s) => s.setStage);
  const { t, lang } = useT();
  const meta = stageByNumber(stage);
  // The headline stays in English; the line under it is Hindi, or Tamil when Tamil is selected.
  const second = lang === 'ta' ? 'ta' : 'hi';

  // The stage lives in the URL (/?stage=3) so a demo link opens on the right moment.
  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get('stage'));
    if (n >= 1 && n <= 4) setStage(n as StageNumber);
  }, [setStage]);

  const outdoor = plan ? plan.plan_a.length : 6;
  const indoor = plan ? plan.plan_b.length : 0;
  const neighbour = stage % 2 === 1 ? stage + 1 : stage - 1;
  const samePlan = sameOrderGroup(stage, neighbour as StageNumber);

  return (
    <section className="relative overflow-hidden">
      <div className="wrap grid items-center gap-x-10 gap-y-6 pb-10 pt-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:pt-16">
        {/* ── Copy ─────────────────────────────────────────── */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap gap-2"
          >
            <span className="chip">Delhi-NCR · GRAP I–IV</span>
            <span className="chip chip-quiet">Wired to the live API</span>
          </motion.div>

          <h1 className="display text-[clamp(3rem,9vw,7rem)]">
            {HEADLINE.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className="block"
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.08 + i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {i === 1 ? <em className="font-normal text-breath-ink">{line}</em> : line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            key={second}
            lang={second}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="display-hi mt-3 text-[clamp(1.5rem,3.4vw,2.4rem)] text-ink-soft"
          >
            {translate(second, 'hero')}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-6 max-w-[46ch] text-[19px] leading-snug"
            lang={lang}
          >
            {t('subline')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a href="#plan" className="btn btn-ink btn-lg">
              See the re-plan <ArrowDown className="size-4" />
            </a>
            <Link href="/today" className="btn btn-act btn-lg">
              Approve as principal <ArrowRight className="size-4" />
            </Link>
            <Link href="/receipt" className="btn btn-lg">Verify a receipt</Link>
          </motion.div>
        </div>

        {/* ── The school, live in 3D ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="scene-fade relative -mx-4 h-[clamp(340px,52vw,620px)] lg:-mx-10"
        >
          <SchoolScene stage={stage} outdoorClasses={outdoor} className="absolute inset-0" />

          <div className="pointer-events-none absolute left-4 top-3 flex flex-col items-start gap-2 lg:left-12">
            <StageChip stage={meta} />
            {plan?.forecast?.is_replay && <span className="chip chip-saffron">Replay scenario</span>}
            {origin === 'snapshot' && <span className="chip chip-quiet">Snapshot</span>}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${outdoor}-${indoor}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="sheet pointer-events-none absolute bottom-4 right-4 max-w-[250px] px-3.5 py-3 text-[13.5px] leading-snug shadow-(--lift) lg:right-12"
            >
              <span className="label mb-1 block">Demo school · 6 PE classes</span>
              <span className="num text-[15px] font-semibold text-breath-ink">{indoor} in the hall</span>
              <span className="text-ink-soft"> · </span>
              <span className="num text-[15px] font-semibold">{outdoor} on the ground</span>
            </motion.div>
          </AnimatePresence>

          <span className="pointer-events-none absolute bottom-4 left-12 hidden items-center gap-1.5 font-mono text-[11.5px] text-ink-soft lg:flex">
            <MousePointer2 className="size-3.5" /> move to look around
          </span>
        </motion.div>
      </div>

      {/* ── The slider and its live numbers ─────────────────── */}
      <div className="wrap pb-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="sheet relative px-5 pb-5 pt-6 shadow-(--lift) sm:px-8"
        >
          <div className="mb-3 flex items-center justify-end gap-2 sm:absolute sm:right-8 sm:top-5 sm:mb-0">
            {loading && <span className="text-breath"><BreathRing size={16} /></span>}
            <Tag>{t('rehearsal')}</Tag>
          </div>

          <div className="grid gap-8">
            <StageSlider className="mx-auto w-full max-w-[760px]" />
            {plan ? (
              <Counters plan={plan} className={loading ? 'opacity-70 transition-opacity' : 'transition-opacity'} />
            ) : (
              <div className="loading-sweep h-[92px] rounded-md bg-paper-2" />
            )}
          </div>

          <AnimatePresence initial={false}>
            {plan && planStage === stage && (
              <motion.p
                key={stage}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-[15px] text-ink-soft"
                lang={lang}
              >
                <span className="mt-4 block border-l-2 border-ink pl-3">
                  {samePlan && t(stage <= 2 ? 'samePlanLow' : 'samePlanHigh', { other: stageByNumber(neighbour).code })}{' '}
                  {stage <= 2
                    ? 'At Stages I and II the order permits outdoor PE, so the forecast decides each period.'
                    : 'From Stage III the order decides, and a clean forecast can never relax it.'}
                </span>
              </motion.p>
            )}
          </AnimatePresence>

          {/* Announced to screen readers after each re-plan. */}
          <p className="sr-only" aria-live="polite">
            {plan && planStage === stage
              ? `Stage ${meta.code}: ${plan.plan_a.length} moved, ${plan.plan_b.length} replaced indoors, ${plan.pe_minutes.kept_active} of ${plan.pe_minutes.scheduled} PE minutes kept.`
              : ''}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

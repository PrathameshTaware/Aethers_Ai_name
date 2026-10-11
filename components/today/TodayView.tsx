'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, ChevronRight, KeyRound, Play, Share2, TriangleAlert, X } from 'lucide-react';
import { BreathRing, Reveal, StageChip, Stamp, Tag, TiltCard } from '@/components/shell/primitives';
import { CountUp } from '@/components/landing/Counters';
import { api, ApiError } from '@/lib/api';
import { useMounted } from '@/lib/hooks';
import { useT, type CopyKey } from '@/lib/i18n';
import { stageByCode } from '@/lib/stage';
import type { ApprovalAction, Decision, NoticeText, Watch } from '@/lib/types';
import { addDays, cn, fmtDate, fmtInt, humanise, istDate } from '@/lib/utils';

const APPROVAL_WINDOW_S = 60;
const ROLE = { principal: 'principal', vice_principal: 'vice-principal' } as Record<string, string>;

/** Statuses after which the workflow will not ask anyone again. */
const CLOSED = ['APPROVED_AND_NOTIFIED', 'CLOSED_NO_CHANGE', 'REJECTED_NO_BROADCAST', 'FAILSAFE_TIMEOUT', 'WORKFLOW_ERROR'];
const isOpen = (d: Decision | undefined) => !!d && !CLOSED.includes(d.status);

type Phase = 'planned' | 'principal' | 'vice' | 'approved' | 'failsafe';

function phaseOf(d: Decision): Phase {
  if (d.status === 'APPROVED_AND_NOTIFIED' || d.status.startsWith('APPROVE_PLAN')) return 'approved';
  if (['REJECTED_NO_BROADCAST', 'FAILSAFE_TIMEOUT', 'WORKFLOW_ERROR', 'REJECT'].includes(d.status)) return 'failsafe';
  if (d.approval?.waiting_for_role === 'vice_principal') return 'vice';
  if (d.approval) return 'principal';
  return 'planned';
}

export function TodayView() {
  const { t, lang } = useT();
  const qc = useQueryClient();
  const mounted = useMounted();
  const [picked, setDate] = useState<string | null>(null);
  // The evening run plans the next school day, so the brief opens on tomorrow (IST).
  const date = picked ?? (mounted ? istDate(1) : null);

  const decision = useQuery({
    queryKey: ['decision', date],
    queryFn: ({ signal }) => api.decision(date!, signal),
    enabled: !!date,
    retry: false,
    // While a run is in flight the brief changes every few seconds.
    refetchInterval: (q) => (isOpen(q.state.data) ? 2000 : false),
  });
  const err = decision.error instanceof ApiError ? decision.error : null;
  const keyMissing = err?.code === 'admin_key_missing';
  const noDecision = err?.status === 404;

  const start = useMutation({
    mutationFn: () => api.startRun({ date: date! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decision', date] }),
  });
  // After Start, poll until the planner has stored the decision (about 5 to 10 s).
  const planning = start.isSuccess && noDecision;
  useEffect(() => {
    if (!planning) return;
    const id = setInterval(() => qc.invalidateQueries({ queryKey: ['decision', date] }), 2000);
    return () => clearInterval(id);
  }, [planning, qc, date]);
  useEffect(() => start.reset(), [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const d = decision.data;

  return (
    <div className="wrap pb-10 pt-10">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-ink pb-6">
          <div>
            <p className="label mb-2 flex items-center gap-2">
              Principal&rsquo;s brief · GET /decisions <span className="chip chip-saffron">Demo mode</span>
            </p>
            <h1 className="display text-[clamp(2.4rem,6vw,4.4rem)]">
              A person <em className="font-normal text-[#9a5200]">decides</em>.
            </h1>
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="School day">
            <button type="button" className="btn btn-quiet size-11 !px-0" onClick={() => date && setDate(addDays(date, -1))} aria-label="Previous day">
              <ChevronLeft className="size-5" />
            </button>
            <div className="min-w-[150px] text-center">
              <p className="label">School day</p>
              <p className="display text-[24px]">{date ? fmtDate(date) : '…'}</p>
            </div>
            <button type="button" className="btn btn-quiet size-11 !px-0" onClick={() => date && setDate(addDays(date, 1))} aria-label="Next day">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="min-w-0 space-y-8">
          {keyMissing ? (
            <SetupCard />
          ) : !date || decision.isPending ? (
            <div className="loading-sweep h-72 rounded-md bg-paper-2" aria-label="Loading the brief" />
          ) : d ? (
            <>
              <Stepper decision={d} />
              <DecisionCard decision={d} date={date} onChanged={() => qc.invalidateQueries({ queryKey: ['decision', date] })} />
              {d.notices
                ? <Notices notices={d.notices} receiptId={d.receipt_id} />
                : phaseOf(d) === 'approved' && (
                  <p className="sheet-2 p-5 text-[15px] text-ink-soft">
                    <strong className="text-ink">The notices were drafted and their hashes are in the receipt.</strong>{' '}
                    This deployment of the API does not return the notice text to the brief yet (it ships with the
                    backend change in <span className="num">services/notify/handler.py</span>).
                  </p>
                )}
            </>
          ) : noDecision ? (
            <Reveal now className="sheet p-8">
              {planning ? (
                <div className="flex items-center gap-5 text-breath">
                  <BreathRing size={44} />
                  <div className="text-ink">
                    <p className="display text-[28px]">Planning…</p>
                    <p className="text-ink-soft">The workflow is loading the order, the rules and the forecast. About ten seconds.</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="label mb-2">Nothing on record</p>
                  <h2 className="display text-[32px]">No decision for {fmtDate(date)} yet.</h2>
                  <p className="mt-2 max-w-[56ch] text-ink-soft">
                    The scheduled run plans the next school day at 19:30 IST. For the demo you can start one now.
                    It uses the labelled replay forecast, and one run is allowed per school, date and session.
                  </p>
                  <button type="button" className="btn btn-act btn-lg mt-6" onClick={() => start.mutate()} disabled={start.isPending}>
                    {start.isPending ? <BreathRing size={18} /> : <Play className="size-4" />}
                    <span lang={lang}>{t('startRun')}</span>
                  </button>
                  {start.isSuccess && start.data.status === 'duplicate_suppressed' && (
                    <p className="mt-4 text-[15px] text-ink-soft">
                      This decision already has a run ({start.data.existing_status?.toLowerCase() ?? 'status unknown'}), so nothing new was started.
                    </p>
                  )}
                  {start.error && <RunError error={start.error} date={date} />}
                </>
              )}
            </Reveal>
          ) : (
            <div className="sheet flex flex-col items-start gap-3 p-6">
              <p className="flex items-center gap-2 font-semibold text-danger"><TriangleAlert className="size-5" /> Error: the brief could not be loaded.</p>
              <p className="text-ink-soft">{decision.error?.message}</p>
              <button type="button" className="btn" onClick={() => decision.refetch()}>Try again</button>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <WatchCards disabled={keyMissing} onPick={setDate} />
          <Reveal className="sheet-2 p-5 text-[14.5px]">
            <p className="label mb-2">What this page can do</p>
            <p className="text-ink-soft">
              It reads the demo school&rsquo;s brief and can start a demo run through this site&rsquo;s server, which holds the
              admin key. Approving uses the single-use link from the brief. Roles are recorded, never names.
            </p>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}

function SetupCard() {
  return (
    <Reveal now className="sheet p-8">
      <span className="mb-4 grid size-12 place-items-center rounded-full border-[1.5px] border-ink bg-saffron-tint"><KeyRound className="size-5" /></span>
      <h2 className="display text-[32px]">The brief needs the admin key.</h2>
      <p className="mt-2 max-w-[60ch] text-ink-soft">
        <span className="num">GET /decisions</span> returns approval links, so the API protects it with a key.
        This site forwards it from the server so it never reaches the browser. It is not set on this server.
      </p>
      <pre className="mt-5 overflow-x-auto rounded bg-ink p-4 font-mono text-[13px] leading-relaxed text-paper">
{`# .env.local  (git-ignored)
SAANS_ADMIN_KEY=<the AdminApiKey the stack was deployed with>`}
      </pre>
      <p className="mt-4 text-[15px] text-ink-soft">
        Then restart <span className="num">npm run dev</span>. Everything that does not need the key works now:{' '}
        <Link href="/" className="prose-link">rehearse a stage</Link> or <Link href="/receipt" className="prose-link">verify a receipt</Link>.
      </p>
    </Reveal>
  );
}

function RunError({ error, date }: { error: Error; date: string }) {
  const notDeployed = error instanceof ApiError && error.code === 'route_not_deployed';
  return (
    <div className="mt-5 border-l-2 border-danger pl-4 text-[15px]">
      <p className="flex items-center gap-2 font-semibold text-danger"><TriangleAlert className="size-4" /> Error: the run was not started.</p>
      {notDeployed ? (
        <>
          <p className="mt-1 text-ink-soft">
            The deployed API does not have <span className="num">POST /runs</span> yet. It is in this repo
            (<span className="num">services/workflow/runs.py</span>) and ships with the next deploy. Until then, start a run with:
          </p>
          <pre className="mt-3 overflow-x-auto rounded bg-ink p-3 font-mono text-[12px] leading-relaxed text-paper">
{`aws lambda invoke --function-name <TriggerFunctionName> \\
  --cli-binary-format raw-in-base64-out \\
  --payload '{"tenant_id":"TENANT#demo","date":"${date}","forecast_source":"replay"}' out.json`}
          </pre>
        </>
      ) : (
        <p className="mt-1 text-ink-soft">{error.message}</p>
      )}
    </div>
  );
}

const STEPS: { id: Phase | 'end'; label: string }[] = [
  { id: 'planned', label: 'Planned' },
  { id: 'principal', label: 'Principal asked' },
  { id: 'vice', label: 'Vice-principal asked' },
  { id: 'end', label: 'Approved or fail-safe' },
];

function Stepper({ decision }: { decision: Decision }) {
  const phase = phaseOf(decision);
  // A run that closed without change never asked anyone; one the principal answered never escalated.
  const nobodyAsked = decision.status === 'CLOSED_NO_CHANGE';
  const ended = phase === 'approved' || phase === 'failsafe' || nobodyAsked;
  const at = ended ? 3 : STEPS.findIndex((s) => s.id === phase);
  const skipped = (i: number) =>
    ended && ((i === 1 && nobodyAsked) || (i === 2 && (nobodyAsked || decision.decided_by_role === 'principal')));
  return (
    <ol className="grid grid-cols-4" aria-label="Workflow progress">
      {STEPS.map((s, i) => {
        const skip = skipped(i);
        const done = !skip && (i < at || (ended && i === at));
        const active = i === at && !ended;
        const label = i === 3 && ended
          ? (nobodyAsked ? 'Closed: no change needed' : phase === 'approved' ? 'Approved' : 'Fail-safe: nothing sent')
          : s.label;
        return (
          <li key={s.id} className="relative pr-3">
            <span className="absolute left-0 right-0 top-[13px] h-0.5 bg-(--rule-strong)" aria-hidden />
            <motion.span
              className={cn('absolute left-0 top-[13px] h-0.5', phase === 'failsafe' && i === 3 ? 'bg-saffron' : 'bg-breath')}
              initial={false}
              animate={{ width: done || active ? '100%' : '0%' }}
              transition={{ duration: 0.6 }}
              aria-hidden
            />
            <span
              className={cn(
                'relative grid size-7 place-items-center rounded-full border-[1.5px] bg-paper font-mono text-[12px]',
                done ? (phase === 'failsafe' && i === 3 ? 'border-ink bg-saffron text-ink' : 'border-breath-ink bg-breath text-white')
                  : active ? 'border-ink text-ink' : 'border-(--rule-strong) text-ink-soft',
              )}
            >
              {done ? <Check className="size-3.5" /> : active ? <BreathRing size={12} /> : skip ? '–' : i + 1}
            </span>
            <span className={cn('mt-2 block text-[13px] leading-tight', done || active ? 'font-semibold' : 'text-ink-soft')} aria-current={active ? 'step' : undefined}>
              {label}
            </span>
            {(i === 1 || i === 2) && <span className="num block text-[11px] text-ink-soft">{skip ? 'not needed' : '60 s'}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Countdown({ expiresAt, onExpire }: { expiresAt: number; onExpire: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, expiresAt - Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      const next = Math.max(0, expiresAt - Date.now() / 1000);
      setLeft(next);
      if (next === 0) {
        clearInterval(id);
        onExpire();
      }
    }, 200);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const R = 46;
  const C = 2 * Math.PI * R;
  const frac = Math.min(1, left / APPROVAL_WINDOW_S);
  const urgent = left <= 10;
  return (
    <div className={cn('relative grid size-[120px] shrink-0 place-items-center', urgent ? 'text-danger' : 'text-ink')} role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
      <svg viewBox="0 0 108 108" className="absolute inset-0 -rotate-90">
        <circle cx="54" cy="54" r={R} fill="none" strokeWidth="5" className="stroke-paper-2" />
        <circle cx="54" cy="54" r={R} fill="none" strokeWidth="5" strokeLinecap="round" stroke="currentColor"
          strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: 'stroke-dashoffset 200ms linear' }} />
      </svg>
      <motion.span
        className="num text-[38px] font-medium leading-none"
        animate={urgent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={urgent ? { duration: 0.5, repeat: Infinity } : undefined}
      >
        {Math.ceil(left)}
      </motion.span>
      <span className="num absolute bottom-6 text-[10px] uppercase tracking-widest text-ink-soft">sec</span>
    </div>
  );
}

const APPROVE_ERRORS: Record<number, CopyKey> = { 410: 'linkInvalid', 409: 'runEnded' };

function DecisionCard({ decision: d, date, onChanged }: { decision: Decision; date: string; onChanged: () => void }) {
  const { t, lang } = useT();
  const plan = d.plan;
  const phase = phaseOf(d);
  const stage = stageByCode(plan?.declared_stage);

  const act = useMutation({
    mutationFn: (action: ApprovalAction) => api.approve(d.approval!.approve_url, action),
    onSettled: onChanged,
  });
  const actErr = act.error instanceof ApiError ? act.error : null;
  // Both approve actions take the same notify path; the choice is recorded in the audit chain.
  const approveAction: ApprovalAction = plan && plan.plan_a.length > 0 ? 'APPROVE_PLAN_A' : 'APPROVE_PLAN_B';
  const role = d.approval ? ROLE[d.approval.waiting_for_role] ?? d.approval.waiting_for_role : null;

  return (
    <Reveal now>
      <article className="sheet relative overflow-hidden p-6 shadow-(--lift) sm:p-8">
        <header className="flex flex-wrap items-center gap-2">
          <StageChip stage={stage} />
          <span className="chip">{fmtDate(date)} · morning session</span>
          <span className="chip chip-quiet">{humanise(d.status)}</span>
          {plan?.forecast?.is_replay && <Tag>Replay scenario</Tag>}
        </header>

        {plan && (
          <dl className="mt-6 grid grid-cols-3 divide-x divide-(--rule) border-y border-(--rule-strong)">
            {[
              ['Moved to a cleaner slot', plan.plan_a.length, 'periods'],
              ['Replaced indoors', plan.plan_b.length, 'periods'],
              ['PE minutes kept', plan.pe_minutes?.kept_active ?? 0, `of ${plan.pe_minutes?.scheduled ?? 0}`],
            ].map(([label, value, unit]) => (
              <div key={label as string} className="px-4 py-4 first:pl-0">
                <dt className="label">{label}</dt>
                <dd className="mt-1 flex items-baseline gap-2">
                  <span className="text-[40px] font-medium leading-none"><CountUp value={value as number} /></span>
                  <span className="num text-[12.5px] text-ink-soft">{unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}

        {plan?.exposure_averted_modelled && (
          <p className="mt-4 text-[15px] text-ink-soft">
            <span className="num text-ink">{fmtInt(plan.exposure_averted_modelled.value)}</span> µg/m³·min of PM2.5 exposure averted{' '}
            <Tag>modelled</Tag> · outdoor exposure cut by <span className="num text-ink">{Math.round(plan.exposure_reduction_pct)}%</span>
          </p>
        )}

        {/* ── Pending: a real workflow is waiting for this click ── */}
        {d.approval && !act.isSuccess && (
          <div className="mt-8 flex flex-col gap-6 border-t-2 border-ink pt-6 sm:flex-row sm:items-center">
            <Countdown key={d.approval.expires_at} expiresAt={d.approval.expires_at} onExpire={onChanged} />
            <div className="min-w-0 flex-1">
              <p className="display text-[26px] leading-tight" lang={lang}>{t('waiting', { role: role! })}</p>
              <p className="mt-1 text-[15px] text-ink-soft" lang={lang}>
                {d.approval.waiting_for_role === 'principal'
                  ? t('doNothing')
                  : 'If the vice-principal does not answer either, the run fails safe and nothing is sent.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className="btn btn-act btn-lg" disabled={act.isPending} onClick={() => act.mutate(approveAction)}>
                  {act.isPending && act.variables !== 'REJECT' ? <BreathRing size={18} /> : <Check className="size-5" />}
                  <span lang={lang}>{t('approve')}</span>
                </button>
                <button type="button" className="btn btn-quiet btn-lg" disabled={act.isPending} onClick={() => act.mutate('REJECT')}>
                  {act.isPending && act.variables === 'REJECT' ? <BreathRing size={18} /> : <X className="size-5" />}
                  <span lang={lang}>{t('reject')}</span>
                </button>
              </div>
              {actErr && (
                <p className="mt-4 flex items-start gap-2 text-[15px] font-medium text-danger" role="alert" lang={lang}>
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  {APPROVE_ERRORS[actErr.status] ? t(APPROVE_ERRORS[actErr.status]) : actErr.status >= 500 || actErr.status === 0 ? t('retry') : actErr.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Outcome ─────────────────────────────────────── */}
        <AnimatePresence>
          {(phase === 'approved' || phase === 'failsafe' || act.isSuccess) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex flex-wrap items-center gap-5 border-t-2 border-ink pt-6">
              {phase === 'approved' || (act.isSuccess && act.data.action !== 'REJECT') ? (
                <>
                  <Stamp tone="breath"><Check className="size-4" /> Approved</Stamp>
                  <p className="text-[15px]">
                    by the <strong>{ROLE[d.decided_by_role ?? act.data?.approver_role ?? ''] ?? 'approver'}</strong>.{' '}
                    {d.status === 'APPROVED_AND_NOTIFIED' ? 'Notices were drafted in English and Hindi.' : 'Drafting the notices…'}
                  </p>
                </>
              ) : (
                <>
                  <Stamp tone="saffron">{d.status === 'FAILSAFE_TIMEOUT' ? 'Fail-safe' : d.status === 'WORKFLOW_ERROR' ? 'Stopped' : 'Rejected'}</Stamp>
                  <p className="text-[15px]" lang={lang}>{t('failSafe')}</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'planned' && !d.approval && !act.isSuccess && (
          <p className="mt-6 flex items-center gap-3 border-t border-(--rule) pt-5 text-ink-soft">
            {d.status === 'CLOSED_NO_CHANGE'
              ? <><Check className="size-5 text-breath-ink" /> No change was needed, so nobody was asked and nothing was sent.</>
              : <><span className="text-breath"><BreathRing size={18} /></span> Planned. Waiting for the workflow to ask for approval…</>}
          </p>
        )}

        <footer className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
          {d.receipt_id && (
            <Link href={`/receipt/${d.receipt_id}`} className="group flex items-center gap-1.5 font-semibold text-seal">
              Open the receipt <span className="num font-normal">{d.receipt_id}</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          {plan && (
            <Link href={`/?stage=${stage.n}#plan`} className="prose-link">See this stage&rsquo;s timetable and traces</Link>
          )}
        </footer>
      </article>
    </Reveal>
  );
}

function Notices({ notices, receiptId }: { notices: NonNullable<Decision['notices']>; receiptId?: string | null }) {
  const { t } = useT();
  const [audience, setAudience] = useState<'parents' | 'teachers'>('parents');
  const [nlang, setNlang] = useState<'english' | 'hindi'>('english');
  const notice: NoticeText = audience === 'teachers' ? notices.teacher : notices[nlang];
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(notice.notice_text).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Reveal now>
      <section className="grid items-start gap-8 md:grid-cols-[auto_1fr]" aria-label="Drafted notices">
        <div className="tilt-scene justify-self-center">
          <motion.div className="phone" initial={{ rotateY: -18, rotateX: 6 }} whileInView={{ rotateY: -6, rotateX: 2 }} whileHover={{ rotateY: 0, rotateX: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
            <div className="phone-screen flex flex-col">
              <div className="flex items-center gap-2 bg-breath-ink px-4 py-3 text-white">
                <span className="grid size-8 place-items-center rounded-full bg-white/20 text-[13px] font-semibold">S</span>
                <span className="text-[14px] font-semibold">Demo School · {audience === 'parents' ? 'Parents' : 'Teachers'}</span>
              </div>
              <div className="flex-1 p-3">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={notice.text_sha256}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    lang={notice.language === 'hindi' ? 'hi' : 'en'}
                    className="whitespace-pre-wrap break-words rounded-lg rounded-tl-none bg-white p-3 text-[13.5px] leading-relaxed shadow-(--fold)"
                  >
                    {notice.notice_text}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="label mb-2">Drafted notices</p>
            <h2 className="display text-[32px]">Ready to share. <span className="font-normal text-ink-soft">{t('nothingPushed')}</span></h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Segmented value={audience} onChange={setAudience} options={[['parents', 'Parents'], ['teachers', 'Teachers']]} label="Audience" />
            {audience === 'parents' && (
              <Segmented value={nlang} onChange={setNlang} options={[['english', 'English'], ['hindi', 'हिन्दी']]} label="Notice language" />
            )}
          </div>
          <p className="text-[15px]">
            <span className="chip mr-2">{notice.fallback_used ? notice.template_id : notice.model_id}</span>
            {notice.fallback_used ? t('provenance') : `Written by Bedrock ${notice.model_id}`}
          </p>
          <div className="flex flex-wrap gap-3">
            <a className="btn btn-act" href={notice.whatsapp_click_to_share_url} target="_blank" rel="noreferrer">
              <Share2 className="size-4" /> {t('share')}
            </a>
            <button type="button" className="btn" onClick={copy}>{copied ? <><Check className="size-4" /> Copied</> : 'Copy the text'}</button>
          </div>
          {receiptId && (
            <p className="border-l-2 border-seal pl-3 text-[15px] text-ink-soft">
              Copy the text, then{' '}
              <Link href={`/receipt/${receiptId}#check`} className="prose-link">paste it into the receipt to check it</Link>.
              Change one character and the match fails.
            </p>
          )}
        </div>
      </section>
    </Reveal>
  );
}

function Segmented<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; options: [T, string][]; label: string;
}) {
  return (
    <div className="flex rounded-full border-[1.5px] border-ink p-0.5" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={cn('min-h-9 cursor-pointer rounded-full px-4 text-[14px] font-semibold transition-colors', value === v ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink')}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function WatchCards({ disabled, onPick }: { disabled: boolean; onPick: (date: string) => void }) {
  const watch = useQuery({ queryKey: ['watch'], queryFn: ({ signal }) => api.watch(signal), enabled: !disabled, retry: false });
  const watches = useMemo(() => watch.data?.watches ?? [], [watch.data]);

  return (
    <Reveal now>
      <p className="label mb-3">Forecast watch · GET /watch</p>
      {disabled ? (
        <p className="sheet-2 p-4 text-[14.5px] text-ink-soft">Needs the admin key.</p>
      ) : watch.isPending ? (
        <div className="loading-sweep h-28 rounded-md bg-paper-2" />
      ) : watch.isError ? (
        <p className="sheet-2 p-4 text-[14.5px] text-ink-soft">The watch could not be loaded.</p>
      ) : watches.length === 0 ? (
        <p className="sheet-2 p-4 text-[14.5px] text-ink-soft">
          No contingency drafts. The watch rehearses the next two school days at 16:30 IST.
        </p>
      ) : (
        <ul className="space-y-5">
          {watches.map((w: Watch) => (
            <li key={w.date}>
              <TiltCard shadow={w.risk === 'act' ? 'var(--color-saffron)' : 'var(--color-haze)'}>
                <button type="button" onClick={() => onPick(w.date)} className="block w-full cursor-pointer p-4 text-left">
                  <span className="flex items-center justify-between gap-2">
                    <span className="display text-[22px]">{fmtDate(w.date)}</span>
                    <Tag>Draft, not active</Tag>
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-[14px]">
                    <span className={cn('chip', w.risk === 'act' ? 'chip-saffron' : 'chip-quiet')}>Risk: {w.risk}</span>
                    {typeof w.peak_pm25 === 'number' && <span className="num text-ink-soft">peak {Math.round(w.peak_pm25)} µg/m³</span>}
                    {w.forecast_source && <span className="num text-ink-soft">{w.forecast_source}</span>}
                  </span>
                </button>
              </TiltCard>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[13px] text-ink-soft">The watch never declares a stage, never notifies anyone and never creates a decision.</p>
    </Reveal>
  );
}

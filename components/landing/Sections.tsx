'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Fingerprint, UserCheck } from 'lucide-react';
import { BreathRing, Reveal, SectionHead, Stamp, TiltCard } from '@/components/shell/primitives';
import { useHealth } from '@/components/shell/StatusChip';
import { useRehearsal } from '@/lib/rehearsal';
import { fmtInt, shortHash } from '@/lib/utils';

/** A marquee of facts read from the live API, never invented. */
export function Ticker() {
  const { data } = useHealth();
  const { plan } = useRehearsal();
  const c = data?.data.checks;

  const facts = [
    'Order first, forecast second',
    c?.declared_stage?.stage && `Declared stage on record: ${c.declared_stage.stage}`,
    c?.ruleset && `Ruleset ${c.ruleset.version} · ${c.ruleset.rules} rules, each with a verbatim quote`,
    'Re-plan, do not cancel',
    plan && `${plan.pe_minutes.kept_active} of ${plan.pe_minutes.scheduled} PE minutes kept active`,
    c?.audit && `${c.audit.rows} audit rows · chain ${c.audit.chain_valid ? 'verifies' : 'BROKEN'} · head ${shortHash(c.audit.head_hash, 8)}`,
    'A person decides. No answer means nothing is sent',
    c?.bedrock && (c.bedrock.usable ? `Notices drafted by ${c.bedrock.model}` : 'Notices use the labelled static template'),
    'No child-level data',
  ].filter(Boolean) as string[];

  return (
    <div className="ticker relative z-10 overflow-hidden border-y-2 border-ink bg-ink py-3 text-paper" aria-label="Live system facts">
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {facts.map((f) => (
              <li key={f} className="flex items-center gap-6 pr-6 font-mono text-[13px] uppercase tracking-wider">
                <span>{f}</span>
                <span className="size-1.5 rounded-full bg-saffron" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

const PROOFS = [
  {
    n: '01',
    icon: FileText,
    title: 'Order first',
    body: 'A clean forecast can never relax a stage ban. Each period is classified from the order before the forecast is considered.',
    href: '/#plan',
    cta: 'Open a decision trace',
    shadow: 'var(--color-aqi-severe)',
  },
  {
    n: '02',
    icon: UserCheck,
    title: 'A person decides',
    body: 'Nothing is sent without an approval. The principal has 60 seconds, then the vice-principal, then the run fails safe.',
    href: '/today',
    cta: 'Approve a real run',
    shadow: 'var(--color-saffron)',
  },
  {
    n: '03',
    icon: Fingerprint,
    title: 'Anyone can verify',
    body: 'Every step is a row in a SHA-256 hash chain. Your browser recomputes every hash, and can check a notice you received.',
    href: '/receipt',
    cta: 'Verify a receipt',
    shadow: 'var(--color-seal)',
  },
];

export function ProofCards() {
  return (
    <section className="wrap pt-28">
      <Reveal>
        <SectionHead kicker="Three promises" title={<>Each one is <em className="font-normal">checkable</em></>} />
      </Reveal>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {PROOFS.map((p, i) => (
          <Reveal key={p.n} delay={i * 0.1}>
            <TiltCard shadow={p.shadow}>
              <Link href={p.href} className="group flex h-full flex-col gap-4 p-6">
                <div className="tilt-pop flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-full border-[1.5px] border-ink bg-paper-2">
                    <p.icon className="size-5" />
                  </span>
                  <span className="num text-[40px] font-medium leading-none text-ink/15">{p.n}</span>
                </div>
                <h3 className="display tilt-pop text-[28px]">{p.title}</h3>
                <p className="flex-1 text-[16px] text-ink-soft">{p.body}</p>
                <span className="flex items-center gap-1.5 font-semibold text-breath-ink">
                  {p.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const FLOW = [
  { t: '19:30 IST', h: 'A run starts for tomorrow', d: 'One run per school, date and session. Duplicates are refused.' },
  { t: 'Load', h: 'Order, rules, timetable, forecast', d: 'The declared stage, the validated ruleset and the PM2.5 forecast.' },
  { t: 'Plan', h: 'Move, or replace indoors', d: 'A cleaner permitted slot first, then an indoor active session in the cleanest free room.' },
  { t: '60 s', h: 'Ask the principal', d: 'No answer escalates to the vice-principal. Still none: fail safe, nothing sent.' },
  { t: 'Draft', h: 'Notices in English and Hindi', d: 'Returned as WhatsApp share links. Nothing is pushed to phones.' },
  { t: 'Prove', h: 'Append to the hash chain', d: 'A public receipt re-verifies every row in the browser.' },
];

const LIMITS = [
  'The forecast is modelled: CAMS data via Open-Meteo for one grid point, not a ground station.',
  'Model-based rule extraction via Bedrock is strictly verified against verbatim quotes in code.',
  'Notices are drafted as WhatsApp click-to-share links and verified with receipts.',
  'No pilot has run with a real school, and no school or student counts are claimed.',
  'Immutable anchors: daily audit chain heads are locked in S3 Object Lock (Compliance mode) for 365 days.',
];

export function HowItWorks() {
  const { plan } = useRehearsal();
  const { data } = useHealth();
  const bedrock = data?.data.checks.bedrock;
  const averted = plan?.exposure_averted_modelled;

  return (
    <section className="wrap scroll-mt-24 pt-28" id="how">
      <Reveal>
        <SectionHead kicker="How it works" title={<>What happens on a <em className="font-normal">bad-air day</em></>}>
          A serverless workflow on AWS Lambda, Step Functions and DynamoDB. Every arrow below is a row in the audit chain.
        </SectionHead>
      </Reveal>

      <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {FLOW.map((s, i) => (
          <Reveal as="li" key={s.h} delay={(i % 3) * 0.08} className="relative border-t border-(--rule-strong) pt-4">
            <motion.span
              className="absolute -top-px left-0 h-0.5 bg-breath"
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.12 }}
            />
            <div className="flex items-baseline gap-3">
              <span className="num text-[13px] text-ink-soft">{String(i + 1).padStart(2, '0')}</span>
              <span className="chip">{s.t}</span>
            </div>
            <h3 className="display mt-3 text-[24px] leading-tight">{s.h}</h3>
            <p className="mt-1.5 text-[15.5px] text-ink-soft">{s.d}</p>
          </Reveal>
        ))}
      </ol>

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        <Reveal className="sheet p-6">
          <p className="label mb-4">Measured</p>
          <ul className="space-y-3 text-[16px]">
            <li><strong>PE minutes</strong> moved, replaced and lost, counted from the timetable.</li>
            <li><strong>Clashes.</strong> A swap is rejected if it double-books a teacher or a venue, or touches a locked period.</li>
            <li><strong>Every audit row</strong>, recomputed in your browser with Web Crypto.</li>
            <li><strong>Who wrote each notice:</strong> the model ID or template ID, and the SHA-256 of the exact text.</li>
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="sheet-2 p-6">
          <p className="label mb-4">Modelled</p>
          <ul className="space-y-3 text-[16px]">
            <li><strong>The forecast.</strong> One grid point, with a 20% pessimistic margin on every swap.</li>
            <li><strong>Indoor air.</strong> Outdoor PM2.5 × an infiltration factor per ventilation type. An assumption.</li>
            <li>
              <strong>Exposure averted.</strong>{' '}
              {averted
                ? <><span className="num">{fmtInt(averted.value)}</span> µg/m³·min at this stage for the demo school.</>
                : 'Outdoor PM2.5 × minutes before the plan, minus outdoor and indoor after it.'}
            </li>
            <li>
              <strong>Notice writer today:</strong>{' '}
              {bedrock ? (bedrock.usable ? bedrock.model : 'the static template, because Bedrock is not usable on this account.') : 'checking…'}
            </li>
          </ul>
        </Reveal>
      </div>

      <Reveal className="mt-6 border-l-2 border-ink pl-5">
        <p className="label mb-3">Known limitations</p>
        <ul className="grid gap-x-10 gap-y-2 text-[15.5px] text-ink-soft md:grid-cols-2">
          {LIMITS.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </Reveal>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="wrap pt-28">
      <Reveal className="relative overflow-hidden rounded-xl border-2 border-ink bg-ink px-6 py-16 text-center text-paper sm:px-12">
        <span className="absolute -left-10 -top-10 text-breath opacity-50"><BreathRing size={180} /></span>
        <span className="absolute -bottom-16 -right-8 text-saffron opacity-40"><BreathRing size={240} /></span>
        <div className="relative">
          <Stamp tone="saffron" className="stamp-on-ink">Don&rsquo;t trust us</Stamp>
          <h2 className="display mx-auto mt-6 max-w-[14ch] text-[clamp(2.4rem,6vw,4.6rem)]">Verify it yourself.</h2>
          <p className="mx-auto mt-4 max-w-[48ch] text-paper/75">
            Start a run, approve it as the principal, then check the receipt and the notice in your own browser.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/today" className="btn btn-act btn-lg !border-paper">Open today&rsquo;s brief <ArrowRight className="size-4" /></Link>
            <Link href="/receipt" className="btn btn-lg !border-paper">Verify a receipt</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

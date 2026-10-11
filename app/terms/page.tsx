import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Terms' };

const SECTIONS = [
  {
    h: 'A demonstration, not a service',
    p: 'Saans runs on a demo school with a sample timetable. No pilot has run with a real school, and nothing here is live guidance for one.',
  },
  {
    h: 'The order comes first',
    p: 'Saans never declares a GRAP stage. It reads the declared stage and the rules entered from the official circular. A clean forecast can never relax a stage ban.',
  },
  {
    h: 'A person decides',
    p: 'The planner proposes. Nothing is sent without an approval from the principal or vice-principal, and with no answer the run fails safe.',
  },
  {
    h: 'Modelled, not measured',
    p: 'The forecast is CAMS model data for one grid point. Indoor air figures are planning assumptions per ventilation type. A school remains responsible for its own rooms and purifiers.',
  },
  {
    h: 'Tamper-evident, not tamper-proof',
    p: 'The hash chain shows any edit made after a row was written, and anyone can check that in a browser. It cannot stop an edit, because we operate the database.',
  },
];

export default function TermsPage() {
  return (
    <article className="wrap max-w-[860px] pb-10 pt-12">
      <p className="label mb-3">Terms</p>
      <h1 className="display text-[clamp(2.4rem,6vw,4.4rem)]">What Saans does, and does not, claim.</h1>
      <dl className="mt-10 divide-y divide-(--rule-strong) border-y-2 border-ink">
        {SECTIONS.map((s, i) => (
          <div key={s.h} className="grid gap-2 py-6 md:grid-cols-[56px_1fr_2fr] md:gap-6">
            <span className="num text-[13px] text-ink-soft">{String(i + 1).padStart(2, '0')}</span>
            <dt className="display text-[24px] leading-tight">{s.h}</dt>
            <dd className="text-ink-soft">{s.p}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-[15px] text-ink-soft">
        The code is MIT licensed. See also <Link href="/privacy" className="prose-link">privacy</Link>.
      </p>
    </article>
  );
}

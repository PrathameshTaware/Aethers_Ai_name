import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy' };

const SECTIONS = [
  {
    h: 'No child-level data',
    p: 'Timetables are class-level. Teachers appear as codes. Students with respiratory conditions are stored as one count per class, and those counts never enter public responses or the public audit chain.',
  },
  {
    h: 'Roles, not names',
    p: 'The audit chain records “principal” or “vice_principal”, never a person. The approver’s authority is read from the single-use link, not from anything typed into a form.',
  },
  {
    h: 'Notices are drafted, not delivered',
    p: 'Approved plans produce WhatsApp click-to-share links. Nothing is pushed to phones, and Saans holds no parent contact list.',
  },
  {
    h: 'What this site stores in your browser',
    p: 'Your language choice and the receipt IDs you opened, in local storage on this device. Nothing else, and no analytics.',
  },
  {
    h: 'What has not been done',
    p: 'A data-protection review under India’s DPDP Act has not been done. It is required before any real pilot with a school.',
  },
];

export default function PrivacyPage() {
  return (
    <article className="wrap max-w-[860px] pb-10 pt-12">
      <p className="label mb-3">Privacy</p>
      <h1 className="display text-[clamp(2.4rem,6vw,4.4rem)]">Counts only. Roles only.</h1>
      <p className="mt-4 max-w-[60ch] text-[19px] leading-snug text-ink-soft">
        Saans is a demonstration running on one demo school. This page says plainly what it keeps.
      </p>
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
        See also the <Link href="/terms" className="prose-link">terms</Link> and{' '}
        <Link href="/#how" className="prose-link">what is measured and what is modelled</Link>.
      </p>
    </article>
  );
}

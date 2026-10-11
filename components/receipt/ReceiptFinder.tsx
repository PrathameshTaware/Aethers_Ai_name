'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Fingerprint } from 'lucide-react';
import { BreathRing, Reveal, Stamp } from '@/components/shell/primitives';
import { recentReceipts } from '@/components/receipt/ReceiptView';
import { api, ApiError } from '@/lib/api';
import { useMounted } from '@/lib/hooks';
import { fmtDate, humanise, istDate } from '@/lib/utils';

const RECEIPT_ID = /^[A-Za-z0-9_-]{8,32}$/;

/** `/receipt`: enter a receipt ID, or jump to the receipts of the decisions on record. */
export function ReceiptFinder() {
  const router = useRouter();
  const [id, setId] = useState('');
  const mounted = useMounted();
  const recent = useMemo(() => (mounted ? recentReceipts() : []), [mounted]);
  const dates = useMemo(() => (mounted ? [istDate(2), istDate(1), istDate(0)] : []), [mounted]);

  // The brief (admin proxy) knows the receipt ID for each decided day.
  const decisions = useQueries({
    queries: dates.map((date) => ({
      queryKey: ['decision', date],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.decision(date, signal),
      retry: false,
    })),
  });
  const found = decisions.flatMap((q, i) => (q.data?.receipt_id ? [{ date: dates[i], d: q.data }] : []));
  const proxyOff = decisions.some((q) => q.error instanceof ApiError && q.error.code === 'admin_key_missing');
  const valid = RECEIPT_ID.test(id.trim());

  return (
    <div className="wrap grid gap-12 pb-10 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
      <div>
        <Reveal>
          <p className="label mb-3">Public receipt verifier</p>
          <h1 className="display text-[clamp(2.8rem,7vw,5.4rem)]">
            Don&rsquo;t trust us. <em className="font-normal text-seal">Verify.</em>
          </h1>
          <p className="mt-5 max-w-[50ch] text-[19px] leading-snug text-ink-soft">
            Every decision leaves a receipt. Your browser downloads the school&rsquo;s whole audit chain and recomputes
            every SHA-256 hash itself. Then paste a notice you received and see if it is on the record.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <form
            className="mt-10 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) router.push(`/receipt/${id.trim()}`);
            }}
          >
            <label className="flex-1">
              <span className="label mb-1.5 block">Receipt ID</span>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="12-character code"
                spellCheck={false}
                autoComplete="off"
                className="num h-14 w-full rounded-full border-[1.5px] border-ink bg-paper-light px-6 text-[18px] focus:border-seal"
              />
            </label>
            <button type="submit" className="btn btn-seal btn-lg self-end" disabled={!valid}>
              <Fingerprint className="size-5" /> Verify
            </button>
          </form>
          <p className="mt-2 text-[13px] text-ink-soft">
            The ID is the short code at the end of the link on a notice: <span className="num">…/verify/&lt;ID&gt;</span>
          </p>
        </Reveal>

        {recent.length > 0 && (
          <Reveal delay={0.15} className="mt-8">
            <p className="label mb-2">Opened on this device</p>
            <ul className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <li key={r}><Link href={`/receipt/${r}`} className="chip chip-quiet cursor-pointer !normal-case hover:border-ink">{r}</Link></li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>

      <Reveal delay={0.2}>
        <div className="sheet p-6 shadow-(--lift)">
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Decisions on record</p>
            {decisions.some((q) => q.isPending) && dates.length > 0 && <span className="text-breath"><BreathRing size={14} /></span>}
          </div>

          {found.length > 0 ? (
            <ul className="divide-y divide-(--rule)">
              {found.map(({ date, d }, i) => (
                <motion.li key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Link href={`/receipt/${d.receipt_id}`} className="group flex items-center justify-between gap-4 py-4">
                    <span>
                      <span className="display block text-[22px]">{fmtDate(date)}</span>
                      <span className="text-[13.5px] text-ink-soft">{humanise(d.status)} · <span className="num">{d.receipt_id}</span></span>
                    </span>
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          ) : proxyOff ? (
            <p className="text-[15px] text-ink-soft">
              This list comes from the principal&rsquo;s brief, which needs the admin key on the server.
              Set <span className="num">SAANS_ADMIN_KEY</span> to show it. Receipts themselves are public: enter an ID.
            </p>
          ) : decisions.every((q) => !q.isPending) && dates.length > 0 ? (
            <p className="text-[15px] text-ink-soft">
              No decision has a receipt for today or the next two days.{' '}
              <Link href="/today" className="prose-link">Start a run in today&rsquo;s brief</Link> to create one.
            </p>
          ) : (
            <div className="loading-sweep h-24 rounded bg-paper-2" />
          )}

          <div className="mt-6 border-t border-(--rule) pt-5">
            <Stamp tone="seal" className="!text-[12px]">How it is checked</Stamp>
            <p className="num mt-4 text-[12.5px] leading-relaxed text-ink-soft">
              hash<sub>n</sub> = SHA-256(hash<sub>n−1</sub> + JSON&#123;actor, eventType, payloadDigest, sequence, timestamp&#125;)
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

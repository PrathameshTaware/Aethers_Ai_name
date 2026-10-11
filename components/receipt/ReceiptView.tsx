'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, ClipboardPaste, Fingerprint, Printer, RotateCcw, ShieldAlert, TriangleAlert, X } from 'lucide-react';
import { BreathRing, Reveal, Stamp, Tag } from '@/components/shell/primitives';
import { api, ApiError } from '@/lib/api';
import {
  canHash, matchNotice, payloadOf, recordedNotices, verifyChain, type ChainVerdict, type RecordedNotice,
} from '@/lib/crypto';
import { useT } from '@/lib/i18n';
import type { Receipt, ReceiptBlock } from '@/lib/types';
import { cn, fmtDateTime, fmtInt, humanise, shortHash } from '@/lib/utils';

const RECENT_KEY = 'saans-recent-receipts';

export function rememberReceipt(id: string) {
  try {
    const list: string[] = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    window.localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...list.filter((x) => x !== id)].slice(0, 5)));
  } catch { /* storage unavailable */ }
}

export function recentReceipts(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

const writerOf = (n: RecordedNotice['notice']) =>
  n.fallback_used ? `static template ${n.template_id ?? ''}`.trim() : `Bedrock ${n.model_id}`;

export function ReceiptView({ id }: { id: string }) {
  const { t, lang } = useT();
  const { data: receipt, isPending, error } = useQuery({
    queryKey: ['receipt', id],
    queryFn: ({ signal }) => api.receipt(id, signal),
    retry: (count, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && count < 1,
  });

  useEffect(() => {
    if (receipt) rememberReceipt(receipt.receiptId);
  }, [receipt]);

  if (isPending) {
    return (
      <div className="grid place-items-center gap-4 py-32 text-breath">
        <BreathRing size={56} />
        <p className="label">Fetching the chain…</p>
      </div>
    );
  }
  if (error || !receipt) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <div className="sheet mx-auto mt-10 max-w-xl p-8">
        <p className="label mb-2">{notFound ? 'No such receipt' : 'Could not load'}</p>
        <h1 className="display text-[32px]">{notFound ? 'There is no receipt with that ID.' : 'The receipt could not be loaded.'}</h1>
        <p className="mt-3 text-ink-soft">
          {notFound
            ? 'Receipt IDs are short codes printed on a notice. Check the code, or open the latest one from today’s brief.'
            : (error as Error)?.message}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/receipt" className="btn">Enter another ID</Link>
          <Link href="/today" className="btn btn-quiet">Today&rsquo;s brief</Link>
        </div>
      </div>
    );
  }
  return <Verifier receipt={receipt} lang={lang} t={t} />;
}

function Verifier({ receipt, t, lang }: { receipt: Receipt; t: ReturnType<typeof useT>['t']; lang: string }) {
  const [blocks, setBlocks] = useState<ReceiptBlock[]>(receipt.blocks);
  const [verdict, setVerdict] = useState<ChainVerdict | null>(null);
  const [originalVerdict, setOriginalVerdict] = useState<ChainVerdict | null>(null);
  // How many blocks the verify cascade has reached; blocks beyond it are still "unchecked".
  const [reached, setReached] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const mine = useMemo(() => new Set(receipt.decisionSequences), [receipt]);
  const tampered = blocks !== receipt.blocks;
  const supported = canHash();

  const run = useCallback(async (list: ReceiptBlock[], from = 0, stepMs = 80) => {
    clearInterval(timer.current);
    const result = await verifyChain(list, receipt.genesisHash);
    setVerdict(result);
    setReached(from);
    timer.current = setInterval(() => {
      setReached((n) => {
        if (n >= list.length) clearInterval(timer.current);
        return Math.min(list.length, n + 1);
      });
    }, stepMs);
    return result;
  }, [receipt.genesisHash]);

  useEffect(() => {
    if (!supported) return;
    // State is only set after the hashes are computed (async), never synchronously in the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run(receipt.blocks).then(setOriginalVerdict);
    return () => clearInterval(timer.current);
  }, [receipt, run, supported]);

  const editActor = (index: number, actor: string) => {
    const next = blocks.map((b, i) => (i === index ? { ...b, actor } : b));
    setBlocks(next);
    // The break cascades down from the edited row, 60 ms a block.
    run(next, index, 60);
  };
  const reset = () => {
    setBlocks(receipt.blocks);
    run(receipt.blocks);
  };

  const done = verdict != null && reached >= blocks.length;
  const firstBadIndex = verdict?.firstBad != null ? blocks.findIndex((b) => b.sequence === verdict.firstBad) : -1;
  const stateOf = (i: number) => (i >= reached ? 'pending' : firstBadIndex >= 0 && i >= firstBadIndex ? 'bad' : 'ok');

  const planRow = receipt.blocks.find((b) => mine.has(b.sequence) && b.eventType === 'PLAN_GENERATED');
  const averted = planRow && payloadOf<{ exposure_averted_modelled?: { value: number; unit: string; basis: string } }>(planRow)?.exposure_averted_modelled;
  const notices = useMemo(() => recordedNotices(receipt.blocks), [receipt]);
  const myNotices = notices.filter((n) => mine.has(n.block.sequence));
  const serverOk = receipt.serverVerification.valid;
  const disagree = done && !tampered && (verdict!.firstBad === null) !== serverOk;

  return (
    <div className="wrap pb-10 pt-10">
      <Reveal now>
        <div className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-ink pb-6">
          <div>
            <p className="label mb-2">Public receipt · GET /receipts/{receipt.receiptId}</p>
            <h1 className="display text-[clamp(2.4rem,6vw,4.4rem)]">
              What the school did, <em className="font-normal text-seal">proven</em>.
            </h1>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <button type="button" className="btn btn-quiet" onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </button>
            <a className="btn btn-quiet" href={api.verifyPageUrl(receipt.receiptId)} target="_blank" rel="noreferrer">
              Backend&rsquo;s own verifier <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        {/* ── The chain ───────────────────────────────────── */}
        <div>
          <div className="sheet sticky top-20 z-20 mb-6 flex flex-wrap items-center justify-between gap-4 p-4 shadow-(--lift)">
            <div className="flex min-h-12 items-center gap-4">
              {!supported ? (
                <p className="flex items-center gap-2 text-danger">
                  <TriangleAlert className="size-5" /> This browser cannot compute SHA-256 here (needs HTTPS). Nothing was verified.
                </p>
              ) : !done ? (
                <span className="flex items-center gap-3 text-seal">
                  <BreathRing size={22} fast />
                  <span className="num text-[14px]">recomputing {Math.min(reached + 1, blocks.length)} / {blocks.length}</span>
                </span>
              ) : verdict!.firstBad === null ? (
                <>
                  <Stamp tone="seal" key="ok"><Check className="size-4" /> Verified</Stamp>
                  <span className="text-[15px]" lang={lang}>{t('verified')}</span>
                </>
              ) : (
                <>
                  <Stamp tone="danger" key="bad"><ShieldAlert className="size-4" /> Chain broken</Stamp>
                  <span className="text-[15px]">Broken at row #{verdict!.firstBad}: the log was changed after it was written.</span>
                </>
              )}
            </div>
            <div className="no-print flex gap-2">
              {tampered && (
                <button type="button" className="btn" onClick={reset}><RotateCcw className="size-4" /> Reset</button>
              )}
              <button type="button" className="btn btn-seal" onClick={() => run(blocks)} disabled={!supported}>
                <Fingerprint className="size-4" /> <span lang={lang}>{t('verify')}</span>
              </button>
            </div>
          </div>

          <p className="mb-2 flex flex-wrap items-center gap-2 text-[14px] text-ink-soft">
            <span className={cn('chip', serverOk ? 'chip-quiet' : 'chip-danger')}>
              Server says: {serverOk ? 'valid' : `broken at #${receipt.serverVerification.brokenSequence}`}
            </span>
            {disagree && <span className="font-semibold text-danger">Error: your browser and the server disagree. Trust your browser.</span>}
            <span lang={lang}>{t('tamperHint')}</span>
          </p>

          {blocks.length === 0 ? (
            <p className="sheet p-6 text-ink-soft">No audit rows yet.</p>
          ) : (
            <ol>
              {blocks.map((b, i) => {
                const state = stateOf(i);
                const problems = verdict?.problems[i] ?? [];
                return (
                  <li key={b.sequence}>
                    {i > 0 && <div className="chain-link" data-state={state} />}
                    <motion.article
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.5) }}
                      data-state={state}
                      className={cn('chain-block sheet p-4', mine.has(b.sequence) && 'ring-1 ring-ink')}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'grid size-9 shrink-0 place-items-center rounded-full border-[1.5px] font-mono text-[13px] font-semibold transition-colors',
                            state === 'ok' && 'border-seal bg-seal text-white',
                            state === 'bad' && 'border-danger bg-danger text-white',
                            state === 'pending' && 'border-(--rule-strong) text-ink-soft',
                          )}>
                            {state === 'ok' ? <Check className="size-4" aria-label="verified" /> : state === 'bad' ? <X className="size-4" aria-label="broken" /> : b.sequence}
                          </span>
                          <div>
                            <p className="font-semibold leading-tight">{humanise(b.eventType)}</p>
                            <p className="num text-[12px] text-ink-soft">#{b.sequence} · {fmtDateTime(b.timestamp)} IST</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {mine.has(b.sequence) && <Tag>this decision</Tag>}
                          <label className="no-print flex items-center gap-1.5 text-[12px] text-ink-soft">
                            <span className="label !text-[10.5px]">role</span>
                            <input
                              value={b.actor}
                              onChange={(e) => editActor(i, e.target.value)}
                              spellCheck={false}
                              aria-label={`Role recorded in row ${b.sequence}. Edit to tamper.`}
                              className="num w-[168px] rounded border border-dashed border-(--rule-strong) bg-paper px-2 py-1 text-[13px] text-ink focus:border-solid focus:border-seal"
                            />
                          </label>
                        </div>
                      </div>

                      <dl className="num mt-3 grid gap-x-4 gap-y-0.5 text-[12px] text-ink-soft sm:grid-cols-[auto_1fr]">
                        <dt>hash</dt><dd className="truncate text-ink">{b.hash}</dd>
                        <dt>prev</dt><dd className="truncate">{b.previousHash}</dd>
                      </dl>

                      <AnimatePresence>
                        {state === 'bad' && (
                          <motion.ul
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 overflow-hidden text-[13.5px] font-medium text-danger"
                          >
                            {problems.length
                              ? problems.map((p) => <li key={p}>✕ Broken: {p}</li>)
                              : <li>✕ Broken: follows a row that no longer verifies</li>}
                          </motion.ul>
                        )}
                      </AnimatePresence>

                      {b.payloadJson && (
                        <details className="mt-2 text-[13px]">
                          <summary className="cursor-pointer text-breath-ink">What was recorded</summary>
                          <pre className="hide-scrollbar mt-2 max-h-72 overflow-auto rounded bg-paper-2 p-3 font-mono text-[11.5px] leading-relaxed">
                            {JSON.stringify(payloadOf(b), null, 2)}
                          </pre>
                        </details>
                      )}
                    </motion.article>
                  </li>
                );
              })}
            </ol>
          )}

          <p className="mt-6 text-[13px] text-ink-soft"><strong>Method.</strong> {receipt.hashing}</p>
        </div>

        {/* ── Side: facts, notice check, provenance ─────────── */}
        <aside className="space-y-6">
          <Reveal now className="sheet p-5">
            <p className="label mb-3">This receipt</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[14px]">
              <dt className="text-ink-soft">Receipt</dt><dd className="num break-all">{receipt.receiptId}</dd>
              <dt className="text-ink-soft">School</dt><dd className="num">{receipt.schoolId}</dd>
              <dt className="text-ink-soft">Decision</dt><dd className="num break-all">{receipt.decisionId.split('#').slice(2).join(' · ')}</dd>
              <dt className="text-ink-soft">Status</dt>
              <dd>{receipt.decisionStatus ? <span className="chip">{humanise(receipt.decisionStatus)}</span> : '—'}</dd>
              <dt className="text-ink-soft">Rows</dt><dd className="num">{receipt.decisionSequences.join(', ') || '—'} of {receipt.blocks.length}</dd>
              <dt className="text-ink-soft">Head</dt><dd className="num">{shortHash(receipt.auditHead, 16)}</dd>
            </dl>
            {(receipt.decisionStatus === 'FAILSAFE_TIMEOUT' || receipt.decisionStatus === 'REJECTED_NO_BROADCAST') && (
              <p className="mt-4 border-t border-(--rule) pt-4 text-[15px]" lang={lang}>
                <Stamp tone="saffron" className="mb-2 !text-[12px]">Fail-safe</Stamp><br />{t('failSafe')}
              </p>
            )}
          </Reveal>

          {averted && (
            <Reveal now className="sheet-2 p-5">
              <p className="label mb-2">Exposure averted <Tag className="ml-1">modelled</Tag></p>
              <p className="display text-[44px] leading-none">{fmtInt(averted.value)}</p>
              <p className="num mt-1 text-[13px]">µg/m³·min of PM2.5</p>
              <p className="mt-3 text-[13px] text-ink-soft">{averted.basis}</p>
            </Reveal>
          )}

          <NoticeCheck notices={notices} chainOk={originalVerdict?.firstBad === null} disabled={!supported} />

          <Reveal now className="sheet p-5">
            <p className="label mb-3">Who wrote the notices</p>
            {myNotices.length === 0 ? (
              <p className="text-[14.5px] text-ink-soft">
                No notices were drafted for this decision. Notices are only drafted after an approval.
              </p>
            ) : (
              <ul className="space-y-3">
                {myNotices.map(({ notice: n, block }) => (
                  <li key={n.text_sha256} className="border-l-2 border-ink pl-3 text-[14px]">
                    <p className="font-semibold capitalize">{n.language} · {n.audience} <span className="num font-normal text-ink-soft">row #{block.sequence}</span></p>
                    <p>{n.fallback_used ? 'Static template (labelled fallback)' : `Written by Bedrock ${n.model_id}`}</p>
                    <p className="num text-[12px] text-ink-soft">
                      {n.fallback_used ? n.template_id : `prompt ${shortHash(n.prompt_sha256, 12)}`} · text {shortHash(n.text_sha256, 12)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <p className="text-[13px] text-ink-soft">
            Tamper-evident, not tamper-proof. The chain shows any edit, but we operate the database.
          </p>
        </aside>
      </div>
    </div>
  );
}

/** A parent pastes the notice they received; the browser hashes it and finds the row that recorded it. */
function NoticeCheck({ notices, chainOk, disabled }: { notices: RecordedNotice[]; chainOk: boolean; disabled: boolean }) {
  const { t, lang } = useT();
  const [text, setText] = useState('');
  const [match, setMatch] = useState<{ text: string; hit: RecordedNotice | null } | null>(null);
  const checkable = !!text.trim() && !disabled;

  useEffect(() => {
    if (!checkable) return;
    let stale = false;
    matchNotice(text, notices).then((hit) => !stale && setMatch({ text, hit }));
    return () => { stale = true; };
  }, [text, notices, checkable]);

  // undefined: nothing to check yet. null: checked, not on record.
  const hit = checkable && match?.text === text ? match.hit : undefined;

  const paste = async () => {
    try {
      setText(await navigator.clipboard.readText());
    } catch { /* clipboard permission denied: the person can paste by hand */ }
  };

  return (
    <Reveal now className="rounded-md border-2 border-ink bg-paper-light p-5 shadow-[6px_6px_0_var(--color-seal)]">
      <div id="check" className="scroll-mt-28">
        <p className="label mb-1">Check a notice you received</p>
        <p className="mb-3 text-[15px]" lang={lang}>{t('noticeCheck')}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          disabled={disabled}
          placeholder="Paste the full message here…"
          aria-label="Notice text"
          className="w-full resize-y rounded border border-(--rule-strong) bg-paper p-3 text-[14px] leading-relaxed focus:border-seal"
        />
        <div className="no-print mt-2 flex items-center justify-between gap-2">
          <button type="button" className="btn btn-quiet !min-h-9 text-[13px]" onClick={paste}>
            <ClipboardPaste className="size-4" /> Paste
          </button>
          <span className="num text-[12px] text-ink-soft">{notices.length} notices on record</span>
        </div>

        <div className="mt-4 min-h-[76px]" aria-live="polite">
          <AnimatePresence mode="wait">
            {hit === undefined ? null : hit === null ? (
              <motion.p key="miss" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [0, -5, 5, -3, 0] }} exit={{ opacity: 0 }} className="flex items-start gap-2 font-medium text-danger">
                <X className="mt-0.5 size-5 shrink-0" />
                <span><span lang={lang}>{t('notFound')}</span> <span className="font-normal text-ink-soft">It may have been edited or did not come from this school.</span></span>
              </motion.p>
            ) : (
              <motion.div key={hit.notice.text_sha256} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {chainOk
                  ? <Stamp tone="breath"><Check className="size-4" /> Genuine</Stamp>
                  : <p className="flex items-center gap-2 font-semibold text-danger"><TriangleAlert className="size-5" /> Text matches, but the log itself is broken.</p>}
                <p className="text-[14.5px]">
                  {chainOk && <span lang={lang}>{t('genuine')} </span>}
                  This is the <strong>{hit.notice.language} {hit.notice.audience}</strong> notice recorded in row{' '}
                  <span className="num">#{hit.block.sequence}</span>, written by {writerOf(hit.notice)}.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Reveal>
  );
}

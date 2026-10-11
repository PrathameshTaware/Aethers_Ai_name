'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { useT } from '@/lib/i18n';

const CIRCULAR = 'https://edudel.nic.in/upload/upload_2025_26/40_dt_17012025sch.pdf';

export function Footer() {
  const { t, lang } = useT();
  return (
    <footer className="no-print relative z-10 mt-32 border-t-2 border-ink bg-paper-2">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="display text-[clamp(1.5rem,3vw,2.2rem)] leading-tight" lang={lang}>{t('footer')}</p>
          <p className="max-w-[52ch] text-[15px] text-ink-soft">
            Forecasts are CAMS model data for one grid point. Indoor air figures are planning assumptions.
            We operate the database, so the chain shows any edit but cannot prevent one. A data-protection
            review under the DPDP Act has not been done and is required before any real pilot.
          </p>
        </div>

        <div>
          <p className="label mb-3">Go to</p>
          <ul className="space-y-2 text-[15px]">
            <li><Link className="prose-link" href="/">Rehearse a stage</Link></li>
            <li><Link className="prose-link" href="/today">Today&rsquo;s brief and approval</Link></li>
            <li><Link className="prose-link" href="/receipt">Verify a receipt</Link></li>
            <li><Link className="prose-link" href="/#how">How it works</Link></li>
            <li><Link className="prose-link" href="/privacy">Privacy</Link> · <Link className="prose-link" href="/terms">Terms</Link></li>
          </ul>
        </div>

        <div>
          <p className="label mb-3">Sources</p>
          <ul className="space-y-2 text-[15px]">
            <li>
              <a className="prose-link inline-flex items-center gap-1" href={CIRCULAR} target="_blank" rel="noreferrer">
                DoE Delhi circular No. 40 <ArrowUpRight className="size-3.5" />
              </a>
            </li>
            <li>
              <a className="prose-link inline-flex items-center gap-1" href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noreferrer">
                Open-Meteo air quality (CAMS) <ArrowUpRight className="size-3.5" />
              </a>
            </li>
            <li>
              <a className="prose-link inline-flex items-center gap-1" href={`${API_BASE}/health`} target="_blank" rel="noreferrer">
                Live API health <ArrowUpRight className="size-3.5" />
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-(--rule)">
        <div className="wrap flex flex-wrap items-center justify-between gap-2 py-4 font-mono text-[12px] text-ink-soft">
          <span>Saans · Delhi-NCR GRAP I–IV · MIT licence</span>
          <span>No child-level data. Roles, not names.</span>
        </div>
      </div>
    </footer>
  );
}

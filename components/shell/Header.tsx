'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BreathRing } from '@/components/shell/primitives';
import { StatusChip } from '@/components/shell/StatusChip';
import { useUi, type Lang } from '@/lib/store';
import { isLang, LANGS, useT, type CopyKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const NAV: { href: string; key: CopyKey; match: (p: string) => boolean }[] = [
  { href: '/', key: 'navRehearse', match: (p) => p === '/' },
  { href: '/today', key: 'navToday', match: (p) => p.startsWith('/today') },
  { href: '/receipt', key: 'navReceipt', match: (p) => p.startsWith('/receipt') },
  { href: '/#how', key: 'navHow', match: () => false },
];

function IstClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata',
      }).format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="num hidden whitespace-nowrap text-[12.5px] text-ink-soft xl:inline" aria-label="Time in India">
      {now ?? '--:--'} IST
    </span>
  );
}

function Nav({ pathname, variant }: { pathname: string; variant: 'desktop' | 'mobile' }) {
  const { t, lang } = useT();
  if (variant === 'mobile') {
    return (
      <nav className="wrap flex gap-1 overflow-x-auto pb-2 md:hidden" aria-label="Primary mobile">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-[14px] font-medium',
              item.match(pathname) ? 'border-ink bg-paper-light' : 'border-transparent text-ink-soft',
            )}
          >
            <span lang={lang}>{t(item.key)}</span>
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors',
              active ? 'text-ink' : 'text-ink-soft hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-full border-[1.5px] border-ink bg-paper-light"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative" lang={lang}>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// usePathname is only known at request time on dynamic routes, so it streams in behind Suspense.
function ActiveNav({ variant }: { variant: 'desktop' | 'mobile' }) {
  return <Nav pathname={usePathname() ?? '/'} variant={variant} />;
}

export function Header() {
  const { lang } = useT();
  const setLang = useUi((s) => s.setLang);

  useEffect(() => {
    const saved = window.localStorage.getItem('saans-lang');
    if (isLang(saved)) setLang(saved);
  }, [setLang]);

  const pickLang = (next: Lang) => {
    setLang(next);
    window.localStorage.setItem('saans-lang', next);
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-(--rule-strong) bg-paper/90 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3" aria-label="Saans home">
          <span className="grid size-9 place-items-center text-breath">
            <BreathRing size={26} />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="display text-[26px] leading-none">Saans</span>
            <span lang="hi" className="display-hi text-[17px] leading-none text-ink-soft">साँस</span>
          </span>
        </Link>

        <Suspense fallback={<Nav pathname="" variant="desktop" />}>
          <ActiveNav variant="desktop" />
        </Suspense>

        <div className="flex items-center gap-3">
          <IstClock />
          <div className="flex rounded-full border border-(--rule-strong) p-0.5 text-[13px] font-medium" role="group" aria-label="Language">
            {LANGS.map(({ code: l, label }) => (
              <button
                key={l}
                type="button"
                onClick={() => pickLang(l)}
                aria-pressed={lang === l}
                lang={l}
                className={cn(
                  'min-h-8 cursor-pointer rounded-full px-2.5 transition-colors',
                  lang === l ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <StatusChip />
        </div>
      </div>

      <Suspense fallback={<Nav pathname="" variant="mobile" />}>
        <ActiveNav variant="mobile" />
      </Suspense>
    </header>
  );
}

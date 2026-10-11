import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const IST = 'Asia/Kolkata';

/** YYYY-MM-DD for today + `offsetDays` in IST. The evening run plans the next school day. */
export function istDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const fmtDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${isoDate}T00:00:00Z`));

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: IST,
  }).format(new Date(iso));

export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: IST }).format(new Date(iso));

export const fmtInt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

export const shortHash = (hash: string | null | undefined, n = 6) => (hash ? `${hash.slice(0, n)}…` : '—');

/** "Hall_A" → "Hall A" */
export const venueName = (id: string) => id.replace(/_/g, ' ');

/** "RUN_CLOSED_APPROVED_AND_NOTIFIED" → "Run closed approved and notified" */
export function humanise(code: string): string {
  const s = code.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

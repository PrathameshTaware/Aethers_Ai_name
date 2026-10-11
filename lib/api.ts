import type {
  ApprovalAction, Decision, Forecast, Health, Plan, Receipt, RunStarted, Sourced, StageCode, WatchResponse,
} from '@/lib/types';

/** Deployed Saans API (CloudFormation stack `saans`). Public routes send `Access-Control-Allow-Origin: *`. */
export const API_BASE = (
  process.env.NEXT_PUBLIC_SAANS_API || 'https://367bcz1ry5.execute-api.us-east-1.amazonaws.com/Prod'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** The API answers in about a second; a request still open after this has stalled on the network. */
const TIMEOUT_MS = 6000;

/**
 * fetch with a timeout. A stalled connection otherwise never fails, so the UI would sit on its skeleton and the
 * snapshot fallback would never run. A cancel from the caller (React Query) still surfaces as an AbortError.
 */
async function timedFetch(url: string, init?: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const caller = init?.signal;
  const onAbort = () => ctrl.abort();
  if (caller?.aborted) ctrl.abort();
  caller?.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (caller?.aborted) throw e;
    if (ctrl.signal.aborted) throw new ApiError(0, 'timeout', 'The Saans API did not answer in time.');
    throw e;
  } finally {
    clearTimeout(timer);
    caller?.removeEventListener('abort', onAbort);
  }
}

async function request<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
  let res: Response;
  try {
    res = await timedFetch(url, { ...init, headers: { Accept: 'application/json', ...init?.headers } }, timeoutMs);
  } catch (e) {
    if ((e as Error).name === 'AbortError' || e instanceof ApiError) throw e;
    throw new ApiError(0, 'network', 'Could not reach the Saans API.');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // API errors are {error: {code, message}}; API Gateway's own are {message}.
    const err = body?.error;
    throw new ApiError(res.status, err?.code || 'http_error', err?.message || body?.message || res.statusText);
  }
  return body as T;
}

const postJson = (body: unknown, signal?: AbortSignal): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
  signal,
});

/**
 * Fallback ladder: the live API, then a saved copy of a real response in /public/snapshot.
 * A snapshot is only ever used after a fetch fails, and the caller labels it SNAPSHOT.
 */
async function withSnapshot<T>(live: () => Promise<T>, snapshotFile: string): Promise<Sourced<T>> {
  try {
    try {
      return { data: await live(), origin: 'live' };
    } catch (e) {
      // A stalled or dropped connection usually works on a fresh attempt; an HTTP error answer will not.
      if (!(e instanceof ApiError) || e.status !== 0) throw e;
      return { data: await live(), origin: 'live' };
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    const res = await fetch(`/snapshot/${snapshotFile}`).catch(() => null);
    if (!res?.ok) throw e;
    return { data: (await res.json()) as T, origin: 'snapshot' };
  }
}

export const api = {
  /** POST /rehearse: what-if plan for a stage. No side effects on the backend. */
  rehearse: (stage: StageCode, signal?: AbortSignal) =>
    withSnapshot<Plan>(
      () => request(`${API_BASE}/rehearse`, postJson({ stage, forecast_source: 'replay' }, signal)),
      `rehearse_${stage}.json`,
    ),

  /** GET /forecast: hourly PM2.5 with thresholds. */
  forecast: (source: 'live' | 'replay', signal?: AbortSignal) =>
    withSnapshot<Forecast>(
      () => request(`${API_BASE}/forecast?hours=48&source=${source}`, { signal }),
      `forecast_${source}.json`,
    ),

  /** GET /health. A 503 still carries a body worth showing, so it is not treated as a failure. */
  health: (signal?: AbortSignal) =>
    withSnapshot<Health>(async () => {
      const res = await timedFetch(`${API_BASE}/health`, { signal });
      const body = await res.json();
      if (!body?.status) throw new ApiError(res.status, 'http_error', 'Unexpected /health response.');
      return body as Health;
    }, 'health.json'),

  /** GET /receipts/{id}: the tenant's whole chain plus the server's verdict. */
  receipt: (id: string, signal?: AbortSignal) =>
    request<Receipt>(`${API_BASE}/receipts/${encodeURIComponent(id)}`, { signal }),

  /** The backend's own standalone verifier page for a receipt. */
  verifyPageUrl: (id: string) => `${API_BASE}/verify/${encodeURIComponent(id)}`,

  /** POST /approve/{shortId}: the single-use link from the brief. Authority comes from the link itself. */
  approve: (approveUrl: string, action: ApprovalAction) =>
    request<{ status: string; decision_id: string; action: ApprovalAction; approver_role: string; decided_at: string }>(
      approveUrl, postJson({ action }),
    ),

  // Admin routes go through this app's server proxy, which adds x-saans-admin-key. The key never reaches the browser.
  decision: (date: string, signal?: AbortSignal) =>
    request<Decision>(`/api/admin/decisions?date=${date}`, { signal }),

  watch: (signal?: AbortSignal) => request<WatchResponse>('/api/admin/watch', { signal }),

  // Starting a run goes server proxy -> API -> Step Functions; allow it longer than a read.
  startRun: (body: { date: string; stage?: StageCode }) =>
    request<RunStarted>('/api/admin/runs', postJson(body), 20_000),
};

import { fail, ISO_DATE, TENANT, upstream } from '../upstream';

const MIN_GAP_MS = 30_000;
let lastStart = 0;

/** POST /api/admin/runs {date, stage?} → POST /runs. Starts a demo run; at most one every 30 s. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !ISO_DATE.test(body.date ?? '')) return fail(400, 'invalid_date', "'date' must be YYYY-MM-DD.");
  if (body.stage != null && !['I', 'II', 'III', 'IV'].includes(body.stage)) {
    return fail(400, 'invalid_stage', "'stage' must be I, II, III or IV.");
  }

  const wait = lastStart + MIN_GAP_MS - Date.now();
  if (wait > 0) {
    return fail(429, 'rate_limited', `A demo run was just started. Try again in ${Math.ceil(wait / 1000)} s.`);
  }

  const res = await upstream('/runs', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: `TENANT#${TENANT}`, date: body.date, session: 'MORN', forecast_source: 'replay',
      ...(body.stage ? { stage: body.stage } : {}),
    }),
  });
  if (res.ok) lastStart = Date.now();
  return res;
}

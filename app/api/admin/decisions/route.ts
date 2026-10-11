import { fail, ISO_DATE, TENANT, upstream } from '../upstream';

/** GET /api/admin/decisions?date=YYYY-MM-DD → GET /decisions (the principal's brief). */
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? '';
  if (!ISO_DATE.test(date)) return fail(400, 'invalid_date', "'date' must be YYYY-MM-DD.");
  return upstream(`/decisions?tenant=${TENANT}&date=${date}&session=MORN`);
}

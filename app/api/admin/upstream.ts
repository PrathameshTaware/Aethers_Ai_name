import { API_BASE } from '@/lib/api';

// Server-side proxy to the admin-key routes of the Saans API. The key is read from the server
// environment and never reaches the browser bundle. The proxy is deliberately reachable without
// login: it exposes only "read the demo school's brief" and "start a demo run".

export const TENANT = 'demo';

const fail = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

export async function upstream(path: string, init?: RequestInit): Promise<Response> {
  const key = process.env.SAANS_ADMIN_KEY;
  if (!key) {
    return fail(503, 'admin_key_missing', 'SAANS_ADMIN_KEY is not set on this server, so the brief cannot be read.');
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-saans-admin-key': key },
      cache: 'no-store',
    });
  } catch {
    return fail(502, 'upstream_unreachable', 'Could not reach the Saans API.');
  }

  const body = await res.json().catch(() => null);
  // API Gateway answers an undeployed route with 403 {"message": "Missing Authentication Token"}.
  if (res.status === 403 && body?.message === 'Missing Authentication Token') {
    return fail(501, 'route_not_deployed', `The deployed API has no ${init?.method ?? 'GET'} ${path.split('?')[0]} route yet.`);
  }
  return Response.json(body ?? { error: { code: 'bad_upstream', message: 'Unexpected response.' } }, { status: res.status });
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export { fail };

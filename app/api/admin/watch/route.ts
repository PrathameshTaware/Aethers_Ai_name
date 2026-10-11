import { TENANT, upstream } from '../upstream';

/** GET /api/admin/watch → GET /watch (contingency drafts for the next two school days). */
export async function GET(request: Request) {
  void request.url; // read at request time, never prerendered
  return upstream(`/watch?tenant=${TENANT}`);
}

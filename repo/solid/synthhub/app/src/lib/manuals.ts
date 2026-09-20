// OFFLINE ADAPTATION (environment/adaptation.patch): GET /api/manuals is an
// on-demand server route (astro node adapter, lib/manuals.server.ts proxies the
// Behringer storefront because the browser is not allowed to). A statically
// served face has no such endpoint at all - the SPA fallback answers the request
// with index.html, res.ok is true, and res.json() throws a SyntaxError that no
// ErrorBoundary catches. The exported shape is unchanged; the lookup resolves
// locally as "no manuals" without issuing a request.
export interface ManualItem {
  title: string | null;
  type: string | null;
  language: string | null;
  filename: string;
  url: string;
}
interface ManualsResult {
  slug: string;
  name: string | null;
  handles?: string[];
  count: number;
  manuals: ManualItem[];
}

export async function fetchManuals(slug: string): Promise<ManualsResult> {
  return { slug, name: null, handles: [], count: 0, manuals: [] };
}

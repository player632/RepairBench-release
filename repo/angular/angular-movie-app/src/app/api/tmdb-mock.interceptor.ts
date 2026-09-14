/**
 * ADAPTATION (repair-bench, environment/adaptation.patch) - offline transport seam for
 * repair-angular__angular-movie-app-01. Registered by src/app/app.module.ts through
 *   { provide: HTTP_INTERCEPTORS, useClass: TmdbMockInterceptor, multi: true }
 * and it answers every request the seed's ApiService (src/app/api/api.service.ts) makes, from the
 * frozen literals in ./tmdb-fixtures.ts.
 *
 * WHY THIS EXISTS. api.service.ts:10-12 hardcodes `apiUrl = 'https://api.themoviedb.org/3'` with
 * `apiKey = ''` - an EMPTY key - so all 20 of its methods fail even with a network, and the built
  *
  *
  *
 * dependencies - fonts, analytics and REMOTE DATA - until the runtime is network-free, and two
  *
 * real interceptor, adds mock.api.interceptor.ts + core/mock/fixture-db.ts) and this seat's own
  *
 *
 * ZERO NETWORK, PROVEN NOT ASSERTED. For any request under the TMDB root this interceptor never
 * calls next.handle(): it constructs the HttpResponse itself. A checkpoint therefore reads
 * foreignRequestCount() === 0 from the performance timeline, and the adapted face's <img> src,
 * <a href>, <iframe src> and <script src> are all same-origin (the adaptation rewrites 24 TMDB
 * image bases, 4 YouTube URLs and 9 external anchors to /rb/*, and deletes GTM/gtag outright).
 * Requests to any OTHER origin are not answered here - they are recorded as `foreign` and passed
 * through, so a future regression that re-introduces a remote call is visible in the log instead of
 * being silently absorbed by the mock.
 *
 * FIDELITY, item by item against the seed's own code:
 *   1. STATUS SEMANTICS. An id outside the fixture universe yields HTTP 404 with TMDB's own body
 *      ({status_code:34,status_message:'The resource you requested could not be found.'}), which is
 *      what makes HttpClient emit an HttpErrorResponse so api.service.ts's `handleError` and every
 *      component's error callback still run. A 200-for-everything mock would delete that whole half
 *      of the code path.
 *   2. A FRESH BODY PER REQUEST. Components MUTATE the response object: movies-info.component.ts:52
 *      does `this.movie_data = result` and then `this.movie_data.videoId = video.key`, and
 *      tv-info/person do the same. Returning one shared frozen object would leak state between
 *      navigations (the second visit to /movie/101 would already have videoId set), so every
 *      response body is deep-copied - exactly as a real JSON round-trip would be.
 *   3. CONSTANT LATENCY. LATENCY_MS is a constant with no jitter. The seed renders transient states
 *      around these calls (ngx-spinner shown in ngOnInit and hidden by a 2000 ms setTimeout in
 *      app/home/movies/tv/person/movie-category, plus `delay(2000)` on the home and movies sliders),
 *      so the reply has to land INSIDE that window for the settled state to be the one measured,
 *      and it has to land the same way every run.
 *   4. THE QUERY STRING IS READ, NOT IGNORED. `page` selects a different frozen batch (page 1 and 2
 *      differ; page 3+ is empty with total_pages 2) because movie-category/tv-category paginate on
 *      scroll, and `query` drives /search/multi. getBackdrops builds `?api_key=` inline in the URL
 *      string rather than through HttpParams, so the resolver parses `urlWithParams`.
 *   5. NOTHING HERE READS COMPONENT STATE and nothing here mutates a request. The only thing this
 *      file writes is the append-only observation channel below.
 *
 * OBSERVATION CHANNEL. `globalThis.__AMA_API__` is written by THIS file and read by the
 * instrumentation bridge (src/app/rb-probe.ts): an append-only record of what the app asked for
 * (path, page, query, matched route, status, ordinal). It is a measurement surface, never an
 * entropy source - no reply body depends on it.
 */
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { resolveTmdb } from './tmdb-fixtures';

/** api.service.ts:10 - the seed's own root, spelled the same way. */
export const TMDB_ROOT = 'https://api.themoviedb.org/3';

/**
 * Constant reply latency in ms. The seed's own transient states are 2000 ms long (ngx-spinner
 * hide timeouts and the `delay(2000)` operators), so 120 ms keeps every reply comfortably inside
 * the settled window while still being a real asynchronous hop - a synchronous reply would change
 * the order in which ngOnInit's subscriptions land and would not be the shape the app is written
 * against. No jitter, so no reading depends on when the run happened.
 */
export const LATENCY_MS = 120;

export interface AmaApiRecord {
  n: number;
  method: string;
  path: string;
  page: string | null;
  query: string | null;
  matched: string;
  status: number;
  at: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __AMA_API__: { requests: AmaApiRecord[]; foreign: string[]; count: number } | undefined;
}

function channel(): { requests: AmaApiRecord[]; foreign: string[]; count: number } {
  const g = globalThis as any;
  if (!g.__AMA_API__) g.__AMA_API__ = { requests: [], foreign: [], count: 0 };
  return g.__AMA_API__;
}

/** Monotonic ordinal, taken from a performance-relative clock so it never depends on the epoch. */
let seq = 0;

@Injectable()
export class TmdbMockInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const ch = channel();
    const full = req.urlWithParams;
    if (!full.startsWith(TMDB_ROOT)) {
      ch.foreign.push(`${req.method} ${full}`.slice(0, 300));
      return next.handle(req);
    }
    let url: URL;
    try {
      url = new URL(full);
    } catch {
      ch.foreign.push(`UNPARSEABLE ${full.slice(0, 300)}`);
      return next.handle(req);
    }
    const res = resolveTmdb(url.pathname, url.searchParams);
    seq += 1;
    ch.count += 1;
    ch.requests.push({
      n: seq,
      method: req.method,
      path: url.pathname,
      page: url.searchParams.get('page'),
      query: url.searchParams.get('query'),
      matched: res.matched,
      status: res.status,
      at: Math.round((typeof performance !== 'undefined' && performance.now ? performance.now() : 0)),
    });
    // A fresh deep copy per request: see FIDELITY item 2 - components mutate the response object.
    const body = res.status === 200 ? JSON.parse(JSON.stringify(res.body)) : JSON.parse(JSON.stringify(res.body));
    return timer(LATENCY_MS).pipe(
      switchMap(() => {
        if (res.status !== 200) {
          return throwError(() => new HttpErrorResponse({
            status: res.status, url: full, statusText: 'Not Found', error: body,
          }));
        }
        return of(new HttpResponse<any>({ status: 200, body, url: full }));
      }),
    );
  }
}

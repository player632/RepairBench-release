/**
 * ADAPTATION (repair-bench, environment/adaptation.patch) - offline transport seam for
 * repair-angular__chatbot-angular-palm-01, installed by app.config.ts through
 * provideHttpClient(withInterceptors([chatMockInterceptor])).
 *
 * WHY THIS EXISTS. The seed's data layer (src/app/chat.service.ts) POSTs every chat turn to
 * `http://localhost:3000/api/chatbot`, a port served by server/index.js - an express proxy that
 * calls Google's PaLM `chat-bison-001` discuss endpoint with `process.env.API_KEY`. That server
 * is NOT part of the built application (angular.json builds src/main.ts into
 * dist/chatbot-angular-palm; server/ has its own package.json and its own node_modules and is
 * never bundled, never served and never executed by the verifier), it needs a real API key
 * (`.env` is gitignored, so the clone carries NO key - `API_KEY = process.env.API_KEY` resolves
 * to undefined), and it needs the public internet. A repair task whose transcript only advances
 * when a third-party LLM answers is unmeasurable, so the request is answered at the transport
 * seam instead: this interceptor is the last hop before the network and it never calls
 * next.handle() for the chat endpoint, which means the browser performs ZERO network I/O for a
 * chat turn (proven at design time by the `foreignResourceEntryCount()` / performance-timeline
 * checkpoint and by grepping the built index.html for fonts.gstatic.com).
 *
  *
 * external dependencies - explicitly including REMOTE DATA - until the runtime is network-free,
 * and two registered packages do exactly this at the same seam:
  *
  *
 *
 * FIDELITY CONTRACT - this is a re-implementation of server/index.js, not a stub that flattens
 * the code path. Line-for-line against the seed's own server:
 *   1. `app.post("/api/chatbot", ...)` + `express.json()`  ->  the request body is read as an
 *      object and its `message` / `agent` fields are what the server branches on. Reproduced.
 *   2. `if (requestData && requestData.message) { ... res.json({ message, agent: "chatbot" }) }`
 *      ->  a NON-EMPTY message yields HTTP 200 with a `{ message, agent: 'chatbot' }` body, which
 *      is precisely the ChatContent shape chat.service.ts declares. Reproduced, including the
 *      response key order.
 *   3. `else { res.status(400).json({ error: "Content not provided" }) }`  ->  an empty message
 *      yields HTTP 400 with that exact error body, so HttpClient emits an HttpErrorResponse and
 *      the component's subscribe() never receives a value. Reproduced byte-for-byte, including
 *      the fact that NOTHING is pushed to the conversation history on that branch.
 *   4. module-level `let messages = []` with `messages.push({ content: message })` before the
 *      call and `messages.push({ content: messageResult })` after  ->  reproduced as `transcript`,
 *      so a checkpoint can read the server-side history length exactly as the real proxy would
 *      have accumulated it (2 entries per successful turn, 0 per rejected turn).
 *   5. `CONTEXT = "Respond to all questions with a rhyming poem. Poem only. No more than 200
 *      words."`  ->  every fixture below is a short rhyming poem, and the capital-of-California
 *      fixture is VERBATIM the output half of the server's own few-shot EXAMPLES entry, so the
 *      canned answer is the answer the seed itself taught the model to give.
 *
 * DETERMINISM (methodology §1.6). The fixture table is keyed on the exact lowercased request
 * message and every reply is a frozen literal: there is no Math.random(), no Date.now(), no
 * counter in any reply body, no latency jitter (LATENCY_MS is a constant) and no ordering that
 * depends on wall-clock time. Two runs of the same checkpoint therefore read the same transcript
 * bytes on any machine. The only mutable state is the request LOG, which is append-only, numbered
 * by a monotonic counter and is itself an observation channel (see below), not an entropy source.
 *
 * ONE DELIBERATE DEVIATION, DECLARED: METHOD-LENIENCY. server/index.js registers only
 * `app.post`, so a PUT to the same path would 404 in the real deployment. This mock answers the
 * chat endpoint for ANY verb and records the verb verbatim in the request log. Reason: defect D02
 * drifts `httpClient.post<ChatContent>` to `.put<ChatContent>`, and a strictly POST-only mock
 * would starve the transcript for that defect - the reply would never land, the loading row would
 * never clear, and eleven checkpoints that have nothing to do with the HTTP verb would go red.
 * One defect would then dominate the whole F2P partition, which is exactly what methodology §1.4
 * (掩盖审计 / design_lint C20 exclusivity) forbids. Keeping the reply surface verb-agnostic
 * confines D02 to its own channel (`apiLastMethod()`) while the verb drift stays fully
 * observable, because the log records what HttpClient actually asked for.
 *
 * The observation channel `globalThis.__CAP_API__` is written by THIS file and read by the
 * instrumentation bridge (src/app/rb-probe.ts). It is an append-only record of what the app sent:
 * no getter here reads component state, and nothing here mutates the request.
 */
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

/** The seed's endpoint, exactly as chat.service.ts spells it. */
const CHAT_PATH = '/api/chatbot';

/**
 * Constant latency, in milliseconds. The real proxy round-trips to PaLM (hundreds of ms), and
 * the component renders a '...' loading row that is removed in a finalize() hook, so the loading
 * row is a genuinely transient state; a fixed 250 ms keeps it long enough to be observed by the
 * bridge's MutationObserver latch and short enough that a checkpoint's settle wait dominates it.
 * It is a CONSTANT on purpose: no jitter, so no reading depends on when the run happened.
 */
const LATENCY_MS = 250;

/** server/index.js: `res.status(400).json({ error: "Content not provided" })`. */
const EMPTY_CONTENT_ERROR = 'Content not provided';

/**
 * Frozen reply fixtures - short rhyming poems, per the server's own CONTEXT prompt. Keyed on the
 * lowercased request message; the first exact match wins, everything else gets DEFAULT_REPLY.
 * The newline counts are load-bearing: the seed renders a reply through `lineBreak`, a pipe that
 * replaces newline runs with `<br/>`, so a 3-line fixture puts exactly two `<br/>` elements in
 * the transcript row and a 2-line fixture puts exactly one. No fixture text contains a tab, a
 * carriage return or a trailing space, and none of them is a prefix of another.
 */
const CAPITAL_REPLY =
  'If the capital of California is what you seek,\nSacramento is where you ought to peek.';

const STORY_REPLY =
  'A story begins where the river bends,\n' +
  'A lantern is lit by the oldest of friends,\n' +
  'And the night writes a letter that never ends.';

const DEFAULT_REPLY =
  'I heard every word that you typed to me here,\nSo here is a rhyme in return, my dear.';

const FIXTURES: ReadonlyArray<readonly [string, string]> = [
  ['what is the capital of california?', CAPITAL_REPLY],
  ['tell me a story', STORY_REPLY],
];

export interface CapApiRequest {
  /** Monotonic 1-based index, so a checkpoint can prove ordering without a clock. */
  seq: number;
  /** The verb HttpClient actually used - the channel that observes D02's drift. */
  method: string;
  url: string;
  path: string;
  /** `body.message` when it is a string, otherwise ''. Never trimmed here: the real server does
   *  not trim either, so a payload-normalization change upstream stays visible in the row text. */
  bodyMessage: string;
  bodyAgent: string;
  /** What this seam answered: 'fixture:<n>' | 'default' | 'empty-400' | 'not-found-404'. */
  outcome: string;
}

export interface CapApiState {
  log: CapApiRequest[];
  /** Mirrors the server's module-level `messages` history: 2 pushes per accepted turn. */
  transcript: string[];
}

const state: CapApiState = { log: [], transcript: [] };

const publish = (): void => {
  (globalThis as unknown as { __CAP_API__: CapApiState }).__CAP_API__ = state;
};

publish();

const pathOf = (url: string): string => {
  try {
    return new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
};

const replyFor = (message: string): { text: string; outcome: string } => {
  const key = message.toLowerCase();
  for (let i = 0; i < FIXTURES.length; i += 1) {
    const entry = FIXTURES[i] as readonly [string, string];
    if (entry[0] === key) return { text: entry[1], outcome: 'fixture:' + String(i) };
  }
  return { text: DEFAULT_REPLY, outcome: 'default' };
};

export const chatMockInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const path = pathOf(req.url);
  const body = (req.body ?? null) as { message?: unknown; agent?: unknown } | null;
  const bodyMessage = typeof body?.message === 'string' ? body.message : '';
  const bodyAgent = typeof body?.agent === 'string' ? body.agent : '';

  if (path !== CHAT_PATH) {
    // express with only `app.post('/api/chatbot')` answers anything else with a 404; the shape is
    // the framework's own `Cannot <VERB> <path>` body. Deterministic, and it keeps this seam from
    // becoming a blanket 200 that would hide a URL change.
    state.log.push({
      seq: state.log.length + 1,
      method: req.method,
      url: req.url,
      path,
      bodyMessage,
      bodyAgent,
      outcome: 'not-found-404',
    });
    publish();
    return timer(LATENCY_MS).pipe(
      switchMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              statusText: 'Not Found',
              url: req.url,
              error: { error: 'Cannot ' + req.method + ' ' + path },
            })
        )
      )
    );
  }

  if (bodyMessage === '') {
    // server/index.js branch 3: nothing is pushed to `messages`, and the client gets a 400.
    state.log.push({
      seq: state.log.length + 1,
      method: req.method,
      url: req.url,
      path,
      bodyMessage,
      bodyAgent,
      outcome: 'empty-400',
    });
    publish();
    return timer(LATENCY_MS).pipe(
      switchMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              statusText: 'Bad Request',
              url: req.url,
              error: { error: EMPTY_CONTENT_ERROR },
            })
        )
      )
    );
  }

  const answered = replyFor(bodyMessage);
  state.log.push({
    seq: state.log.length + 1,
    method: req.method,
    url: req.url,
    path,
    bodyMessage,
    bodyAgent,
    outcome: answered.outcome,
  });
  state.transcript.push(bodyMessage);
  state.transcript.push(answered.text);
  publish();

  const responseBody: unknown = { message: answered.text, agent: 'chatbot' };
  return of(
    new HttpResponse({
      status: 200,
      statusText: 'OK',
      url: req.url,
      body: responseBody,
    })
  ).pipe(delay(LATENCY_MS));
};

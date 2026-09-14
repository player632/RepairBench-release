/*
 * RepairBench instrumentation - READ-ONLY observation bridge.
 *
 * Why this file exists: one part of the dapp's own state is never rendered anywhere -
 * `ownerNFTList` is fetched and stored by useNftLookupDapp.ts (stage 3#) but no component
 * reads it, so its ordering is unobservable from the DOM. The verifier still has to be able
 * to assert on it, because the seed's own `tokens.sort((a, b) => a - b)` is part of the
 * application's behaviour. Everything else the verifier needs is asserted through the DOM
 * and the data-testid probes added alongside this file.
 *
 * Contract (deliberately narrow):
 *   - it PUBLISHES LIVE GETTERS, never values: reading window.__RB__.dapp.x re-reads the
 *     store at read time, so the verifier observes the same reactivity the UI would;
 *   - it is READ-ONLY: no setter is exposed, so a probe can never mutate application state;
 *   - it FAILS CLOSED: every getter is wrapped in try/catch and yields null on error, and
 *     publishArea itself swallows its own failures, so instrumentation can never throw into
 *     the application's render path;
 *   - properties are `configurable: true` so a re-mounted app (the router re-creating Home)
 *     can re-publish over the previous area instead of throwing on a redefinition.
 */
const ROOT_KEY = '__RB__'

type Getters = { [key: string]: () => unknown }

export function publishArea(name: string, getters: Getters): void {
  try {
    const w = window as any
    if (!w[ROOT_KEY]) {
      Object.defineProperty(w, ROOT_KEY, { value: {}, writable: false, enumerable: true, configurable: true })
    }
    const area: { [key: string]: unknown } = {}
    for (const key of Object.keys(getters)) {
      Object.defineProperty(area, key, {
        get() {
          try {
            const v = getters[key]()
            return v === undefined ? null : v
          } catch {
            return null
          }
        },
        enumerable: true,
        configurable: true,
      })
    }
    Object.defineProperty(w[ROOT_KEY], name, { value: area, writable: false, enumerable: true, configurable: true })
  } catch {
    /* fail-closed: instrumentation must never break the app */
  }
}

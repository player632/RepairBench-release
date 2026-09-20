// RepairBench offline adaptation (environment/adaptation.patch).
//
// Kit enqueues a `kit.prerender.entries` path but only WRITES it when the route also opts in, so the root
// page needs this flag for the '/' entry that svelte.config.js adds. It follows the seed's own convention:
// src/routes/(app)/docs/[...slug]/+page.ts:5 already exports `prerender = true` for the doc pages.
//
// Scope is exactly this route. A `+page.ts` does not cascade (only a `+layout.ts` would), so the 48 doc
// pages, /components, /hooks, /actions and every demos/* route keep the seed's own rendering mode, and no
// application file is edited. Why the root has to be a static document at all, what Kit's handleMissingId
// validation does once it is, and the measured build evidence for both, are recorded in the svelte.config.js
// comment block above `docPrerenderEntries`.
export const prerender = true;

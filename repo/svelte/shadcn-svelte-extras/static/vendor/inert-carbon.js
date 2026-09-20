/* inert-carbon.js - RepairBench offline-adaptation stand-in for https://cdn.carbonads.com/carbon.js.
 *
 * environment/adaptation.patch repoints src/lib/components/carbon-ads.svelte:8-9 at this file so that
 * the <script> element the component creates at :29-37 and appends at :49-53 still exists, still has
 * id "_carbonads_js" and still carries the component's data-id, but resolves SAME-ORIGIN. That keeps
 * the DOM contract the component cleans up against at :19-22 and :43-47 intact while making the
 * "no transport leaves the origin" reading provable rather than hoped for (guards P17 / P18, and the
 * probe's egress counters).
 *
 * The real script would fetch an ad and inject #carbonads markup plus define window._carbonads. This
 * file does neither: nothing in the seed reads window._carbonads, and an injected ad is not part of
 * any checkpoint. It is inert on purpose. */

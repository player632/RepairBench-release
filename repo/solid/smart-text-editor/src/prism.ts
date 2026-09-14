// <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.23.0/prism.min.js" data-manual></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.23.0/components/prism-json.min.js"></script>
// https://prismjs.com/#basic-usage
// https://prismjs.com/#basic-usage-bundlers

globalThis.Prism = { manual: true } as typeof import("prismjs");

// RepairBench adaptation: these two specifiers were remote (cdnjs.cloudflare.com). Offline the
// top-level await rejects and takes the whole module graph with it, so nothing renders. They now
// resolve to the local `prismjs` dependency - the same 1.29.0 the CDN URL pinned. Manual mode is
// still armed on globalThis before the core loads, so highlighting behaviour is unchanged.
await import("prismjs");
await import("prismjs/components/prism-json");

export default globalThis.Prism;
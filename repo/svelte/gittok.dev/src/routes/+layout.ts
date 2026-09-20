import '$lib/rb-probe';
// Purpose: Root layout configuration for static site generation
// Context: Needed to enable prerendering for GitHub Pages deployment
// RepairBench adaptation A3: the hardcoded posthog analytics beacon that this module
// initialised in its browser branch (project key phc_Fcp58Qw6TH48to35dd0wtJxZ8QpBxbLjsOqHER6OpJq
// posting to https://eu.i.posthog.com) is retired for the offline face, together with its two
// now-unused imports. Analytics reachability is an external origin, not a product mechanism, so it
// is neutralised here rather than treated as a defect or as a decoy. The prerender/ssr flags below
// are the seed's own and are deliberately NOT touched: svelte.config.js runs adapter-static with
// strict: true, so any change to prerender would fail the whole build and redden all 12 F2P at once
// in a non-specific way.

export const prerender = true;
export const ssr = false;


export const load = async () => {
  return
};
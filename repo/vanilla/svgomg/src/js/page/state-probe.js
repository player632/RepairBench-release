// WLB instrumentation: mirrors app state into data-* attributes on the
// hidden state-probe element for DSL assertions. String-keyed DOM access
// only (the page bundle's terser mangles _-prefixed property names).
export function updateStateProbe(fields) {
  const probe = document.querySelector('[data-testid="state-probe"]');
  if (!probe) return;

  for (const key of Object.keys(fields)) {
    probe.setAttribute('data-' + key, String(fields[key]));
  }
}

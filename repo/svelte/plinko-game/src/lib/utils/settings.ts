export function hasPreferReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: no-preference)';
  if (window && window.matchMedia) {
    return window.matchMedia(query).matches;
  }
  return false;
}

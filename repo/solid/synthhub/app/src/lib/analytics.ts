// OFFLINE ADAPTATION (environment/adaptation.patch): analytics egress removed.
// Upstream this module was a thin wrapper over the PostHog inline snippet
// (components/posthog.astro), which loaded https://apito.elevatech.xyz/static/array.js
// and queued capture()/identify() calls against it. The graded faces run with no
// network egress, so every emitting entry point below is a no-op. The export
// surface is unchanged (store.ts, App.tsx and InstallButton.tsx import it) and
// nothing is written to localStorage any more, so the app starts from an empty
// storage area - which the state-isolation checkpoints rely on.

export function track(_event: string, _props?: Record<string, unknown>): void {
  // no-op offline: there is no analytics endpoint to reach
}

export function bootstrapAnalyticsIdentity(): void {
  // no-op offline: the sh_uid localStorage identity is analytics-only
}

// PWA-specific context that posthog-js does NOT auto-capture.
// (OS, browser, device type, screen, host/url, referrer and geoip ARE added
// automatically by posthog-js as $os/$browser/$device_type/$host/... so we do
// not duplicate them here.)
export function pwaContext(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  const nav = navigator as Navigator & { standalone?: boolean };
  const ua = navigator.userAgent || '';
  const mm = (q: string) => window.matchMedia?.(q).matches ?? false;

  const displayMode = mm('(display-mode: standalone)')
    ? 'standalone'
    : mm('(display-mode: minimal-ui)')
      ? 'minimal-ui'
      : mm('(display-mode: fullscreen)')
        ? 'fullscreen'
        : 'browser';

  const iosStandalone = nav.standalone === true;
  // iPadOS 13+ reports as "Macintosh"; detect via touch support.
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) &&
      typeof document !== 'undefined' &&
      'ontouchend' in document);
  const isAndroid = /Android/.test(ua);
  const platform = isIos
    ? 'ios'
    : isAndroid
      ? 'android'
      : /Mobi/.test(ua)
        ? 'other'
        : 'desktop';

  return {
    platform,
    display_mode: displayMode,
    standalone: displayMode === 'standalone' || iosStandalone,
    ios_standalone: iosStandalone,
    prompt_supported: 'onbeforeinstallprompt' in window,
  };
}

export function trackPwa(_event: string, _props?: Record<string, unknown>): void {
  // no-op offline: track() is a no-op, so the merged PWA context goes nowhere
}

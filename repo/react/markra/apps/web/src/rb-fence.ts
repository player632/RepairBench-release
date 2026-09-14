// Repair-bench adaptation: same-origin request fence.
// The delivered face is served by a static file server, so any cross-origin
// request the app attempts would either hang or leak the run to the network.
// This fence is installed before the app runtime is configured: it records every
// cross-origin attempt in a ledger and refuses it, and it never touches
// same-origin traffic. The ledger is read back by the verification bridge so the
// "no network" claim is measured rather than asserted.
type FenceLedger = {
  attempts: string[];
  installOrigin: string;
  installed: boolean;
};

declare global {
  interface Window {
    __RB_FENCE__?: FenceLedger;
  }
}

function isSameOrigin(url: string, origin: string) {
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) return true;
  if (url.startsWith("data:") || url.startsWith("blob:")) return true;

  try {
    return new URL(url, origin).origin === origin;
  } catch {
    return false;
  }
}

export function installRbRequestFence() {
  if (typeof window === "undefined") return;
  if (window.__RB_FENCE__?.installed) return;

  const origin = window.location.origin;
  const ledger: FenceLedger = { attempts: [], installOrigin: origin, installed: true };
  window.__RB_FENCE__ = ledger;

  const record = (kind: string, url: string) => {
    ledger.attempts.push(`${kind} ${url}`.slice(0, 300));
  };

  const nativeFetch = window.fetch?.bind(window);
  if (nativeFetch) {
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (!isSameOrigin(url, origin)) {
        record("fetch", url);
        return Promise.reject(new TypeError("rb-fence: cross-origin fetch refused"));
      }

      return nativeFetch(input as RequestInfo, init);
    };
  }

  const NativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function open(this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
    const href = typeof url === "string" ? url : url.href;
    if (!isSameOrigin(href, origin)) {
      record("xhr", href);
      throw new DOMException("rb-fence: cross-origin request refused", "SecurityError");
    }

    return (NativeOpen as unknown as (...args: unknown[]) => void).apply(this, [method, href, ...rest]);
  } as typeof XMLHttpRequest.prototype.open;
}

installRbRequestFence();

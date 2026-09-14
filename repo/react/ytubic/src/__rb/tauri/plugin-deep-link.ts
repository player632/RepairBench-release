import type { UnlistenFn } from "./event";

/**
 * No deep link is pending offline and none can arrive, so `getCurrent()`
 * resolves an EMPTY array (`src/lib/deep-link.ts` runs `start.forEach` on it)
 * and `onOpenUrl` hands back a disposable no-op.
 */
export async function getCurrent(): Promise<string[]> {
  return [];
}

export async function onOpenUrl(
  _handler: (urls: string[]) => void,
): Promise<UnlistenFn> {
  return () => {};
}

export async function register(_scheme: string): Promise<void> {}

export async function unregister(_scheme: string): Promise<void> {}

export async function isRegistered(_scheme: string): Promise<boolean> {
  return false;
}

import { rbNote, rbProbe } from "../probe";

/** Shape of the disposer every Tauri `listen` / `onOpenUrl` resolves with. */
export type UnlistenFn = () => void;

export type RbEvent<T> = { payload: T };

/**
 * Registering a native event listener is a no-op offline: nothing can ever
 * emit one, so the handler is dropped and a disposable no-op is returned.
 * Resolving (never rejecting) matters - callers such as
 * `src/lib/ytdlp.ts` chain `.then(un => ...)` on the mount path, and a
 * rejection there surfaces as an unhandled promise error at boot.
 */
export async function listen<T>(
  event: string,
  _handler: (e: RbEvent<T>) => void,
): Promise<UnlistenFn> {
  rbNote(rbProbe().events, event);
  return () => {};
}

export async function once<T>(
  event: string,
  _handler: (e: RbEvent<T>) => void,
): Promise<UnlistenFn> {
  rbNote(rbProbe().events, event);
  return () => {};
}

/** Emitting to the native side is recorded and otherwise dropped. */
export async function emit(event: string, _payload?: unknown): Promise<void> {
  rbNote(rbProbe().events, "emit:" + event);
}

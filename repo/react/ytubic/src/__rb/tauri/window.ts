import type { UnlistenFn } from "./event";

type Handler = (...args: never[]) => unknown;

/**
 * A browser tab has no native window, so every control resolves immediately
 * with the "normal, not maximized, focused, not fullscreen" state and every
 * subscription hands back a disposable no-op. `src/components/layout/top-bar.tsx`
 * additionally guards its own effect behind `"__TAURI_INTERNALS__" in window`
 * (false offline), so the only mount-path consumer is
 * `floating-player-app.tsx`'s `setAlwaysOnTop`.
 */
export type RbWindow = {
  setAlwaysOnTop: (on: boolean) => Promise<void>;
  isMaximized: () => Promise<boolean>;
  isMinimized: () => Promise<boolean>;
  isFocused: () => Promise<boolean>;
  isFullscreen: () => Promise<boolean>;
  isDecorated: () => Promise<boolean>;
  isResizable: () => Promise<boolean>;
  minimize: () => Promise<void>;
  unminimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  internalToggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
  hide: () => Promise<void>;
  show: () => Promise<void>;
  setFocus: () => Promise<void>;
  setTitle: (title: string) => Promise<void>;
  startResizeDragging: (direction: string) => Promise<void>;
  setSize: (size: unknown) => Promise<void>;
  setPosition: (position: unknown) => Promise<void>;
  innerSize: () => Promise<{ width: number; height: number }>;
  outerSize: () => Promise<{ width: number; height: number }>;
  scaleFactor: () => Promise<number>;
  onResized: (handler: Handler) => Promise<UnlistenFn>;
  onMoved: (handler: Handler) => Promise<UnlistenFn>;
  onCloseRequested: (handler: Handler) => Promise<UnlistenFn>;
  onFocusChanged: (handler: Handler) => Promise<UnlistenFn>;
  destroy: () => Promise<void>;
};

const noop = async (): Promise<void> => {};
const noListen = async (_handler: Handler): Promise<UnlistenFn> => () => {};

function makeWindow(): RbWindow {
  return {
    setAlwaysOnTop: noop,
    isMaximized: async () => false,
    isMinimized: async () => false,
    isFocused: async () => true,
    isFullscreen: async () => false,
    isDecorated: async () => true,
    isResizable: async () => true,
    minimize: noop,
    unminimize: noop,
    maximize: noop,
    unmaximize: noop,
    toggleMaximize: noop,
    internalToggleMaximize: noop,
    close: noop,
    hide: noop,
    show: noop,
    setFocus: noop,
    setTitle: noop,
    startResizeDragging: noop,
    setSize: noop,
    setPosition: noop,
    innerSize: async () => ({ width: 1280, height: 720 }),
    outerSize: async () => ({ width: 1280, height: 720 }),
    scaleFactor: async () => 1,
    onResized: noListen,
    onMoved: noListen,
    onCloseRequested: noListen,
    onFocusChanged: noListen,
    destroy: noop,
  };
}

const CURRENT = makeWindow();

export function getCurrentWindow(): RbWindow {
  return CURRENT;
}

export function appWindow(): RbWindow {
  return CURRENT;
}

export function getAllWindows(): RbWindow[] {
  return [CURRENT];
}

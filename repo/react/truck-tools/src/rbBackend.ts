// RepairBench environment adaptation: the OFFLINE, DETERMINISTIC stand-in for this seed's
// Rust/Tauri host, installed before the first render can reach for it.
//
// truck-tools is a Tauri v2 DESKTOP app (src-tauri/ is in the tree, package.json pins
// @tauri-apps/api 2.11.1 plus seven @tauri-apps/plugin-* packages). The roster build is
// `pnpm run build` == `tsc && vite build`, which produces a plain static bundle: there is no
// Rust process, no webview injection and no `window.__TAURI_INTERNALS__`. Measured over the
// pinned packages unpacked from the nm archive:
//   * @tauri-apps/api core.js  `invoke(cmd,args,options)` -> `window.__TAURI_INTERNALS__.invoke(...)`
//   * @tauri-apps/api core.js  `convertFileSrc(p,protocol)` -> `window.__TAURI_INTERNALS__.convertFileSrc(...)`
//   * @tauri-apps/api path.js  every helper (documentDir/join/...) -> `invoke('plugin:path|...')`
//   * plugin-store dist-js     LazyStore -> `invoke('plugin:store|load|get|set|save|...')`
//   * plugin-os / -fs / -shell / -dialog / -updater / -process -> `invoke('plugin:<name>|<cmd>')`
// so ALL 41 of src/utils/fileEdit.ts's Rust commands and every plugin call funnel through that
// one global. In a plain browser it is absent, every call rejects, and because
// useDarkModeContex.tsx:64 and useProfileContex.tsx:145 attach NO `.catch`, the app dies on
// mount with unhandled rejections and renders an empty shell.
//
// This module installs exactly the surface those packages read:
//   window.__TAURI_INTERNALS__.{invoke, transformCallback, unregisterCallback, runCallback,
//                               callbacks, metadata, convertFileSrc}
//   window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener
// plus a same-shape fetch / XMLHttpRequest / sendBeacon interceptor, so a request that this
// RECON did not foresee is RECORDED AND BLOCKED instead of leaving the machine.
//
// Discipline (RepairBench):
//   * src/main.tsx calls installRbBackend() explicitly, before ReactDOM.createRoot(...).render,
//     so the stub exists before any useEffect can fire. It is an explicit call on an imported
//     binding, not a bare side-effect import, so neither the React Compiler nor rolldown's
//     tree-shaking can drop it (mine #2 of the dispatch brief).
//   * it answers, it never asserts: an unknown command REJECTS loudly (src/rbFixtures.ts's
//     `default:` arm) and is recorded, so a coverage gap surfaces as a measurement, never as a
//     silent `undefined` that a checkpoint could read as green.
//   * it writes NO application state and changes NO seed logic: every seed code path still runs
//     for real, it just talks to this stub instead of to Rust.
//   * no clock, no randomness: callback ids come from a monotonic counter (NOT
//     crypto.getRandomValues, which the stock mockIPC uses) and the record is ordinal only, so
//     two runs of the same state are byte-identical.
//   * `window.__rbBackend` is the only global it adds, and src/rbProbe.ts (instrumentation)
//     re-publishes it read-only under `window.__rb` for the verifier.
//   * convertFileSrc answers with the in-tree same-origin asset RB_AVATAR_URL. The stock
//     `mockConvertFileSrc` from @tauri-apps/api/mocks is deliberately NOT used: it emits
//     `asset://localhost/...` (or `http://asset.localhost/...`), which is a foreign origin the
//     browser would try to reach.

import { RB_AVATAR_URL, rbInvoke as rbInvokeFixture, rbReset } from "./rbFixtures";

/** One recorded IPC call. Ordinal only - no clock, no randomness. */
export interface RbIpcCall {
	seq: number;
	cmd: string;
	argKeys: string;
}

/** One command the fixture did not know, i.e. one RECON coverage gap. Must stay empty. */
export interface RbUnknown {
	seq: number;
	cmd: string;
}

/** One rejected IPC call. The pre-adaptation positive control counts these; adapted must be 0. */
export interface RbRejection {
	seq: number;
	cmd: string;
	message: string;
}

/** One intercepted network attempt. `blocked` true means it never left the page. */
export interface RbNetCall {
	seq: number;
	host: string;
	url: string;
	via: string;
	blocked: boolean;
}

export interface RbBackendRecord {
	installed: boolean;
	ipc: RbIpcCall[];
	unknown: RbUnknown[];
	rejections: RbRejection[];
	net: RbNetCall[];
	/** Requests allowed through to the real network. Must stay 0 for every state. */
	passthrough: number;
	reset: () => void;
}

const record: RbBackendRecord = {
	installed: false,
	ipc: [],
	unknown: [],
	rejections: [],
	net: [],
	passthrough: 0,
	reset() {
		record.ipc.length = 0;
		record.unknown.length = 0;
		record.rejections.length = 0;
		record.net.length = 0;
		record.passthrough = 0;
	},
};

/** Published for the verifier; the object identity is never re-created after install. */
export const rbBackendRecord: RbBackendRecord = record;

interface RbInternals {
	invoke: (cmd: string, args?: unknown, options?: unknown) => Promise<unknown>;
	transformCallback: (cb?: (payload: unknown) => void, once?: boolean) => number;
	unregisterCallback: (id: number) => void;
	runCallback: (id: number, data: unknown) => void;
	callbacks: Map<number, (data: unknown) => void>;
	convertFileSrc: (filePath: string, protocol?: string) => string;
	metadata: {
		currentWindow: { label: string };
		currentWebview: { windowLabel: string; label: string };
	};
}

declare global {
	interface Window {
		__rbBackend?: RbBackendRecord;
		__TAURI_INTERNALS__?: RbInternals;
		// NOTE: __TAURI_EVENT_PLUGIN_INTERNALS__ is deliberately NOT re-declared here. @tauri-apps/api's own
		// event.d.ts already augments Window with it as a REQUIRED property of type
		// { unregisterListener: (event: string, eventId: number) => void }, and interface merging demands
		// identical modifiers and identical types (TS2687/TS2717), so a second, optional declaration here
		// would not compile. The stub below is written to satisfy the library's own declared shape.
		isTauri?: boolean;
	}
}

const argKeysOf = (args: unknown): string => {
	if (!args || typeof args !== "object") return "";
	try {
		return Object.keys(args as Record<string, unknown>).sort().join(",");
	} catch {
		return "";
	}
};

const hostOf = (url: string): string => {
	try {
		const u = new URL(url, "http://rb.invalid");
		return u.hostname || "";
	} catch {
		return "";
	}
};

const isSameOrigin = (url: string): boolean => {
	try {
		const u = new URL(url, window.location.href);
		if (u.protocol === "data:" || u.protocol === "blob:") return true;
		return u.origin === window.location.origin;
	} catch {
		return false;
	}
};

let ipcSeq = 0;
let netSeq = 0;
let cbSeq = 0;
const callbacks = new Map<number, (data: unknown) => void>();

const rbInvoke = async (cmd: string, args?: unknown): Promise<unknown> => {
	const seq = (ipcSeq += 1);
	record.ipc.push({ seq, cmd: String(cmd), argKeys: argKeysOf(args) });
	try {
		return await rbInvokeFixture(cmd, args);
	} catch (err) {
		const message = String((err as Error)?.message ?? err ?? "rejection");
		record.rejections.push({ seq, cmd: String(cmd), message });
		if (message.indexOf("unhandled host command") >= 0) {
			record.unknown.push({ seq, cmd: String(cmd) });
		}
		throw err;
	}
};

const installInternals = (): void => {
	const internals: RbInternals = {
		invoke: (cmd, args) => rbInvoke(String(cmd), args),
		// Monotonic, not random: two runs of the same state produce the same ids.
		transformCallback: (cb, once = false) => {
			const id = (cbSeq += 1);
			callbacks.set(id, (data: unknown) => {
				if (once) callbacks.delete(id);
				if (cb) cb(data);
			});
			return id;
		},
		unregisterCallback: (id) => {
			callbacks.delete(Number(id));
		},
		runCallback: (id, data) => {
			const cb = callbacks.get(Number(id));
			if (cb) cb(data);
		},
		callbacks,
		// Same-origin, in-tree, always the same bytes: never `asset://` and never a CDN.
		convertFileSrc: () => RB_AVATAR_URL,
		metadata: {
			currentWindow: { label: "main" },
			currentWebview: { windowLabel: "main", label: "main" },
		},
	};
	window.__TAURI_INTERNALS__ = internals;
	window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
		unregisterListener: (_event, eventId) => {
			callbacks.delete(Number(eventId));
		},
	};
};

const installNetGuard = (): void => {
	const nativeFetch = typeof window.fetch === "function" ? window.fetch.bind(window) : undefined;

	window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
		const url =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.href
					: ((input as Request)?.url ?? "");
		const seq = (netSeq += 1);
		const same = isSameOrigin(url);
		record.net.push({ seq, host: hostOf(url), url, via: "fetch", blocked: !same });
		if (same && nativeFetch) {
			record.passthrough += 1;
			return nativeFetch(input as RequestInfo, init);
		}
		return Promise.resolve(
			new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
		);
	}) as typeof window.fetch;

	const NativeXHR = window.XMLHttpRequest;
	if (NativeXHR) {
		const nativeOpen = NativeXHR.prototype.open;
		NativeXHR.prototype.open = function (
			this: XMLHttpRequest,
			method: string,
			url: string | URL,
			...rest: unknown[]
		) {
			const u = String(url);
			const seq = (netSeq += 1);
			const same = isSameOrigin(u);
			record.net.push({ seq, host: hostOf(u), url: u, via: "xhr", blocked: !same });
			if (!same) {
				// Rewrite to a same-origin path that the static server answers, so no foreign
				// origin is ever contacted; the request itself still completes for the caller.
				return nativeOpen.apply(this, [method, "/rb-blocked", ...rest] as never);
			}
			record.passthrough += 1;
			return nativeOpen.apply(this, [method, url, ...rest] as never);
		} as typeof NativeXHR.prototype.open;
	}

	if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
		const nativeBeacon = navigator.sendBeacon.bind(navigator);
		navigator.sendBeacon = ((url: string | URL, data?: unknown) => {
			const u = String(url);
			const seq = (netSeq += 1);
			const same = isSameOrigin(u);
			record.net.push({ seq, host: hostOf(u), url: u, via: "beacon", blocked: !same });
			if (!same) return true;
			record.passthrough += 1;
			return nativeBeacon(url as string, data as BodyInit);
		}) as typeof navigator.sendBeacon;
	}
};

/** Idempotent: a second call is a no-op, so StrictMode's double mount cannot double-install. */
export function installRbBackend(): boolean {
	if (typeof window === "undefined") return false;
	if (record.installed) return true;
	installInternals();
	installNetGuard();
	record.installed = true;
	window.__rbBackend = record;
	return true;
}

/** Test/latch helper: puts the fixture and the record back to their post-install zero state. */
export function resetRbBackend(): void {
	rbReset();
	record.reset();
	ipcSeq = 0;
	netSeq = 0;
	cbSeq = 0;
	callbacks.clear();
}

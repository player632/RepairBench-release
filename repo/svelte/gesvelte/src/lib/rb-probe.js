// rb-probe.js - RepairBench neutral, READ-ONLY instrumentation probe for repair-svelte__gesvelte-01.
//
// WHAT THIS IS: environment/instrumentation.patch drops this file into the seed tree and adds
// `import '$lib/rb-probe.js';` as the FIRST statement of src/routes/+layout.svelte's module script, so
// its body runs before the app's own modules. It renders nothing, adds no element, no class, no
// attribute and NO data-testid (the seed has none and the probe introduces none), and it changes no
// behaviour: every wrapper below delegates to the original and only records a scalar on the way
// through. All twelve defects are injected into application mechanisms that exist identically with
// and without this file.
//
// SSR GUARD (mandatory on this seed, and the reason it differs from a client-only face): this app is
// PRERENDERED. src/routes/+layout.js declares `export const prerender = true` and kit's
// `prerender.entries` defaults to ['*'] (@sveltejs/kit 1.30.4 src/core/config/options.js:194 and
// src/core/postbuild/prerender.js:429, which bracket the 1.5.2 this seed resolves), so every route -
// including this layout - is rendered once inside Node during `vite build`. In Node there is no
// `window`, no `document` and no `localStorage`, so the whole install is wrapped in a
// `typeof window === 'undefined'` bail-out. The bail-out publishes NOTHING on the server and emits no
// markup, which is what keeps the prerendered HTML byte-stable.
//
// WHY IT EXISTS: this face is graded offline with zero network, so "the app made no network request"
// has to be a MEASUREMENT and not a hope. The probe publishes the boot / egress / external-reference /
// storage scalars the dsl asserts on (window.__rb.*), so the offline claim in
// environment/adaptation.patch is checkable from inside the browser rather than from a grep.
//
// HONESTY NOTES (deliberate design choices, not omissions):
//  * HTMLImageElement.prototype.src is NOT redefined. Overriding a native accessor risks breaking the
//    very image loads it is meant to observe and would add no evidence: the DOM census below already
//    enumerates every link[href]/script[src]/img[src]/iframe[src]/audio[src]/video[src]/source[src] on
//    every read, which catches an external reference both at first paint and after any later mutation.
//  * `errorCount` counts ONLY uncaught script errors and unhandled promise rejections. Element resource
//    load failures are tallied separately as `resourceErrorCount`, because a failed <img>/<link> is a
//    network fact and must not be laundered into a "the app threw" reading.
//  * 🔴 `errorCount` is deliberately NOT asserted by any checkpoint on this face, and that is a design
//    decision, not a gap: defect D01 makes the field editor's Add control call the store with a store
//    OBJECT where the subscribed number belongs, and the store's own `updatedState[lookup].props` deref
//    then throws an uncaught TypeError. That throw is the defect's real, intended behaviour (the field
//    is not added), so an errorCount==0 assertion would be red in the delivered state and would be an
//    unregistered collateral red on a P2P. The counter is still installed and still published, because
//    it is the cheapest diagnostic a lane has when a state fails to boot at all.
//  * Every value published on window.__rb is a STRING, because evaluation/dsl_runner.mjs compares
//    js_eval results with a loose == against a string expectation (assertEq, dsl_runner.mjs:43).
//    Getters recompute on read, so a published scalar can never go stale.
//  * The whole install is wrapped in try/catch: a probe that throws would poison errorCount and turn a
//    behavioural red into an infrastructure red, which is exactly what this file must never do.
//  * The seed persists NOTHING: `rg -n 'localStorage|sessionStorage|document\.cookie|indexedDB' src/`
//
//    no-op by construction. It is kept (rather than deleted) because the state-isolation checkpoint
//    reads the same enumeration, and because a repair that ADDS persistence must be caught by it.

const RB_VERSION = 'rb-probe/gesvelte-01/v1';

//
// explicitly so that the enumeration is auditable rather than implicit.
const SEED_STORAGE_KEYS = [];

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
	try {
		const state = {
			egressCount: 0,
			netHosts: [],
			windowOpened: 0,
			errorCount: 0,
			errorText: '',
			resourceErrorCount: 0,
			storageWritable: false,
			wipedKeys: []
		};

		const uniqSorted = (xs) => xs.slice().sort().filter((x, i, a) => a.indexOf(x) === i);

		const record = (url) => {
			try {
				const u = new URL(String(url), location.href);
				if (u.origin === location.origin) return; // same-origin asset: not egress
				state.egressCount += 1;
				if (state.netHosts.indexOf(u.host) < 0) state.netHosts.push(u.host);
			} catch (e) {
				state.egressCount += 1; // an unparseable transport target is still an attempt to leave
				if (state.netHosts.indexOf('unparseable') < 0) state.netHosts.push('unparseable');
			}
		};

		// ---- 1. external-reference census (recomputed on every read, never cached) ----
		const extRefs = () => {
			const out = [];
			try {
				const sel = 'link[href],script[src],img[src],iframe[src],audio[src],video[src],source[src]';
				const els = document.querySelectorAll(sel);
				for (let i = 0; i < els.length; i += 1) {
					const el = els[i];
					const raw = el.getAttribute('href') || el.getAttribute('src') || '';
					if (!raw) continue;
					if (/^(data:|blob:|#|mailto:|tel:|javascript:)/i.test(raw)) continue;
					let u;
					try {
						u = new URL(raw, location.href);
					} catch (e) {
						out.push(el.tagName.toLowerCase() + '[' + String(raw).slice(0, 80) + ']');
						continue;
					}
					if (u.origin !== location.origin) {
						out.push(el.tagName.toLowerCase() + '[' + u.host + u.pathname.slice(0, 60) + ']');
					}
				}
			} catch (e) {
				/* census is best-effort; a failure yields 0 rather than a throw */
			}
			return out;
		};

		const storageKeys = (which) => {
			const out = [];
			try {
				const s = which === 'session' ? sessionStorage : localStorage;
				for (let i = 0; i < s.length; i += 1) {
					const k = s.key(i);
					if (k !== null) out.push(k);
				}
			} catch (e) {
				/* storage may be blocked; storageWritable reports that separately */
			}
			return uniqSorted(out);
		};

		// ---- 2. wipe the seed's own persisted state BEFORE any app module reads it ----
		for (let i = 0; i < SEED_STORAGE_KEYS.length; i += 1) {
			const k = SEED_STORAGE_KEYS[i];
			try {
				if (localStorage.getItem(k) !== null) state.wipedKeys.push(k);
				localStorage.removeItem(k);
			} catch (e) {
				/* ignore per-key failures */
			}
		}
		state.wipedKeys = uniqSorted(state.wipedKeys);

		// ---- 3. non-vacuity proof: is storage writable at all? (self-removing probe key) ----
		try {
			const probeKey = '__rb_probe_writable__';
			localStorage.setItem(probeKey, '1');
			state.storageWritable = localStorage.getItem(probeKey) === '1';
			localStorage.removeItem(probeKey);
		} catch (e) {
			state.storageWritable = false;
		}

		// ---- 4. transport wrappers: record, then delegate ----
		try {
			const origFetch = window.fetch ? window.fetch.bind(window) : null;
			if (origFetch) {
				window.fetch = function (input, init) {
					try {
						record(typeof input === 'string' ? input : input && input.url ? input.url : String(input));
					} catch (e) {
						/* never let the probe break the call */
					}
					return origFetch(input, init);
				};
			}
		} catch (e) { /* fetch absent or non-writable */ }

		try {
			const OrigXHR = window.XMLHttpRequest;
			if (OrigXHR) {
				const origOpen = OrigXHR.prototype.open;
				OrigXHR.prototype.open = function (method, url) {
					try { record(url); } catch (e) { /* ignore */ }
					return origOpen.apply(this, arguments);
				};
			}
		} catch (e) { /* XHR absent */ }

		try {
			if (navigator.sendBeacon) {
				const origBeacon = navigator.sendBeacon.bind(navigator);
				navigator.sendBeacon = function (url, data) {
					try { record(url); } catch (e) { /* ignore */ }
					return origBeacon(url, data);
				};
			}
		} catch (e) { /* sendBeacon absent */ }

		try {
			const OrigWS = window.WebSocket;
			if (OrigWS) {
				window.WebSocket = function (url, protocols) {
					try { record(url); } catch (e) { /* ignore */ }
					return protocols === undefined ? new OrigWS(url) : new OrigWS(url, protocols);
				};
				window.WebSocket.prototype = OrigWS.prototype;
				window.WebSocket.CONNECTING = OrigWS.CONNECTING;
				window.WebSocket.OPEN = OrigWS.OPEN;
				window.WebSocket.CLOSING = OrigWS.CLOSING;
				window.WebSocket.CLOSED = OrigWS.CLOSED;
			}
		} catch (e) { /* WebSocket absent */ }

		try {
			const OrigES = window.EventSource;
			if (OrigES) {
				window.EventSource = function (url, cfg) {
					try { record(url); } catch (e) { /* ignore */ }
					return new OrigES(url, cfg);
				};
				window.EventSource.prototype = OrigES.prototype;
			}
		} catch (e) { /* EventSource absent */ }

		try {
			const origOpenWin = window.open ? window.open.bind(window) : null;
			if (origOpenWin) {
				window.open = function (url, name, features) {
					state.windowOpened += 1;
					try { if (url) record(url); } catch (e) { /* ignore */ }
					return origOpenWin(url, name, features);
				};
			}
		} catch (e) { /* window.open non-writable */ }

		// ---- 5. error tallies (script errors and resource errors are kept apart on purpose) ----
		try {
			window.addEventListener('error', (ev) => {
				try {
					if (ev && ev.target && ev.target !== window && (ev.target.src || ev.target.href)) {
						state.resourceErrorCount += 1;
						return;
					}
					state.errorCount += 1;
					if (!state.errorText) state.errorText = String((ev && ev.message) || 'error').slice(0, 160);
				} catch (e) { /* never rethrow from a listener */ }
			}, true);
			window.addEventListener('unhandledrejection', (ev) => {
				try {
					state.errorCount += 1;
					if (!state.errorText) state.errorText = String((ev && ev.reason) || 'rejection').slice(0, 160);
				} catch (e) { /* never rethrow from a listener */ }
			});
		} catch (e) { /* addEventListener unavailable */ }

		// ---- 6. publish the read-only scalar face (getters recompute; nothing is cached) ----
		const str = (v) => String(v);
		Object.defineProperty(window, '__rb', {
			configurable: true,
			enumerable: true,
			get() {
				return {
					get ready() { return 'true'; },
					get version() { return RB_VERSION; },
					get egressCount() { return str(state.egressCount); },
					get netHosts() { return uniqSorted(state.netHosts).join(','); },
					get windowOpened() { return str(state.windowOpened); },
					get errorCount() { return str(state.errorCount); },
					get errorText() { return state.errorText; },
					get resourceErrorCount() { return str(state.resourceErrorCount); },
					get extRefsCount() { return str(extRefs().length); },
					get extRefs() { return extRefs().join('|'); },
					get storageWritable() { return str(state.storageWritable); },
					get localStorageKeys() { return storageKeys('local').join(','); },
					get sessionStorageKeys() { return storageKeys('session').join(','); },
					get wipedKeys() { return state.wipedKeys.join(','); },
					get path() { try { return location.pathname; } catch (e) { return 'ERR'; } },
					get title() { try { return document.title; } catch (e) { return 'ERR'; } }
				};
			}
		});
	} catch (e) {
		// A probe must never take the app down with it. If the install failed, publish a face that says
		// so in-band; every getter is still a string, so no assertion can mistake it for a real reading.
		try {
			Object.defineProperty(window, '__rb', {
				configurable: true,
				enumerable: true,
				get() {
					return {
						get ready() { return 'false'; },
						get version() { return RB_VERSION + '/INSTALL_FAILED'; },
						get installError() { return String((e && e.message) || e).slice(0, 160); }
					};
				}
			});
		} catch (e2) { /* nothing left to do */ }
	}
}

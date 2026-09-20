/* rb-probe.js - RepairBench neutral, READ-ONLY instrumentation probe (probe_version "rb-probe-2").
 *
 * WHAT THIS IS: environment/instrumentation.patch drops this file into static/ and adds one classic
 * <script src="%sveltekit.assets%/rb-probe.js"> to src/app.html immediately after <meta charset="utf-8" />.
 * A classic script in <head> runs before Kit's module scripts AND before the seed's own cookie script at
 * src/app.html:7-25, which is exactly what makes the storage/cookie wipe below observable to the app.
 * It renders nothing, adds no element, no class, no attribute and NO data-testid, imports no app module,
 * and every wrapper delegates to the original, so it cannot move any behaviour this face scores.
 *
 * WHY IT EXISTS: this face is graded offline with allow_internet=false, so "the app made no external
 * request" has to be a MEASUREMENT and not a hope. The probe publishes the scalars the dsl asserts on
 * (window.__rb.*): P16 pins liveness, P17/P18 pin egress == 0 on two different routes, P21 pins the
 * exact key list, and the storage wipe is what makes P22's default-userConfig reading provable.
 *
 * HONESTY NOTES (deliberate choices, not omissions):
 *  * It RECORDS cross-origin transports, it does not BLOCK them. Blocking would itself be a behaviour
 *    change, and with no network reachable the count is the evidence. An unparseable target still counts
 *    as an attempt to leave, because that is what it is.
 *  * window.__rb carries EXACTLY six keys and every value is a STRING, because the grader compares
 *    js_eval results with a loose == against a string expectation, and because P21 asserts the sorted key
 *    list - a probe that grew a field could not pass silently.
 *  * Getters recompute on read, so a published scalar can never go stale.
 *  * The whole body is wrapped in try/catch and the failure path still publishes all six keys, so a probe
 *    fault reads as a red ASSERTION (ready === "false") instead of an infrastructure crash.
 *  * HTMLImageElement.prototype.src is not redefined: overriding a native accessor risks breaking the
 *    very loads it observes, and the MutationObserver census below already sees every script/link/img/
 *    iframe src that enters the document.
 *  * probe_version "rb-probe-2": the census was CALIBRATED, never relaxed. Two over-counts were measured
 *    on a fully adapted face (2 attempts on /docs/components/copy-button, 3 on /docs/components/meter,
 *    hosts github.com / www.bits-ui.com / this site's own canonical host) and both were non-transports:
 *      - the MutationObserver path censused EVERY added element while census() reads src||href, so a
 *        plain <a href="https://..."> navigation link counted as egress. It now applies the same SEL
 *        test the subtree scan already applied, which is what the contract above always described.
 *      - <link rel="canonical|alternate"> is a declarative annotation no browser fetches; it is the same
 *        class as the og:image/twitter:image strings this face deliberately keeps (P24 asserts them).
 *    Everything that really leaves the origin still counts: external script/img/iframe/audio/video/
 *    source, fetching link rels (stylesheet, preload, prefetch, modulepreload, icon, preconnect,
 *    dns-prefetch, ...), fetch(), XMLHttpRequest.open() and WebSocket. Positive and negative controls
 *    were measured on the adapted face before this probe generation was accepted.
 */
(function () {
	'use strict';
	if (typeof window === 'undefined' || window.__rb) return;

	var VERSION = 'rb-probe-2';
	var bootAt = String(Date.now());
	var egress = 0;
	var hosts = [];
	var cleared = false;
	var inited = false;

	function here() {
		try { return location.host; } catch (e) { return ''; }
	}
	function crossOrigin(u) {
		try {
			var url = new URL(String(u), location.href);
			return url.host !== here();
		} catch (e) {
			return true;
		}
	}
	function record(u) {
		if (!crossOrigin(u)) return;
		egress += 1;
		try {
			var h = new URL(String(u), location.href).host;
			if (hosts.indexOf(h) < 0) hosts.push(h);
		} catch (e) {
			if (hosts.indexOf('unparseable') < 0) hosts.push('unparseable');
		}
	}
	function uniqSorted(xs) {
		return xs.slice().sort().filter(function (x, i, a) { return a.indexOf(x) === i; });
	}
	function str(v) { return typeof v === "string" ? v : String(v); }

	function publish(readyValue) {
		var api = {};
		var fields = {
			boot_at: function () { return bootAt; },
			egress_attempts: function () { return String(egress); },
			egress_hosts: function () { return uniqSorted(hosts).join(','); },
			probe_version: function () { return VERSION; },
			ready: function () { return readyValue; },
			storage_cleared: function () { return cleared ? 'true' : 'false'; }
		};
		for (var k in fields) {
			if (!Object.prototype.hasOwnProperty.call(fields, k)) continue;
			(function (key) {
				Object.defineProperty(api, key, { enumerable: true, configurable: true, get: fields[key] });
			})(k);
		}
		window.__rb = api;
	}

	try {
		// ---- 1. wipe persisted state BEFORE any app module reads it ----
		try {
			localStorage.clear();
			sessionStorage.clear();
			var cookies = [];
			try { cookies = document.cookie ? document.cookie.split(';') : []; } catch (e) { cookies = []; }
			for (var ci = 0; ci < cookies.length; ci++) {
				var name = cookies[ci].split('=')[0].replace(/^\s+|\s+$/g, '');
				if (!name) continue;
				document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
			}
			cleared = true;
		} catch (e) {
			cleared = false;
		}

		// ---- 2. record every transport channel ----
		try {
			var origFetch = window.fetch;
			if (typeof origFetch === 'function') {
				window.fetch = function (input, init) {
					try { record(typeof input === 'string' ? input : (input && input.url) || ''); } catch (e) {}
					return origFetch.apply(this, arguments);
				};
			}
		} catch (e) {}
		try {
			var origOpen = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
			if (origOpen) {
				window.XMLHttpRequest.prototype.open = function (method, url) {
					try { record(url); } catch (e) {}
					return origOpen.apply(this, arguments);
				};
			}
		} catch (e) {}
		try {
			var origBeacon = navigator.sendBeacon;
			if (typeof origBeacon === 'function') {
				navigator.sendBeacon = function (url, data) {
					try { record(url); } catch (e) {}
					return origBeacon.call(navigator, url, data);
				};
			}
		} catch (e) {}
		try {
			var origOpenWin = window.open;
			if (typeof origOpenWin === 'function') {
				window.open = function (url) {
					try { record(url); } catch (e) {}
					return origOpenWin.apply(window, arguments);
				};
			}
		} catch (e) {}
		try {
			if (typeof window.EventSource === 'function') {
				var OrigES = window.EventSource;
				window.EventSource = function (url, cfg) {
					try { record(url); } catch (e) {}
					return new OrigES(url, cfg);
				};
			}
		} catch (e) {}
		try {
			if (typeof window.WebSocket === 'function') {
				var OrigWS = window.WebSocket;
				window.WebSocket = function (url, protos) {
					try { record(url); } catch (e) {}
					return protos === undefined ? new OrigWS(url) : new OrigWS(url, protos);
				};
			}
		} catch (e) {}

		// ---- 3. census of external references that enter the DOM later ----
		try {
			var SEL = 'script[src],link[href],img[src],iframe[src],audio[src],video[src],source[src]';
			var SKIP = /^(data:|blob:|#|mailto:|tel:|javascript:)/i;
			// Declarative, never fetched by a browser (same class as og:image, which this face keeps on
			// purpose). Every fetching rel - stylesheet, preload, prefetch, modulepreload, icon,
			// preconnect, dns-prefetch, ... - stays counted.
			var DECLARATIVE_REL = /^(canonical|alternate)$/i;
			var seen = [];
			var census = function (el) {
				try {
					if (el.tagName === 'LINK' && DECLARATIVE_REL.test((el.getAttribute('rel') || '').trim())) return;
					var raw = el.getAttribute('src') || el.getAttribute('href') || '';
					if (!raw || SKIP.test(raw)) return;
					var key = el.tagName + "|" + raw;
					if (seen.indexOf(key) >= 0) return;
					seen.push(key);
					record(raw);
				} catch (e) {}
			};
			var scan = function (root) {
				try {
					var els = root.querySelectorAll ? root.querySelectorAll(SEL) : [];
					for (var i = 0; i < els.length; i++) census(els[i]);
				} catch (e) {}
			};
			if (typeof MutationObserver === 'function') {
				var mo = new MutationObserver(function (muts) {
					for (var m = 0; m < muts.length; m++) {
						var added = muts[m].addedNodes;
						for (var a = 0; added && a < added.length; a++) {
							var n = added[a];
							if (!n || n.nodeType !== 1) continue;
							// census() reads src||href, so the added node itself must pass the SAME SEL test that
							// scan() applies to its descendants - otherwise a plain <a href> navigation link counts
							// as an egress transport, which is not what this census documents itself to be.
							if (n.matches && n.matches(SEL)) census(n);
							scan(n);
						}
					}
				});
				mo.observe(document.documentElement, { childList: true, subtree: true });
			}
			scan(document);
		} catch (e) {}

		inited = true;
		publish('true');
	} catch (e) {
		publish('false');
	}
	void str;
	void inited;
})();

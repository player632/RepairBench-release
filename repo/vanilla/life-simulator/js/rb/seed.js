/**
 * RepairBench adaptation face - deterministic entropy source + same-origin network accounting.
 *
 *
 * runtime network", and the determinism requirement behind 2.1.4 / 3.9.3 "flaky zero
 * tolerance"): the pristine seed has NO seedable RNG. A tree-wide census counted 102 direct
 * Math.random() consumption points across 10 classic scripts (js/careers.js 20, js/menu.js 28,
 * js/items.js 10, js/characters.js 8, js/main.js 8, js/worldEvents.js 8, js/events.js 7,
 * js/libs.js 7, js/interface.js 6) and 0 clock reads (no Date.now, no new Date, no
 * performance.now), 0 timers (no setInterval / setTimeout / requestAnimationFrame), 0 storage
 * reads and 0 network calls in application code. Math.random is therefore the seed's ONE AND
 * ONLY nondeterministic input, and the very first thing the application does with it is pick the
 * starting calendar year at script-parse time (js/interface.js:11
 * `let year = Math.round(Math.random() * 20) + 2000;`), so without a reproducible stream not even
 * the year shown in the life log is stable between two loads of the same page.
 *
 * This file installs ONE reproducible stream underneath all 102 consumers. It changes no game
 * logic, no game data, no control flow and no call site: it replaces the entropy source and
 * nothing else. mulberry32 is used (32-bit state, full period, no library, no dependency) rather
 * than the 32-bit LCG of the delivered same-subject precedent
 *
 * one function and this seed has 102 spread over 10 files; mulberry32's better equidistribution
 * keeps the derived values (a career picked out of 7, a death roll compared against a stat, a
 * world event picked out of 3) away from short-cycle artefacts over a long draw sequence.
 *
 * It is loaded from index.html BEFORE js/items.js, which is the first application script, so the
 * override is in place before any application script is evaluated - including the parse-time draw
 * in js/interface.js:11.
 *
 * THE STREAM IS DELIBERATELY GLOBAL AND NEVER RESET. There is one state variable in this closure,
 * advanced once per draw, and it is not re-seeded per character creation, per "Age" click, per
 * "Start a new life" or per checkpoint. Consecutive lives therefore still differ from each other
 * exactly as they did in the pristine seed - they are just the same lives on every run. Every
 * checkpoint in tests/dsl.json runs in its own fresh browser context (dsl_runner.mjs
 * runCheckpointOnce), which reloads the page and so restarts the stream from the same constant;
 * that is what makes each checkpoint's expected value reproducible without any cross-checkpoint
 * coordination.
 *
 * There is NO seed knob: no query parameter, no hash, no global setter and no reset function. The
 * seed is the constant below and nothing on the page can change it, so it cannot be used as a
 * cheat knob by an answering model and it cannot be perturbed by a repair.
 *
 * The second half of this file is the offline accounting. The pristine entry document pulled one
 * third-party stylesheet from cdnjs.cloudflare.com (font-awesome 6.2.1, index.html:7); that link
 * is removed by this same adaptation face and replaced by the local inert stand-in
 * fontawesome-inert.css. Application code contains no fetch / XMLHttpRequest / WebSocket /
 * sendBeacon / navigation call at all (census above), so the transports hooked here are hooked
 * defensively: they COUNT same-origin traffic and REFUSE cross-origin traffic, which turns
 * "the delivered face makes zero external requests" from a claim into a reading
 * (window.__RB_SEED_FACE__.blocked must stay empty and .same_origin_only must stay true).
 *
 * 0 defect knowledge. 0 expected values. 0 writes to application state. 0 dispatched events.
 * 0 reimplementation of any application logic.
 */
(function () {
	'use strict';

	var DEFAULT_SEED = 20260910;

	/* mulberry32: 32-bit state, full-period, no library, no globals besides this closure */
	var state = DEFAULT_SEED >>> 0;
	function next() {
		state = (state + 0x6D2B79F5) >>> 0;
		var t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	var rec = { seed: DEFAULT_SEED, draws: 0, same_origin: 0, blocked: [], same_origin_only: true };
	var nativeRandom = Math.random;
	Math.random = function () { rec.draws++; return next(); };
	rec.native_random_replaced = Math.random !== nativeRandom;

	function sameOrigin(url) {
		try { return new URL(url, location.href).origin === location.origin; }
		catch (e) { return false; }
	}

	function account(kind, url) {
		if (sameOrigin(url)) { rec.same_origin++; return true; }
		rec.blocked.push(kind + ':' + url);
		rec.same_origin_only = false;
		return false;
	}

	var xo = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
	if (xo) {
		window.XMLHttpRequest.prototype.open = function (method, url) {
			if (account('xhr', url)) return xo.apply(this, arguments);
			throw new Error('[rb-seed] refused cross-origin XHR: ' + url);
		};
	}

	var nf = window.fetch;
	if (nf) {
		window.fetch = function (input) {
			var url = typeof input === 'string' ? input : (input && input.url) || String(input);
			if (account('fetch', url)) return nf.apply(this, arguments);
			return Promise.reject(new Error('[rb-seed] refused cross-origin fetch: ' + url));
		};
	}

	var d = window.HTMLImageElement && Object.getOwnPropertyDescriptor(window.HTMLImageElement.prototype, 'src');
	if (d && d.set) {
		Object.defineProperty(window.HTMLImageElement.prototype, 'src', {
			configurable: true,
			enumerable: d.enumerable,
			get: d.get,
			set: function (v) {
				if (account('img', v)) return d.set.call(this, v);
			}
		});
	}

	window.__RB_SEED_FACE__ = rec;
})();

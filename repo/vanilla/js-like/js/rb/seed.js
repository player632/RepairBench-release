/**
 * RepairBench adaptation face - deterministic entropy source + same-origin network guard.
 *
 *
 * the pristine seed has NO seedable RNG. It consumes entropy from 54 direct Math.random()
 * call sites plus 23 calls to the two shims Math.randomNormal / Math.randomPercentage
 * (both defined in js/rpg/rpg.js), i.e. 77 consumption points across 19 files - 18 of
 * them inside the 83-entry Loader queue that index.html boots, the 19th being algo/algo.js,
 * the standalone algorithm-demo page that index.html never loads - and a
 * tree-wide search for seed / PRNG / srand / xorshift / mt19937 / alea returns 0 hits.
 * Dungeon layout, character-generation rolls, NPC equipment, combat resolution and item
 * drops are therefore not reproducible and no expected value could ever be pinned down.
 * This file installs ONE reproducible stream underneath all 77 consumers. It changes no
 * game logic, no game data and no control flow: it only replaces the entropy source.
 *
 * It is loaded from index.html BEFORE js/oz.js, so it runs before every queued script and
 * before js/rpg/rpg.js defines the two shims (they read Math.random at call time, so they
 * inherit this stream).
 *
 * The same file is the offline guard. The seed has exactly two network transports:
 * OZ.Request (XMLHttpRequest, js/oz.js) and RPG.Stats.send (an <img src> beacon,
 * js/rpg/stats.js, inert because RPG.Stats.server is the empty string). Both are counted
 * here and any cross-origin attempt is refused, so "zero external requests" is a
 * measurable reading instead of a claim.
 *
 * 0 defect knowledge. 0 expected values. 0 writes to game state. 0 dispatched events.
 */
(function () {
	var DEFAULT_SEED = 20260910;
	var search = (typeof location !== "undefined" && location.search) || "";
	var m = search.match(/[?&]rbseed=(\d+)/);
	var seed = m ? (parseInt(m[1], 10) >>> 0) : DEFAULT_SEED;

	/* mulberry32: 32-bit state, full-period, no library, no globals besides this closure */
	var state = seed >>> 0;
	function next() {
		state = (state + 0x6D2B79F5) >>> 0;
		var t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	var rec = { seed: seed, draws: 0, sameOrigin: 0, blocked: [] };
	Math.random = function () { rec.draws++; return next(); };

	function sameOrigin(url) {
		try { return new URL(url, location.href).origin === location.origin; }
		catch (e) { return false; }
	}

	var xo = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
	if (xo) {
		window.XMLHttpRequest.prototype.open = function (method, url) {
			if (sameOrigin(url)) { rec.sameOrigin++; return xo.apply(this, arguments); }
			rec.blocked.push("xhr:" + url);
			throw new Error("[rb-seed] refused cross-origin XHR: " + url);
		};
	}

	var d = window.HTMLImageElement && Object.getOwnPropertyDescriptor(window.HTMLImageElement.prototype, "src");
	if (d && d.set) {
		Object.defineProperty(window.HTMLImageElement.prototype, "src", {
			configurable: true,
			enumerable: d.enumerable,
			get: d.get,
			set: function (v) {
				if (sameOrigin(v)) { rec.sameOrigin++; return d.set.call(this, v); }
				rec.blocked.push("img:" + v);
			}
		});
	}

	window.__RB_SEED_FACE__ = rec;
})();

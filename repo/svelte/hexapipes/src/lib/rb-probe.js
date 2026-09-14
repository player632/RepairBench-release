// Repair-bench instrumentation probe: a READ-ONLY verification bridge.
//
// It is the only file this task adds to the application, and it does three
// things and nothing else: it collects DOM/localStorage readings that the
// application already renders, it exposes them on `window.__HP__` as primitive
// scalars (the verifier compares primitives, never object identity), and it
// returns. It writes nothing - not to the DOM, not to localStorage, not to the
// application's own stores - it imports nothing from the application and it
// registers no listener, no observer and no network hook. Every reader is a pure
// function of the document at the moment it is called, with exactly one
// documented exception: the bounded timeline sampler at the bottom of this file,
// which is the only timer it starts and the only reader family that returns
// frozen history instead of the live document. That sampler exists because the
// verifier polls every assert until its timeout expires, so a live `tiles()`
// read can never express "the board was still empty 700 ms in" - by the time the
// poll gives up, the debounced render has landed and the timing defect has
// hidden itself. The sampler watches the tile count for a fixed 2000 ms window
// starting at probe install, then clears itself permanently, so its readings
// never change again however often they are re-evaluated (poll-immune). It
// observes only DOM the application already renders and touches no application
// state.
//
// The application's behaviour with this file present is byte-identical to its
// behaviour without it, and that is measured rather than claimed - measured at
// the source level, not the bundle level. The clean face and the oracle face have
// byte-identical `src/` trees (aggregate digest in recon/faces_report.json), but
// their builds are NOT bit-reproducible: SvelteKit stamps `_app/version.json`
// with the build's epoch-ms and that stamp propagates into every content-hashed
// chunk name and into index.html (measured in recon/builds.json). Every
// checkpoint reads a value the un-instrumented seed renders too.
//
// Every reader returns a STRING, a NUMBER, a BOOLEAN or null, because the
// verifier's js_eval comparison is `actual == expected` (loose equality on
// primitives): an array or object return would compare by identity and turn
// every checkpoint into a false red. List-shaped readings are therefore joined
// with an explicit separator by the reader itself (`...Joined`), which keeps the
// expected value in tests/dsl.json the literal, human-readable thing the browser
// produced rather than a hash of it.

/** @returns {Element[]} */
function q(selector) {
	return Array.prototype.slice.call(document.querySelectorAll(selector));
}

/** @returns {Element|null} */
function q1(selector) {
	return document.querySelector(selector);
}

/** Collapse whitespace runs exactly like the verifier's own text normaliser. */
function txt(el) {
	if (!el) return null;
	return String(el.textContent === null || el.textContent === undefined ? '' : el.textContent)
		.replace(/\s+/g, ' ')
		.trim();
}

function attr(el, name) {
	return el ? el.getAttribute(name) : null;
}

function puzzleSvg() {
	return q1('div.puzzle > svg');
}

function joined(list, sep) {
	return list.map(function (item) {
		return item === null || item === undefined ? '<null>' : String(item);
	}).join(sep === undefined ? '|' : sep);
}

export function installRbProbe() {
	if (typeof window === 'undefined') return;
	if (window.__HP__ && window.__HP__.installed) return;

	// ---- bounded timeline sampler (see the file header for why it must exist) ----
	var TL_WINDOW_MS = 2000;
	var TL_STEP_MS = 50;
	var tl = { closed: false, maxTiles: 0, firstTilesMs: -1, samples: 0 };
	var tlTimer = null;
	var tlStartedAt = 0;

	function tlTick() {
		if (tl.closed) return;
		var now = Date.now();
		var n = q('div.puzzle > svg > g.tile').length;
		tl.samples += 1;
		if (n > tl.maxTiles) tl.maxTiles = n;
		if (tl.firstTilesMs === -1 && n > 0) tl.firstTilesMs = now - tlStartedAt;
		if (now - tlStartedAt >= TL_WINDOW_MS) {
			tl.closed = true;
			if (tlTimer !== null) { clearInterval(tlTimer); tlTimer = null; }
		}
	}

	window.__HP__ = {
		installed: true,
		probeVersion: 2,

		// ---- page identity ----
		ready: function () {
			return true;
		},
		urlPath: function () {
			return window.location.pathname;
		},
		title: function () {
			return document.title;
		},
		h1: function () {
			return txt(q1('h1'));
		},
		h1Count: function () {
			return q('h1').length;
		},
		h1Joined: function () {
			return joined(q('h1').map(function (e) {
				return String(e.textContent || '').replace(/\s+/g, ' ').trim();
			}));
		},
		h2Joined: function () {
			return joined(q('h2').map(function (e) {
				return String(e.textContent || '').replace(/\s+/g, ' ').trim();
			}));
		},
		bodyHas: function (needle) {
			return String(document.body.textContent || '').replace(/\s+/g, ' ').indexOf(needle) >= 0;
		},

		// ---- the puzzle board itself ----
		puzzleDivCount: function () {
			return q('div.puzzle').length;
		},
		puzzleClass: function () {
			var el = q1('div.puzzle');
			return el ? String(el.className) : null;
		},
		tiles: function () {
			return q('div.puzzle > svg > g.tile').length;
		},
		sinks: function () {
			return q('div.puzzle > svg circle.sink').length;
		},
		pipes: function () {
			return q('div.puzzle > svg g.pipe').length;
		},
		insidePaths: function () {
			return q('div.puzzle > svg path.inside').length;
		},
		outlinePaths: function () {
			return q('div.puzzle > svg g.pipe > path:not(.inside)').length;
		},
		svgBox: function () {
			return attr(puzzleSvg(), 'viewBox');
		},
		svgWH: function () {
			var s = puzzleSvg();
			return attr(s, 'width') + '|' + attr(s, 'height');
		},
		svgRootCount: function () {
			return q('svg').length;
		},
		insideDJoined: function () {
			return joined(q('div.puzzle > svg path.inside').map(function (p) {
				return attr(p, 'd');
			}));
		},
		insideDLen: function () {
			return joined(q('div.puzzle > svg path.inside').map(function (p) {
				return attr(p, 'd');
			})).length;
		},
		contourDJoined: function () {
			return joined(q('div.puzzle > svg > g.tile > path').map(function (p) {
				return attr(p, 'd');
			}));
		},
		contourUniqJoined: function () {
			var seen = [];
			q('div.puzzle > svg > g.tile > path').forEach(function (p) {
				var d = attr(p, 'd');
				if (seen.indexOf(d) < 0) seen.push(d);
			});
			return joined(seen.sort());
		},
		contourUniqCount: function () {
			var seen = [];
			q('div.puzzle > svg > g.tile > path').forEach(function (p) {
				var d = attr(p, 'd');
				if (seen.indexOf(d) < 0) seen.push(d);
			});
			return seen.length;
		},
		tileTransformJoined: function () {
			return joined(q('div.puzzle > svg > g.tile').map(function (g) {
				return attr(g, 'transform');
			}));
		},
		edgemarkGroups: function () {
			return q('div.puzzle > svg > g.edgemarks').length;
		},
		edgemarkKids: function () {
			return q('div.puzzle > svg > g.edgemarks > *').length;
		},

		// ---- header / navigation ----
		navActiveJoined: function () {
			return joined(q('header nav li.active > a').map(function (a) {
				return attr(a, 'href');
			}), ',');
		},
		navActiveCount: function () {
			return q('header nav li.active').length;
		},
		navLinkJoined: function () {
			return joined(q('header nav li > a').map(function (a) {
				return txt(a) + '=>' + attr(a, 'href');
			}), ',');
		},
		gridLinkJoined: function () {
			return joined(q('div.grids a').map(function (a) {
				return txt(a) + '=>' + attr(a, 'href') + (String(a.className).indexOf('active') >= 0 ? '*' : '');
			}), ',');
		},
		sizeLinkJoined: function () {
			return joined(q('div.sizes a').map(function (a) {
				return txt(a) + '=>' + attr(a, 'href') + (String(a.className).indexOf('active') >= 0 ? '*' : '');
			}), ',');
		},
		sizeLinkCount: function () {
			return q('div.sizes a').length;
		},

		// ---- puzzle chrome ----
		buttonJoined: function () {
			return joined(q('button').map(txt), ',');
		},
		buttonCount: function () {
			return q('button').length;
		},
		timerText: function () {
			return txt(q1('div.timer'));
		},
		timerPresent: function () {
			return q1('div.timer') !== null;
		},
		detailsSummaryJoined: function () {
			return joined(q('details summary').map(txt), ',');
		},
		detailsOpenJoined: function () {
			return joined(q('details').map(function (d) {
				return d.open ? 'open' : 'closed';
			}), ',');
		},
		generatorPresent: function () {
			return q1('div.generator') !== null;
		},

		// ---- solve stats panel (the app's own rendering of stores._calculateStats) ----
		statsPresent: function () {
			return q1('div.stats') !== null;
		},
		statsSolvedLine: function () {
			return txt(q('div.stats .details p')[0]);
		},
		statsRowCount: function () {
			return q('div.stats table tbody tr').length;
		},
		statsRowsJoined: function () {
			return joined(q('div.stats table tbody tr').map(function (tr) {
				return joined(Array.prototype.map.call(tr.children, txt), ':');
			}), '|');
		},
		statsRowOf: function (label) {
			var rows = q('div.stats table tbody tr').map(function (tr) {
				return Array.prototype.map.call(tr.children, txt);
			});
			for (var i = 0; i < rows.length; i++) {
				if (rows[i][0] === label) return joined(rows[i], ':');
			}
			return null;
		},
		statsImprovementJoined: function () {
			return joined(q('div.stats .improvements p').map(txt), ',');
		},

		// ---- persistence (the app's own localStorage keys, read not written) ----
		lsKeyJoined: function () {
			return joined(Object.keys(window.localStorage).sort(), ',');
		},
		lsKeyCount: function () {
			return Object.keys(window.localStorage).length;
		},
		lsHas: function (key) {
			return window.localStorage.getItem(key) !== null;
		},
		lsLen: function (key) {
			var raw = window.localStorage.getItem(key);
			return raw === null ? -1 : raw.length;
		},
		lsRaw: function (key) {
			return window.localStorage.getItem(key);
		},
		lsTilesJoined: function (key) {
			var raw = window.localStorage.getItem(key);
			if (raw === null) return null;
			var parsed;
			try {
				parsed = JSON.parse(raw);
			} catch (e) {
				return 'PARSE_ERROR';
			}
			if (!parsed || !Array.isArray(parsed.tiles)) return 'NO_TILES_ARRAY';
			return joined(parsed.tiles, ',');
		},
		lsSolveCount: function (key) {
			var raw = window.localStorage.getItem(key);
			if (raw === null) return -1;
			var parsed;
			try {
				parsed = JSON.parse(raw);
			} catch (e) {
				return 'PARSE_ERROR';
			}
			return Array.isArray(parsed) ? parsed.length : 'NOT_AN_ARRAY';
		},

		// ---- the home page's nine example grids (ExamplePuzzle, its own viewBox) ----
		exampleCount: function () {
			return q('div.grids > a').length;
		},
		exampleTileJoined: function () {
			return joined(q('div.grids > a').map(function (a) {
				return a.querySelectorAll('svg > g.tile').length;
			}), ',');
		},
		exampleBoxJoined: function () {
			return joined(q('div.grids > a').map(function (a) {
				var s = a.querySelector('svg');
				return attr(s, 'viewBox');
			}), ';');
		},
		boardTileTotal: function () {
			return q('g.tile').length;
		},

		// ---- the custom-puzzle form ----
		selectOptionJoined: function (selector) {
			var el = q1(selector);
			if (!el) return null;
			return joined(Array.prototype.map.call(el.options, function (o) {
				return o.value;
			}), ',');
		},
		selectValue: function (selector) {
			var el = q1(selector);
			return el ? el.value : null;
		},
		inputValue: function (selector) {
			var el = q1(selector);
			return el ? String(el.value) : null;
		},
		inputCount: function () {
			return q('input').length;
		},

		// ---- probe identity ----
		version: function () {
			return window.__HP__.probeVersion;
		},

		// ---- timeline: frozen history from the bounded sampler ----
		// tilesMaxInWindow is monotone while the window is open and constant after
		// it closes; firstTilesMs is -1 when no tile ever appeared inside the window.
		tilesMaxInWindow: function () {
			return tl.maxTiles;
		},
		firstTilesMs: function () {
			return tl.firstTilesMs;
		},
		timelineClosed: function () {
			return tl.closed;
		},
		timelineSamples: function () {
			return tl.samples;
		}
	};

	tlStartedAt = Date.now();
	tlTick();
	tlTimer = setInterval(tlTick, TL_STEP_MS);
}

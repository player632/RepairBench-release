/**
 * RepairBench instrumentation face - read-only measurement facade (window.__RB__).
 *
 * WHY: the graded face of this seed publishes 0 data-testid attributes and 0 test files,
 * and its map is rendered onto a <canvas> by default (js/ui/mapswitch.js picks
 * RPG.UI.CanvasMap whenever canvas.getContext exists), so map and model state cannot be
 * read through the DOM at all. This facade gives the checkpoints a stable, pure-read
 * window onto the model and onto the DOM text the seed already renders (#buffer textarea,
 * #status list items, #commands buttons, .dialog contents).
 *
 * HARD RULES this file obeys:
 *   - every member is a PURE READ: 0 assignments to app state, 0 dispatchEvent, 0 clicks,
 *     0 timers, 0 reimplementation of app logic, 0 knowledge of any defect, 0 expected
 *     values. Assertions built on it are therefore safe under the runner's assert polling.
 *   - every member is wrapped so that an absent subject yields the sentinel
 *     "__RB_ABSENT__" instead of throwing: a throw inside page.evaluate is not retried by
 *     evaluation/dsl_runner.mjs, while a sentinel simply fails the comparison and enters
 *     the polling budget.
 *   - it returns scalars, booleans and joined strings only, because the official runner's
 *     assertEq compares scalars (an object/array expectation is always false).
 *   - it is appended to the Loader queue in js/loader.js, so it is evaluated after every
 *     app script and before the entry page's go() callback.
 */
(function () {
	var ABSENT = "__RB_ABSENT__";
	function T(fn) {
		try { var v = fn(); return (v === undefined || v === null) ? ABSENT : v; }
		catch (e) { return ABSENT; }
	}
	function R() { return (window.RPG && RPG.Game) ? RPG.Game : null; }
	function PC() { var g = R(); return (g && g.pc) ? g.pc : null; }
	function MAP() { var p = PC(); return p ? p.getMap() : null; }
	function UI() { return (window.RPG && RPG.UI) ? RPG.UI : null; }
	function q(sel) { return document.querySelector(sel); }
	function qa(sel) { var n = document.querySelectorAll(sel), a = []; for (var i = 0; i < n.length; i++) { a.push(n[i]); } return a; }
	function labels(list) { var a = []; for (var i = 0; i < list.length; i++) { a.push(list[i].value); } return a.join("|"); }

	window.__RB__ = {
		version: 1,
		absent: ABSENT,

		/* ---- boot / lifecycle ---- */
		loaderVersion: function () { return T(function () { return window.Loader ? Loader.version : ABSENT; }); },
		pcReady: function () { return T(function () { return !!PC(); }); },
		engineLock: function () { return T(function () { return R().getEngine()._lock; }); },

		/* ---- status bar (#status is a <ul> built by js/ui/status.js) ---- */
		statusName: function () { return T(function () { var l = qa("#status li"); return l.length ? l[0].textContent : ABSENT; }); },
		statusHp: function () { return T(function () { var s = qa("#status li:nth-child(2) span"); return s.length ? s[0].textContent : ABSENT; }); },
		statusHpMax: function () { return T(function () { var s = qa("#status li:nth-child(2) span"); return s.length > 1 ? s[1].textContent : ABSENT; }); },
		statusMana: function () { return T(function () { var s = qa("#status li:nth-child(3) span"); return s.length ? s[0].textContent : ABSENT; }); },
		statusManaMax: function () { return T(function () { var s = qa("#status li:nth-child(3) span"); return s.length > 1 ? s[1].textContent : ABSENT; }); },
		statusRound: function () { return T(function () { var s = qa("#status li:nth-child(4) span"); return s.length ? s[0].textContent : ABSENT; }); },
		statusMap: function () { return T(function () { var s = qa("#status li:nth-child(5) span"); return s.length ? s[0].textContent : ABSENT; }); },
		modelRound: function () { return T(function () { var e = PC().getEffects(); for (var i = 0; i < e.length; i++) { if (e[i] instanceof RPG.Effects.TurnCounter) { return e[i]._turns; } } return ABSENT; }); },
		modelHp: function () { return T(function () { return PC().getStat(RPG.STAT_HP); }); },
		modelHpMax: function () { return T(function () { return PC().getFeat(RPG.FEAT_MAX_HP); }); },
		modelMana: function () { return T(function () { return PC().getStat(RPG.STAT_MANA); }); },

		/* ---- message buffer (#buffer holds two <textarea>s, js/ui/buffer.js) ---- */
		bufferText: function () { return T(function () { var t = q("#buffer textarea"); return t ? t.value : ABSENT; }); },
		bufferLen: function () { return T(function () { var t = q("#buffer textarea"); return t ? t.value.length : ABSENT; }); },
		bufferHas: function (s) { return T(function () { var t = q("#buffer textarea"); return t ? (t.value.indexOf(s) != -1) : ABSENT; }); },
		backlogLen: function () { return T(function () { return UI().buffer._backlog.length; }); },

		/* ---- PC position / inventory ---- */
		pcX: function () { return T(function () { return PC().getCoords().x; }); },
		pcY: function () { return T(function () { return PC().getCoords().y; }); },
		pcCoords: function () { return T(function () { return PC().getCoords().toString(); }); },
		invCount: function () { return T(function () { return PC().getItems().length; }); },
		invNames: function () { return T(function () { var it = PC().getItems(), a = []; for (var i = 0; i < it.length; i++) { a.push(it[i].describe()); } return a.sort().join("|"); }); },
		quiverItem: function () { return T(function () { var it = PC().getSlot(RPG.SLOT_PROJECTILE).getItem(); return it ? it.describe() : ABSENT; }); },
		gold: function () { return T(function () { return PC().getGold(); }); },
		kills: function () { return T(function () { return PC().getKills(); }); },
		questCount: function () { return T(function () { return PC().getQuests().length; }); },

		/* ---- map model (renderer independent: works with Canvas, ASCII and Graphics) ---- */
		mapId: function () { return T(function () { return MAP().getID(); }); },
		mapSize: function () { return T(function () { var s = MAP().getSize(); return s.x + "x" + s.y; }); },
		cellBlocksAt: function (x, y) { return T(function () { var c = MAP().getCell(new RPG.Coords(x, y)); return c ? c.blocks(RPG.BLOCKS_MOVEMENT) : ABSENT; }); },
		cellFakeAt: function (x, y) { return T(function () { var c = MAP().getCell(new RPG.Coords(x, y)); return c ? c.isFake() : ABSENT; }); },
		blocksAt: function (x, y) { return T(function () { return MAP().blocks(RPG.BLOCKS_MOVEMENT, new RPG.Coords(x, y)); }); },
		featureAt: function (x, y) { return T(function () { var f = MAP().getFeature(new RPG.Coords(x, y)); return f ? f.describe() : ABSENT; }); },
		featureClosedAt: function (x, y) { return T(function () { var f = MAP().getFeature(new RPG.Coords(x, y)); return (f && f.isClosed) ? f.isClosed() : ABSENT; }); },
		beingAt: function (x, y) { return T(function () { var b = MAP().getBeing(new RPG.Coords(x, y)); return b ? b.getName() : ABSENT; }); },
		itemCountAt: function (x, y) { return T(function () { return MAP().getItems(new RPG.Coords(x, y)).length; }); },

		/* ---- visibility / map memory (js/rpg/pc.js updateVisibility) ---- */
		visibleCount: function () { return T(function () { var v = PC().getVisibleCoords(), n = 0; for (var k in v) { n++; } return n; }); },
		memoryCount: function () { return T(function () { var m = PC()._mapMemory[MAP().getID()], n = 0; for (var k in m) { n++; } return n; }); },
		memoryVisibleOverlap: function () { return T(function () { var m = PC()._mapMemory[MAP().getID()], v = PC().getVisibleCoords(), n = 0; for (var k in m) { if (k in v) { n++; } } return n; }); },

		/* ---- geometry primitives (js/rpg/Coords.js, js/rpg/dungeon.js) ---- */
		distance: function (x1, y1, x2, y2) { return T(function () { return new RPG.Coords(x1, y1).distance(new RPG.Coords(x2, y2)); }); },
		ringCount: function (x, y, r) { return T(function () { return MAP().getCoordsInCircle(new RPG.Coords(x, y), r, false).length; }); },
		lineText: function (x1, y1, x2, y2) { return T(function () { var c = MAP().getCoordsInLine(new RPG.Coords(x1, y1), new RPG.Coords(x2, y2)), a = []; for (var i = 0; i < c.length; i++) { a.push(c[i].toString()); } return a.join("|"); }); },
		ringText: function (x, y, r) { return T(function () { var c = MAP().getCoordsInCircle(new RPG.Coords(x, y), r, false), a = []; for (var i = 0; i < c.length; i++) { a.push(c[i].toString()); } return a.join("|"); }); },

		/* ---- commands / buttons (js/ui/button.js, js/ui/ui.js) ---- */
		commandTotal: function () { return T(function () { return UI()._commands.length; }); },
		commandEnabled: function () { return T(function () { var c = UI()._commands, n = 0; for (var i = 0; i < c.length; i++) { if (!c[i].getButton().getInput().disabled) { n++; } } return n; }); },
		commandLabels: function () { return T(function () { return labels(qa("#commands input[type=button]")); }); },
		keypadCount: function () { return T(function () { return qa("#keypad input[type=button]").length; }); },
		uiMode: function () { return T(function () { return UI()._mode; }); },
		commandsDisplay: function () { return T(function () { var d = q("#commands"); return d ? d.style.display : ABSENT; }); },
		keypadDisplay: function () { return T(function () { var d = q("#keypad"); return d ? d.style.display : ABSENT; }); },

		/* ---- dialogs (js/ui/ui.js showDialog / alert / confirm) ---- */
		dialogPresent: function () { return T(function () { return !!q(".dialog"); }); },
		dialogTitle: function () { return T(function () { var h = q(".dialog h1"); return h ? h.textContent : ABSENT; }); },
		dialogButtonCount: function () { return T(function () { return qa(".dialog input[type=button]").length; }); },
		dialogButtonLabels: function () { return T(function () { return labels(qa(".dialog input[type=button]")); }); },
		dialogText: function () { return T(function () { var d = q(".dialog"); return d ? d.textContent.replace(/\s+/g, " ") : ABSENT; }); },

		/* ---- map renderer (js/ui/mapswitch.js, js/ui/map.js) ---- */
		mapKind: function () { return T(function () { var m = UI().map; if (m instanceof RPG.UI.CanvasMap) { return "Canvas"; } if (m instanceof RPG.UI.ASCIIMap) { return "ASCII"; } if (m instanceof RPG.UI.ImageMap) { return "Image"; } return ABSENT; }); },
		mapswitchLabels: function () { return T(function () { var a = qa("#mapswitch a"), o = []; for (var i = 0; i < a.length; i++) { o.push(a[i].innerHTML + (a[i].className ? "*" : "")); } return o.join("|"); }); },
		asciiSpanCount: function () { return T(function () { return qa("#map .ascii span").length; }); },

		/* ---- flight / engine lock (js/rpg/IProjectile.js launch() locks the engine and
		   _flightDone() releases it, so the lock level is a pure-read clock for the seed's only
		   real-time animation; no extra hook is needed and no mutation host is touched) ---- */
		projectileLive: function () { return T(function () { var m = UI().map; if (!m || !m._projectiles) { return ABSENT; } var n = 0; for (var k in m._projectiles) { n++; } return n; }); },

		/* ---- adaptation face evidence ---- */
		rngSeed: function () { return T(function () { return window.__RB_SEED_FACE__.seed; }); },
		rngDraws: function () { return T(function () { return window.__RB_SEED_FACE__.draws; }); },
		netSameOrigin: function () { return T(function () { return window.__RB_SEED_FACE__.sameOrigin; }); },
		netBlocked: function () { return T(function () { return window.__RB_SEED_FACE__.blocked.length; }); },

		/* ---- state isolation (no residue a cheating fix could hide behind) ---- */
		lsCount: function () { return T(function () { return window.localStorage ? localStorage.length : 0; }); },
		ssCount: function () { return T(function () { return window.sessionStorage ? sessionStorage.length : 0; }); },
		cookieLen: function () { return T(function () { return document.cookie.length; }); },
		searchStr: function () { return T(function () { return location.search; }); },
		cheatFlag: function () { return T(function () { return typeof window.__RB_CHEAT__; }); }
	};
})();

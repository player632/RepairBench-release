/* RepairBench verifier probe - instrumentation only.
 *
 * This file is added by environment/instrumentation.patch. It changes no game
 * logic: it annotates the already-rendered DOM with stable data-testid hooks and
 * publishes window.__rb, a read-only scalar surface over the engine/DOM state
 * plus thin wrappers that drive the application's own entry points
 * (the start-scene controls, Game.movePiece and real square clicks).
 *
 * Every accessor is defensive: it returns a scalar (number/string/boolean) and
 * never throws, so a checkpoint assertion always lands as behaviour evidence
 * instead of a runner error. Getters that have to call an engine rule restore
 * the engine's transient selection state before returning.
 */
(function () {
	'use strict';

	function $(id) { return document.getElementById(id); }
	function q(sel) { return document.querySelector(sel); }
	function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
	function norm(s) { return String(s === null || s === undefined ? '' : s).replace(/\s+/g, ' ').trim(); }

	function G() {
		try { return (typeof game !== 'undefined' && game) ? game : null; } catch (e) { return null; }
	}

	// run a read-only engine query without leaving game.clickedPiece behind
	function query(fn, fallback) {
		var g = G();
		if (!g) { return fallback; }
		var saved = null;
		try { saved = g.clickedPiece; } catch (e) { saved = null; }
		try { return fn(g); }
		catch (e) { return fallback; }
		finally { try { g.clickedPiece = saved; } catch (e2) { /* ignore */ } }
	}

	function pieceByName(name) { return query(function (g) { return g.getPieceByName(name) || null; }, null); }
	function pieceAt(pos) { return query(function (g) { return g.getPieceByPos(Number(pos)) || null; }, null); }
	function squareEl(pos) { return $(String(pos)); }
	function imgIn(pos) { var s = squareEl(pos); return s ? s.querySelector('img.piece') : null; }
	function trayEl(color) { return color === 'white' ? $('whiteSematary') : $('blackSematary'); }

	function annotate() {
		try {
			var board = $('board');
			if (board) { board.setAttribute('data-testid', 'rb-board'); }
			qa('#board .square').forEach(function (s) {
				if (s && s.id) { s.setAttribute('data-testid', 'rb-sq-' + s.id); }
			});
			var pairs = [
				['turn', 'rb-turn'],
				['whiteSematary', 'rb-tray-white'],
				['blackSematary', 'rb-tray-black'],
				['startscene', 'rb-start-scene'],
				['start-game-button', 'rb-start-btn'],
				['endscene', 'rb-end-scene']
			];
			pairs.forEach(function (p) { var el = $(p[0]); if (el) { el.setAttribute('data-testid', p[1]); } });
			var selectors = [
				['label[for="humanOponent"]', 'rb-opt-human'],
				['label[for="aiOponent"]', 'rb-opt-ai'],
				['label[for="humanColorWhite"]', 'rb-color-white'],
				['label[for="humanColorBlack"]', 'rb-color-black'],
				['.select-color-container', 'rb-color-step'],
				['.winning-sign', 'rb-end-text']
			];
			selectors.forEach(function (p) { var el = q(p[0]); if (el) { el.setAttribute('data-testid', p[1]); } });
			var end = $('endscene');
			var again = end ? end.querySelector('button') : null;
			if (again) { again.setAttribute('data-testid', 'rb-play-again'); }
		} catch (e) { /* instrumentation must never break the page */ }
	}

	var api = {
		version: 1,

		/* ---------- readiness / lifecycle ---------- */
		ready: function () {
			try {
				return Boolean(G()) && qa('#board .square').length === 64 &&
					Boolean($('board')) && $('board').getAttribute('data-testid') === 'rb-board';
			} catch (e) { return false; }
		},
		annotate: function () { annotate(); return true; },
		started: function () {
			try { return !$('startscene').classList.contains('show'); } catch (e) { return false; }
		},
		// conditional: if a game is already running this is a no-op
		startHuman: function () {
			try {
				if (!$('startscene').classList.contains('show')) { return true; }
				var human = $('humanOponent');
				if (!human.checked) {
					human.checked = true;
					human.dispatchEvent(new Event('change'));
				}
				var btn = $('start-game-button');
				if (btn.disabled) { return false; }
				btn.click();
				return !$('startscene').classList.contains('show');
			} catch (e) { return false; }
		},

		/* ---------- drivers (side effects belong in setup) ---------- */
		mv: function (name, pos) {
			var g = G();
			if (!g) { return false; }
			try { return g.movePiece(name, pos) === true; } catch (e) { return false; }
		},
		clickSquare: function (pos) {
			try {
				var el = squareEl(pos);
				if (!el) { return false; }
				el.click();
				return true;
			} catch (e) { return false; }
		},
		clickTestid: function (tid) {
			try {
				var el = q('[data-testid="' + tid + '"]');
				if (!el) { return false; }
				el.click();
				return true;
			} catch (e) { return false; }
		},

		/* ---------- engine scalars ---------- */
		turn: function () { return query(function (g) { return String(g.turn); }, ''); },
		gameState: function () { try { return String(window.gameState); } catch (e) { return ''; } },
		pieceCount: function () { return query(function (g) { return g.pieces.length; }, -1); },
		countOf: function (color) {
			return query(function (g) {
				return g.pieces.filter(function (p) { return p.color === color; }).length;
			}, -1);
		},
		trackedCount: function (color) {
			return query(function (g) { return g.getPiecesByColor(color).length; }, -1);
		},
		indexAgrees: function (color) {
			return query(function (g) {
				var listed = g.pieces.filter(function (p) { return p.color === color; }).length;
				return g.getPiecesByColor(color).length === listed;
			}, false);
		},
		posOf: function (name) {
			var p = pieceByName(name);
			return p ? Number(p.position) : -1;
		},
		nameAt: function (pos) { var p = pieceAt(pos); return p ? String(p.name) : ''; },
		rankAt: function (pos) { var p = pieceAt(pos); return p ? String(p.rank) : ''; },
		colorAt: function (pos) { var p = pieceAt(pos); return p ? String(p.color) : ''; },
		rankCount: function (color, rank) {
			return query(function (g) {
				return g.pieces.filter(function (p) { return p.color === color && p.rank === rank; }).length;
			}, -1);
		},
		canCastle: function (name) {
			var p = pieceByName(name);
			return p ? p.ableToCastle === true : false;
		},
		movesOf: function (name) {
			var list = query(function (g) { return g.getPieceAllowedMoves(name) || []; }, []);
			return list.slice().sort(function (a, b) { return a - b; }).join(',');
		},
		nMoves: function (name) {
			var list = query(function (g) { return g.getPieceAllowedMoves(name) || []; }, []);
			return list.length;
		},
		isLegal: function (name, pos) {
			var list = query(function (g) { return g.getPieceAllowedMoves(name) || []; }, []);
			return list.indexOf(Number(pos)) !== -1;
		},
		isChecked: function (color) {
			return query(function (g) { return g.king_checked(color) ? 1 : 0; }, -1);
		},
		isDead: function (color) {
			return query(function (g) { return g.king_dead(color) ? 1 : 0; }, -1);
		},
		histLen: function () { return query(function (g) { return g.history._history.length; }, -1); },

		/* ---------- DOM scalars ---------- */
		turnText: function () { return norm($('turn') ? $('turn').textContent : ''); },
		squareCount: function () { return qa('#board .square').length; },
		imgCountInBoard: function () { return qa('#board img.piece').length; },
		imgIdAt: function (pos) { var i = imgIn(pos); return i ? String(i.id) : ''; },
		imgSrcAt: function (pos) { var i = imgIn(pos); return i ? String(i.getAttribute('src')) : ''; },
		imgClassAt: function (pos) { return norm(imgIn(pos) ? imgIn(pos).getAttribute('class') : ''); },
		imgCountAt: function (pos) { var s = squareEl(pos); return s ? s.querySelectorAll('img.piece').length : -1; },
		imgParentOf: function (name) {
			try {
				var i = $(name);
				return i && i.parentNode ? String(i.parentNode.id) : '';
			} catch (e) { return ''; }
		},
		renderMatchesEngine: function () {
			return query(function (g) {
				var bad = 0;
				g.pieces.forEach(function (p) {
					var s = squareEl(p.position);
					var i = s ? s.querySelector('img.piece') : null;
					if (!i || i.id !== p.name) { bad++; }
				});
				return bad;
			}, -1);
		},
		rowOneIds: function () {
			try {
				var row = document.querySelector('#board > div');
				if (!row) { return ''; }
				return Array.prototype.slice.call(row.querySelectorAll('.square'))
					.map(function (s) { return s.id; }).join(',');
			} catch (e) { return ''; }
		},
		highlightCount: function () { return qa('#board .square.allowed').length; },
		isHighlighted: function (pos) {
			var s = squareEl(pos);
			return Boolean(s && s.classList.contains('allowed'));
		},
		highlighted: function () {
			return qa('#board .square.allowed').map(function (s) { return Number(s.id); })
				.sort(function (a, b) { return a - b; }).join(',');
		},
		clickedSquareId: function () {
			var el = document.getElementsByClassName('clicked-square')[0];
			return el ? String(el.id) : '';
		},
		lastMoveCount: function () { return qa('#board .square.last-move').length; },
		isLastMove: function (pos) {
			var s = squareEl(pos);
			return Boolean(s && s.classList.contains('last-move'));
		},
		lastMoveIds: function () {
			return qa('#board .square.last-move').map(function (s) { return Number(s.id); })
				.sort(function (a, b) { return a - b; }).join(',');
		},
		trayImgs: function (color) {
			var t = trayEl(color);
			return t ? t.querySelectorAll('img').length : -1;
		},
		traySlotImgs: function (color, rank) {
			var t = trayEl(color);
			if (!t) { return -1; }
			var slot = t.querySelector('.' + rank);
			return slot ? slot.querySelectorAll('img').length : -1;
		},
		trayTotal: function () {
			var w = trayEl('white'), b = trayEl('black');
			return (w ? w.querySelectorAll('img').length : 0) + (b ? b.querySelectorAll('img').length : 0);
		},
		traySlots: function (color) {
			var t = trayEl(color);
			return t ? t.querySelectorAll('div').length : -1;
		},

		/* ---------- start scene / end scene ---------- */
		startEnabled: function () {
			try { return $('start-game-button').disabled === false; } catch (e) { return false; }
		},
		startSceneShown: function () {
			try { return $('startscene').classList.contains('show'); } catch (e) { return false; }
		},
		colorStepShown: function () {
			var el = q('.select-color-container');
			return Boolean(el && el.classList.contains('show'));
		},
		opponentChecked: function () {
			var el = q('input[name="oponent"]:checked');
			return el ? String(el.value) : '';
		},
		colorChecked: function () {
			var el = q('input[name="human_color"]:checked');
			return el ? String(el.value) : '';
		},
		endsceneShown: function () {
			try { return $('endscene').classList.contains('show'); } catch (e) { return false; }
		},
		winText: function () { return norm(q('.winning-sign') ? q('.winning-sign').textContent : ''); },
		playAgainLabel: function () {
			var end = $('endscene');
			var btn = end ? end.querySelector('button') : null;
			return norm(btn ? btn.textContent : '');
		},
		boardClasses: function () { return norm($('board') ? $('board').getAttribute('class') : ''); },

		/* ---------- residue (state isolation) ---------- */
		lsCount: function () { try { return window.localStorage.length; } catch (e) { return -1; } },
		ssCount: function () { try { return window.sessionStorage.length; } catch (e) { return -1; } },
		cookieLen: function () { try { return String(document.cookie).length; } catch (e) { return -1; } },
		locSearch: function () { try { return String(location.search); } catch (e) { return 'ERR'; } },
		locHash: function () { try { return String(location.hash); } catch (e) { return 'ERR'; } },
		locPathTail: function () {
			try { return String(location.pathname).split('/').pop(); } catch (e) { return 'ERR'; }
		},
		extraGlobals: function () {
			try {
				return Object.keys(window).filter(function (k) {
					return /^__rb/.test(k) && k !== '__rb';
				}).length;
			} catch (e) { return -1; }
		}
	};

	try { annotate(); } catch (e) { /* ignore */ }
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', annotate);
	}
	window.__rb = api;
})();

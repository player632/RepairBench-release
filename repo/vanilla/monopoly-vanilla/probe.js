// probe.js - RepairBench instrumentation bridge.
// Added by environment/instrumentation.patch. It is NOT part of the upstream game and it
// does not implement, adjust or shortcut any game rule. It provides exactly two things:
//   window.__MPQ__()  - a PURE-READ scalar snapshot of engine state + DOM (never mutates),
//                       plus snap(tag) frozen copies so assertions stay side-effect free;
//   window.__MPX__    - a setup-only command surface used to build deterministic fixtures
//                       (seeded dice, explicit deck order, ownership/position/money presets)
//                       and to drive real clicks through the game's own handlers.
// The game still runs entirely on its own code paths: probes call the same public functions
// a player would reach through the UI (roll, land, buy, game.next, popup buttons, ...).
(function () {
	"use strict";

	var frozen = {};
	var baselineGlobals = null;
	var ready = false;
	var origRandom = Math.random;
	var randomQueue = null;
	var randomFixed = null;

	function el(id) {
		return document.getElementById(id);
	}

	function txt(id) {
		var e = el(id);
		return e ? String(e.textContent === null || e.textContent === undefined ? "" : e.textContent) : "__missing__";
	}

	function html(id) {
		var e = el(id);
		return e ? String(e.innerHTML === null || e.innerHTML === undefined ? "" : e.innerHTML) : "__missing__";
	}

	function val(id) {
		var e = el(id);
		return e && e.value !== undefined && e.value !== null ? String(e.value) : "__missing__";
	}

	function dis(id) {
		var e = el(id);
		return e ? !!e.disabled : false;
	}

	function ttl(id) {
		var e = el(id);
		return e ? String(e.title || "") : "__missing__";
	}

	function disp(id) {
		var e = el(id);
		if (!e) {
			return "__missing__";
		}
		if (window.getComputedStyle) {
			return String(window.getComputedStyle(e).display || "");
		}
		return String(e.style.display || "");
	}

	function vis(id) {
		return disp(id) !== "none" && disp(id) !== "__missing__";
	}

	function dieFace(id) {
		var e = el(id);
		if (!e) {
			return "__missing__";
		}
		var img = e.getElementsByTagName("img")[0];
		return img ? String(img.getAttribute("src") || "") : "";
	}

	function dieAlt(id) {
		var e = el(id);
		if (!e) {
			return "__missing__";
		}
		var img = e.getElementsByTagName("img")[0];
		return img ? String(img.getAttribute("alt") || "") : "";
	}

	function countClass(selector, rootId) {
		try {
			var root = rootId ? el(rootId) : document;
			if (!root) {
				return -1;
			}
			return root.querySelectorAll(selector).length;
		} catch (e) {
			return -1;
		}
	}

	function visibleMoneybarRows() {
		var n = 0;
		for (var i = 1; i <= 8; i++) {
			if (disp("moneybarrow" + i) !== "none" && disp("moneybarrow" + i) !== "__missing__") {
				n++;
			}
		}
		return n;
	}

	function visibleOwnerMarkers() {
		var n = 0;
		for (var i = 0; i < 40; i++) {
			if (disp("cell" + i + "owner") === "block") {
				n++;
			}
		}
		return n;
	}

	function tokenCount() {
		return countClass(".cell-position");
	}

	function alertCount() {
		var e = el("alert");
		return e ? e.getElementsByTagName("div").length : -1;
	}

	function alertText() {
		var e = el("alert");
		return e ? String(e.textContent || "") : "__missing__";
	}

	function alertLast() {
		var e = el("alert");
		if (!e) {
			return "__missing__";
		}
		var kids = e.getElementsByTagName("div");
		return kids.length ? String(kids[kids.length - 1].textContent || "") : "";
	}

	function residueNewCount() {
		if (!baselineGlobals) {
			return -1;
		}
		var n = 0;
		for (var k in window) {
			if (Object.prototype.hasOwnProperty.call(window, k) && k.indexOf("__") === 0 && !baselineGlobals[k]) {
				n++;
			}
		}
		return n;
	}

	function storageLen(which) {
		try {
			var st = which === "local" ? window.localStorage : window.sessionStorage;
			return st ? st.length : 0;
		} catch (e) {
			return -1;
		}
	}

	function snapshot() {
		var s = {};
		var i;
		var g = window;

		s.probeReady = !!ready;
		s.turn = typeof g.turn === "number" ? g.turn : -1;
		s.pcount = typeof g.pcount === "number" ? g.pcount : -1;
		s.doublecount = typeof g.doublecount === "number" ? g.doublecount : -1;
		s.engineReady = !!(g.game && g.player && g.square);

		var money = [], position = [], jail = [], jailroll = [], chestCard = [], chanceCard = [], human = [], names = [], creditor = [], colors = [];
		for (i = 0; i <= 8; i++) {
			var pl = g.player ? g.player[i] : null;
			money[i] = pl ? pl.money : null;
			position[i] = pl ? pl.position : null;
			jail[i] = pl ? !!pl.jail : null;
			jailroll[i] = pl ? pl.jailroll : null;
			chestCard[i] = pl ? !!pl.communityChestJailCard : null;
			chanceCard[i] = pl ? !!pl.chanceJailCard : null;
			human[i] = pl ? !!pl.human : null;
			names[i] = pl ? String(pl.name) : null;
			creditor[i] = pl ? pl.creditor : null;
			colors[i] = pl ? String(pl.color) : null;
		}
		s.money = money;
		s.position = position;
		s.jail = jail;
		s.jailroll = jailroll;
		s.chestCard = chestCard;
		s.chanceCard = chanceCard;
		s.human = human;
		s.names = names;
		s.creditor = creditor;
		s.colors = colors;

		var owner = [], house = [], hotel = [], mortgage = [], landcount = [], price = [], baserent = [], groupNumber = [];
		for (i = 0; i < 40; i++) {
			var sq = g.square ? g.square[i] : null;
			owner[i] = sq ? sq.owner : null;
			house[i] = sq ? sq.house : null;
			hotel[i] = sq ? sq.hotel : null;
			mortgage[i] = sq ? !!sq.mortgage : null;
			landcount[i] = sq ? sq.landcount : null;
			price[i] = sq ? sq.price : null;
			baserent[i] = sq ? sq.baserent : null;
			groupNumber[i] = sq ? sq.groupNumber : null;
		}
		s.owner = owner;
		s.house = house;
		s.hotel = hotel;
		s.mortgage = mortgage;
		s.landcount = landcount;
		s.price = price;
		s.baserent = baserent;
		s.groupNumber = groupNumber;

		var cc = g.chanceCards, mc = g.communityChestCards;
		s.chanceDeckLen = cc && cc.deck ? cc.deck.length : -1;
		s.chestDeckLen = mc && mc.deck ? mc.deck.length : -1;
		s.chanceIndex = cc ? cc.index : -1;
		s.chestIndex = mc ? mc.index : -1;
		s.chanceDeckTop = cc && cc.deck ? cc.deck[cc.index] : -1;
		s.chestDeckTop = mc && mc.deck ? mc.deck[mc.index] : -1;
		s.chanceDeckHasZero = !!(cc && cc.deck && cc.deck.indexOf(0) >= 0);
		s.chestDeckHasZero = !!(mc && mc.deck && mc.deck.indexOf(0) >= 0);

		try {
			s.checkedProperty = typeof g.getCheckedProperty === "function" ? g.getCheckedProperty() : -2;
		} catch (e) {
			s.checkedProperty = -3;
		}
		s.ownedRowCount = countClass("tr.property-cell-row", "owned");
		s.ownedCheckboxCount = countClass(".propertycellcheckbox > input", "owned");
		s.ownedText = txt("owned");
		s.ownedHasHouseImg = countClass("img.house", "owned");
		s.ownedHasHotelImg = countClass("img.hotel", "owned");

		s.pmoneyText = txt("pmoney");
		s.pnameText = txt("pname");
		s.quickstatsVisible = vis("quickstats");
		s.quickstatsBorder = el("quickstats") ? String(el("quickstats").style.borderColor || "") : "__missing__";

		var barMoney = [], barName = [];
		for (i = 1; i <= 8; i++) {
			barMoney[i] = txt("p" + i + "money");
			barName[i] = txt("p" + i + "moneyname");
		}
		s.barMoney = barMoney;
		s.barName = barName;
		s.barVisibleRows = visibleMoneybarRows();
		s.arrowVisible = [];
		for (i = 1; i <= 8; i++) {
			s.arrowVisible[i] = disp("p" + i + "arrow") !== "none" && disp("p" + i + "arrow") !== "__missing__";
		}

		s.alertCount = alertCount();
		s.alertText = alertText();
		s.alertLast = alertLast();
		s.landedText = txt("landed");
		s.landedVisible = vis("landed");
		s.landedHasBuyButton = countClass("input[onclick='buy();']", "landed");

		s.optionVisible = vis("option");
		s.manageVisible = vis("manage");
		s.buyVisible = vis("buy");
		s.buildingsVisible = vis("buildings");
		s.buildingsText = txt("buildings");
		s.buildingsHouseSum = (function () {
			var m = (txt("buildings").match(/-?\d+/g) || []);
			return m.length > 0 ? parseInt(m[0], 10) : -1;
		}());
		s.buildingsHotelSum = (function () {
			var m = (txt("buildings").match(/-?\d+/g) || []);
			return m.length > 1 ? parseInt(m[1], 10) : -1;
		}());

		s.buyhouseVisible = vis("buyhousebutton");
		s.buyhouseValue = val("buyhousebutton");
		s.buyhouseDisabled = dis("buyhousebutton");
		s.buyhouseTitle = ttl("buyhousebutton");
		s.sellhouseVisible = vis("sellhousebutton");
		s.sellhouseValue = val("sellhousebutton");
		s.sellhouseDisabled = dis("sellhousebutton");
		s.sellhouseTitle = ttl("sellhousebutton");
		s.mortgageVisible = vis("mortgagebutton");
		s.mortgageValue = val("mortgagebutton");
		s.mortgageDisabled = dis("mortgagebutton");
		s.mortgageTitle = ttl("mortgagebutton");

		s.die0Display = disp("die0");
		s.die1Display = disp("die1");
		s.die0Visible = vis("die0");
		s.die1Visible = vis("die1");
		s.die0Src = dieFace("die0");
		s.die1Src = dieFace("die1");
		s.die0Alt = dieAlt("die0");
		s.die1Alt = dieAlt("die1");
		s.die0Title = ttl("die0");
		s.die1Title = ttl("die1");

		s.popupwrapDisplay = disp("popupwrap");
		s.popupwrapVisible = vis("popupwrap");
		s.popupbgDisplay = disp("popupbackground");
		s.popupText = txt("popuptext");
		s.popupHtmlHasOk = countClass("#popupclose", "popuptext");
		s.popupHtmlHasYes = countClass("#popupyes", "popuptext");
		s.popupHtmlHasNo = countClass("#popupno", "popuptext");
		s.popupHasBidInput = countClass("#bid", "popuptext");

		s.deedVisible = vis("deed");
		s.deedNormalVisible = vis("deed-normal");
		s.deedSpecialVisible = vis("deed-special");
		s.deedMortgagedVisible = vis("deed-mortgaged");
		s.deedSpecialName = txt("deed-special-name");
		s.deedSpecialText = txt("deed-special-text");
		s.deedName = txt("deed-name");
		s.deedBaserent = txt("deed-baserent");
		s.deedRent1 = txt("deed-rent1");
		s.deedRent2 = txt("deed-rent2");
		s.deedHouseprice = txt("deed-houseprice");

		s.boardVisible = vis("board");
		s.controlVisible = vis("control");
		s.moneybarVisible = vis("moneybar");
		s.setupVisible = vis("setup");
		s.viewstatsVisible = vis("viewstats");
		s.statswrapVisible = vis("statswrap");
		s.noF5Visible = vis("noF5");

		s.nextButtonValue = val("nextbutton");
		s.nextButtonTitle = ttl("nextbutton");
		s.nextButtonDisabled = dis("nextbutton");
		s.nextButtonVisible = vis("nextbutton");
		s.resignVisible = vis("resignbutton");
		s.startButtonPresent = !!document.querySelector("[data-testid='start-game-button']");

		s.ownerMarkerCount = visibleOwnerMarkers();
		s.tokenCount = tokenCount();

		s.localStorageLen = storageLen("local");
		s.sessionStorageLen = storageLen("session");
		try {
			s.cookieLen = String(document.cookie || "").length;
		} catch (e) {
			s.cookieLen = -1;
		}
		try {
			s.locHash = String(window.location.hash || "");
			s.locSearch = String(window.location.search || "");
			s.locPathname = String(window.location.pathname || "");
			s.locPathIsIndex = /\/(index\.html)?$/.test(s.locPathname);
		} catch (e) {
			s.locHash = "__err__";
			s.locSearch = "__err__";
			s.locPathname = "__err__";
			s.locPathIsIndex = false;
		}
		s.residueNewCount = residueNewCount();

		return s;
	}

	function readSnapshot() {
		var s = snapshot();
		s.frozen = frozen;
		return s;
	}

	// ---------------- setup-only command surface ----------------

	var COLORS = ["", "#0000ff", "#ff0000", "#008000", "#800080", "#ff8000", "#008080", "#808000", "#c0c0c0"];

	function installRandom() {
		Math.random = function () {
			if (randomQueue && randomQueue.length) {
				return randomQueue.shift();
			}
			if (randomFixed !== null) {
				return randomFixed;
			}
			return origRandom();
		};
	}

	function p(i) {
		return window.player ? window.player[i] : null;
	}

	function sq(i) {
		return window.square ? window.square[i] : null;
	}

	var X = {
		version: "mp-probe-1",

		waitReady: function (ms) {
			var limit = typeof ms === "number" ? ms : 20000;
			var t0 = Date.now();
			return new Promise(function (resolve) {
				var tick = function () {
					if (ready && window.game && window.player && window.player[1] && window.square && window.square[39]) {
						resolve(true);
						return;
					}
					if (Date.now() - t0 > limit) {
						resolve(false);
						return;
					}
					setTimeout(tick, 50);
				};
				tick();
			});
		},

		sleep: function (ms) {
			return new Promise(function (resolve) {
				setTimeout(function () { resolve(true); }, typeof ms === "number" ? ms : 0);
			});
		},

		markBaseline: function () {
			baselineGlobals = {};
			for (var k in window) {
				if (Object.prototype.hasOwnProperty.call(window, k) && k.indexOf("__") === 0) {
					baselineGlobals[k] = true;
				}
			}
			return true;
		},

		clearStorage: function () {
			try {
				if (window.localStorage) { window.localStorage.clear(); }
			} catch (e) { /* ignore */ }
			try {
				if (window.sessionStorage) { window.sessionStorage.clear(); }
			} catch (e) { /* ignore */ }
			try {
				document.cookie = "rbprobe=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
			} catch (e) { /* ignore */ }
			return true;
		},

		seedRandom: function (v) {
			randomFixed = typeof v === "number" ? v : 0.5;
			randomQueue = null;
			installRandom();
			return true;
		},

		queueRandom: function (arr) {
			randomQueue = (arr || []).slice();
			installRandom();
			return true;
		},

		restoreRandom: function () {
			randomQueue = null;
			randomFixed = null;
			Math.random = origRandom;
			return true;
		},

		resetFrozen: function () {
			frozen = {};
			return true;
		},

		snap: function (tag) {
			frozen[String(tag)] = snapshot();
			return true;
		},

		startGame: function (n) {
			var count = typeof n === "number" && n >= 2 && n <= 8 ? n : 2;
			var sel = el("playernumber");
			if (sel) {
				sel.value = String(count);
			}
			for (var i = 1; i <= 8; i++) {
				var nm = el("player" + i + "name");
				if (nm) {
					nm.value = "P" + i;
					nm.disabled = false;
				}
				var ai = el("player" + i + "ai");
				if (ai) {
					ai.value = "0";
				}
			}
			if (typeof window.playernumber_onchange === "function") {
				window.playernumber_onchange();
			}
			randomFixed = 0.5;
			randomQueue = null;
			installRandom();
			window.setup();
			// Canonicalise the seat permutation so index 1..n always means P1..Pn.
			for (var k = 1; k <= count; k++) {
				var pk = p(k);
				if (pk) {
					pk.name = "P" + k;
					pk.color = COLORS[k];
				}
			}
			window.pcount = count;
			randomFixed = 0.5;
			if (typeof window.updateMoney === "function") { window.updateMoney(); }
			if (typeof window.updatePosition === "function") { window.updatePosition(); }
			if (typeof window.updateOwned === "function") { window.updateOwned(); }
			return true;
		},

		makeAI: function (i) {
			var pk = p(i);
			if (!pk) {
				return false;
			}
			pk.human = false;
			if (!pk.AI && typeof window.AITest === "function") {
				pk.AI = new window.AITest(pk);
			}
			pk.name = "P" + i;
			if (typeof window.updateMoney === "function") { window.updateMoney(); }
			return true;
		},

		setName: function (i, name) {
			var pk = p(i);
			if (!pk) {
				return false;
			}
			pk.name = String(name);
			return true;
		},

		setColor: function (i, color) {
			var pk = p(i);
			if (!pk) {
				return false;
			}
			pk.color = String(color);
			return true;
		},

		turnTo: function (i) {
			window.turn = i;
			window.doublecount = 0;
			if (window.game && window.game.resetDice) {
				window.game.resetDice();
			}
			var nm = el("pname");
			if (nm && p(i)) {
				nm.innerHTML = p(i).name;
			}
			return true;
		},

		pos: function (i, n) {
			var pk = p(i);
			if (!pk) {
				return false;
			}
			pk.position = n;
			return true;
		},

		money: function (i, n) {
			var pk = p(i);
			if (!pk) {
				return false;
			}
			pk.money = n;
			return true;
		},

		jail: function (i, flag, roll) {
			var pk = p(i);
			if (!pk) {
				return false;
			}
			pk.jail = !!flag;
			pk.jailroll = typeof roll === "number" ? roll : 0;
			return true;
		},

		card: function (i, which, flag) {
			var pk = p(i);
			if (!pk) {
				return false;
			}
			if (which === "chance") {
				pk.chanceJailCard = !!flag;
			} else {
				pk.communityChestJailCard = !!flag;
			}
			return true;
		},

		own: function (index, owner) {
			var s = sq(index);
			if (!s) {
				return false;
			}
			s.owner = owner;
			return true;
		},

		houses: function (index, n) {
			var s = sq(index);
			if (!s) {
				return false;
			}
			s.house = n;
			if (n < 5) {
				s.hotel = 0;
			}
			return true;
		},

		hotel: function (index, n) {
			var s = sq(index);
			if (!s) {
				return false;
			}
			s.hotel = n ? 1 : 0;
			if (n) {
				s.house = 5;
			}
			return true;
		},

		mortgaged: function (index, flag) {
			var s = sq(index);
			if (!s) {
				return false;
			}
			s.mortgage = !!flag;
			return true;
		},

		landcount: function (index, n) {
			var s = sq(index);
			if (!s) {
				return false;
			}
			s.landcount = n;
			return true;
		},

		deck: function (which, arr) {
			var d = which === "chance" ? window.chanceCards : window.communityChestCards;
			if (!d) {
				return false;
			}
			d.deck = (arr || []).slice();
			d.index = 0;
			return true;
		},

		deckIndex: function (which, n) {
			var d = which === "chance" ? window.chanceCards : window.communityChestCards;
			if (!d) {
				return false;
			}
			d.index = n;
			return true;
		},

		// Queue exactly two dice draws and let the game consume them itself.
		// Use before roll(): roll() calls game.rollDice() internally.
		queueDice: function (a, b) {
			randomQueue = [(a - 0.5) / 6, (b - 0.5) / 6];
			installRandom();
			return true;
		},

		// Queue two dice draws AND roll them now, for checkpoints that drive land()
		// directly instead of going through roll().
		setDice: function (a, b) {
			randomQueue = [(a - 0.5) / 6, (b - 0.5) / 6];
			installRandom();
			if (window.game && window.game.rollDice) {
				window.game.rollDice();
			}
			randomQueue = null;
			return window.game ? [window.game.getDie(1), window.game.getDie(2)] : [-1, -1];
		},

		call: function (name) {
			var fn = window[name];
			if (typeof fn !== "function") {
				return "__nofn__";
			}
			var args = Array.prototype.slice.call(arguments, 1);
			return fn.apply(null, args);
		},

		callGame: function (name) {
			if (!window.game || typeof window.game[name] !== "function") {
				return "__nofn__";
			}
			var args = Array.prototype.slice.call(arguments, 1);
			return window.game[name].apply(window.game, args);
		},

		callAI: function (i, name) {
			var pk = p(i);
			if (!pk || !pk.AI || typeof pk.AI[name] !== "function") {
				return "__nofn__";
			}
			var args = Array.prototype.slice.call(arguments, 2);
			return pk.AI[name].apply(pk.AI, args);
		},

		render: function () {
			if (typeof window.updateMoney === "function") { window.updateMoney(); }
			if (typeof window.updatePosition === "function") { window.updatePosition(); }
			if (typeof window.updateOwned === "function") { window.updateOwned(); }
			return true;
		},

		clickId: function (id) {
			var e = el(id);
			if (!e) {
				return false;
			}
			e.click();
			return true;
		},

		clickTestId: function (t) {
			var e = document.querySelector("[data-testid='" + t + "']");
			if (!e) {
				return false;
			}
			e.click();
			return true;
		},

		clickPopup: function (which) {
			var id = which === "yes" ? "popupyes" : (which === "no" ? "popupno" : "popupclose");
			var e = el(id);
			if (!e) {
				return false;
			}
			e.click();
			return true;
		},

		// Click the owned-list row of a property WITHOUT touching its checkbox directly, so the
		// only thing that can flip the selection is the game's own row handler.
		clickRow: function (index) {
			var box = el("propertycheckbox" + index);
			if (!box) {
				return false;
			}
			var row = box;
			while (row && row.tagName && row.tagName.toLowerCase() !== "tr") {
				row = row.parentNode;
			}
			if (!row) {
				return false;
			}
			var cells = row.getElementsByTagName("td");
			var target = cells.length >= 3 ? cells[2] : row;
			var ev;
			if (typeof window.MouseEvent === "function") {
				ev = new window.MouseEvent("click", { bubbles: true, cancelable: true, view: window });
			} else {
				ev = document.createEvent("MouseEvents");
				ev.initEvent("click", true, true);
			}
			target.dispatchEvent(ev);
			return true;
		},

		showDeed: function (index) {
			if (typeof window.showdeed !== "function") {
				return false;
			}
			window.showdeed(index);
			return true;
		},

		hideDeed: function () {
			if (typeof window.hidedeed !== "function") {
				return false;
			}
			window.hidedeed();
			return true;
		},

		setCheckbox: function (index, flag) {
			var box = el("propertycheckbox" + index);
			if (!box) {
				return false;
			}
			box.checked = !!flag;
			return true;
		}
	};

	installRandom();

	window.__MPQ__ = readSnapshot;
	window.__MPX__ = X;

	var upstreamOnload = window.onload;
	window.onload = function () {
		if (typeof upstreamOnload === "function") {
			upstreamOnload.apply(window, arguments);
		}
		ready = true;
		if (!baselineGlobals) {
			X.markBaseline();
		}
	};
}());

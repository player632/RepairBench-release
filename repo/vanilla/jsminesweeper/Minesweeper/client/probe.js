/* ---------------------------------------------------------------------------
 * RepairBench instrumentation bridge for the JSMinesweeper seed.
 *
 * This file is TEST HARNESS, not game code, and it adds no behaviour to the
 * app.  It exists because the seed paints everything the player cares about
 * (the board, the LED mine counter and the solver hint overlay) onto three
 * <canvas> elements, so there is no DOM text node to point an assertion at.
 *
 *   window.__MSQ__()  pure-read accessor for snapshots that a checkpoint froze
 *                     earlier in its `setup`.  Returns plain scalars only and
 *                     never touches the game, so an assertion can be re-polled
 *                     by the runner without changing anything.
 *   window.__MSX__    scenario driver, used from `setup` steps only.  Every
 *                     command delegates to the game's OWN entry points
 *                     (newGame / clickAction / releaseAction /
 *                     sendActionsMessage / startSolver / doAnalysis /
 *                     setAnalysis / propertiesOpen / propertiesClose /
 *                     changeTileSize), so a scenario is a real user flow
 *                     rather than a poke at private state.
 *
 * Canvas pixels are deliberately never inspected.
 * ------------------------------------------------------------------------- */
(function () {
    "use strict";

    var FROZEN = {};
    var WATCH = [];

    function R(fn, dflt) {
        try {
            var v = fn();
            return (v === undefined ? dflt : v);
        } catch (e) {
            return dflt;
        }
    }

    function el(id) { return document.getElementById(id); }
    function ih(id) { return R(function () { return el(id).innerHTML; }, null); }
    function ck(id) { return R(function () { return el(id).checked === true; }, null); }
    function vl(id) { return R(function () { return String(el(id).value); }, null); }
    function cls(id) { return R(function () { return String(el(id).className); }, null); }
    function dsp(id) { return R(function () { return String(el(id).style.display); }, null); }
    function num(id, attr) { return R(function () { return Number(el(id)[attr]); }, null); }
    function tid(t) { return R(function () { return document.querySelector('[data-testid="' + t + '"]') === null ? 0 : 1; }, 0); }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function base(u) { var s = String(u === null || u === undefined ? "" : u); var i = s.lastIndexOf("/"); return i >= 0 ? s.slice(i + 1) : s; }

    function count(b, pred) {
        return R(function () {
            var n = 0;
            for (var i = 0; i < b.tiles.length; i++) { if (pred(b.tiles[i])) { n++; } }
            return n;
        }, null);
    }

    function theBoard() { return R(function () { return board; }, null); }
    function theServer(b) {
        return R(function () {
            var bb = b || board;
            if (!bb) { return null; }
            var sg = serverGames.get(bb.id);
            return sg === undefined ? null : sg;
        }, null);
    }

    // ---- one board's scalar surface ---------------------------------------
    function addBoard(s, pfx, b) {
        if (!b) { s[pfx + "exists"] = false; return; }
        s[pfx + "exists"] = true;
        s[pfx + "id"] = R(function () { return Number(b.id); }, null);
        s[pfx + "w"] = R(function () { return Number(b.width); }, null);
        s[pfx + "h"] = R(function () { return Number(b.height); }, null);
        s[pfx + "mines"] = R(function () { return Number(b.num_bombs); }, null);
        s[pfx + "bombsLeft"] = R(function () { return Number(b.bombs_left); }, null);
        s[pfx + "seed"] = R(function () { return String(b.seed); }, null);
        s[pfx + "gameType"] = R(function () { return String(b.gameType); }, null);
        s[pfx + "started"] = R(function () { return b.isStarted() === true; }, null);
        s[pfx + "gameover"] = R(function () { return b.isGameover() === true; }, null);
        s[pfx + "won"] = R(function () { return b.won === true; }, null);
        s[pfx + "revealed"] = count(b, function (t) { return !t.isCovered(); });
        s[pfx + "covered"] = count(b, function (t) { return t.isCovered(); });
        s[pfx + "flagged"] = R(function () { return Number(b.getFlagsPlaced()); }, null);
        s[pfx + "hinted"] = count(b, function (t) { return t.getHasHint(); });
        s[pfx + "hintedCovered"] = count(b, function (t) { return t.getHasHint() && t.isCovered(); });
        s[pfx + "hintedRevealed"] = count(b, function (t) { return t.getHasHint() && !t.isCovered(); });
        s[pfx + "nextMoveMarked"] = count(b, function (t) { return t.isNextMove === true; });
        s[pfx + "safeMarked"] = count(b, function (t) { return t.isSafe === true; });
        s[pfx + "staleProb"] = count(b, function (t) { return !t.getHasHint() && Number(t.probability) >= 0; });
        s[pfx + "safeTiles"] = R(function () { return (b.safeTiles || []).length; }, null);
        s[pfx + "deadTiles"] = R(function () { return (b.deadTiles || []).length; }, null);
        s[pfx + "unflaggedMines"] = R(function () { return (b.unflaggedMines || []).length; }, null);
        s[pfx + "nextMoves"] = R(function () { return (b.nextMoves || []).length; }, null);
        s[pfx + "nm0"] = R(function () {
            var a = (b.nextMoves || [])[0];
            return a ? (a.x + "," + a.y) : "";
        }, null);
        s[pfx + "nm0Prob"] = R(function () {
            var a = (b.nextMoves || [])[0];
            return a ? Number(a.prob) : -1;
        }, null);
        s[pfx + "nm0Action"] = R(function () {
            var a = (b.nextMoves || [])[0];
            return a ? Number(a.action) : -1;
        }, null);
        s[pfx + "nmChords"] = R(function () {
            var n = 0, list = b.nextMoves || [];
            for (var i = 0; i < list.length; i++) { if (Number(list[i].action) === 3) { n++; } }
            return n;
        }, null);
        s[pfx + "nmFlags"] = R(function () {
            var n = 0, list = b.nextMoves || [];
            for (var i = 0; i < list.length; i++) { if (Number(list[i].action) === 2) { n++; } }
            return n;
        }, null);
        s[pfx + "nmClears"] = R(function () {
            var n = 0, list = b.nextMoves || [];
            for (var i = 0; i < list.length; i++) { if (Number(list[i].action) === 1) { n++; } }
            return n;
        }, null);
        s[pfx + "hash"] = R(function () { return Number(b.getHashValue()); }, null);
        s[pfx + "highDensity"] = R(function () { return b.isHighDensity() === true; }, null);
        s[pfx + "valueSum"] = R(function () {
            var n = 0;
            for (var i = 0; i < b.tiles.length; i++) { if (!b.tiles[i].isCovered()) { n += b.tiles[i].getValue(); } }
            return n;
        }, null);
        s[pfx + "canChordNow"] = R(function () {
            var n = 0;
            for (var i = 0; i < b.tiles.length; i++) {
                var t = b.tiles[i];
                if (!t.isCovered() && b.canChord(t)) { n++; }
            }
            return n;
        }, null);
    }

    // ---- the in-page "server" record for a board ---------------------------
    function addServer(s, pfx, sg) {
        if (!sg) { s[pfx + "exists"] = false; return; }
        s[pfx + "exists"] = true;
        s[pfx + "actions"] = R(function () { return Number(sg.actions); }, null);
        s[pfx + "tilesLeft"] = R(function () { return Number(sg.tilesLeft); }, null);
        s[pfx + "bv"] = R(function () { return Number(sg.value3BV); }, null);
        s[pfx + "cleared"] = R(function () { return Number(sg.cleared3BV); }, null);
        s[pfx + "start"] = R(function () { return Number(sg.startIndex); }, null);
        s[pfx + "started"] = R(function () { return sg.started === true; }, null);
        s[pfx + "seed"] = R(function () { return String(sg.seed); }, null);
        s[pfx + "bombs"] = count(sg, function (t) { return t.isBomb(); });
        s[pfx + "flagged"] = count(sg, function (t) { return t.isFlagged(); });
        s[pfx + "revealed"] = count(sg, function (t) { return !t.isCovered(); });
        s[pfx + "bvTiles"] = count(sg, function (t) { return t.is3BV === true; });
        s[pfx + "usedTiles"] = count(sg, function (t) { return t.used3BV === true; });
        s[pfx + "valueSum"] = R(function () {
            var n = 0;
            for (var i = 0; i < sg.tiles.length; i++) { n += Number(sg.tiles[i].value); }
            return n;
        }, null);
    }

    function re(source, flags) {
        try { return new RegExp(source, flags); } catch (e) { return null; }
    }
    function pick(msg, source, group, dflt) {
        var x = re(source, "");
        if (!x) { return dflt; }
        var m = x.exec(String(msg === null || msg === undefined ? "" : msg));
        return m ? m[group] : dflt;
    }

    // ---- the full pure-read snapshot --------------------------------------
    function live() {
        var s = {};
        var b = theBoard();
        var sg = theServer(b);
        var an = R(function () { return analysisBoard; }, null);
        var gm = R(function () { return gameBoard; }, null);

        s.bridge = 1;

        // --- DOM text / attributes (the only readable render surface) ---
        s.msg = ih("messageLine");
        s.msgBottom = ih("messageLineBottom");
        s.titleText = ih("title");
        s.docTitle = R(function () { return document.title; }, null);
        s.smiley = R(function () { return base(el("newGameSmiley").src); }, null);
        s.exportPttaClass = cls("exportToPtta");
        s.exportLlamaClass = cls("exportToLlama");
        s.canvasW = num("myCanvas", "width");
        s.canvasH = num("myCanvas", "height");
        s.hintsW = num("myHints", "width");
        s.hintsH = num("myHints", "height");
        s.ledW = num("myMinesLeft", "width");
        s.ledH = num("myMinesLeft", "height");
        s.propertiesDisplay = dsp("properties");
        s.selectPlayerClass = cls("selectPlayer");
        s.selectAnalyserClass = cls("selectAnalyser");
        s.play0Display = dsp("play0");
        s.play1Display = dsp("play1");
        s.analysis0Display = dsp("analysis0");
        s.analysis1Display = dsp("analysis1");
        s.repeatGameDisplay = dsp("repeatGame");
        s.newGameLabel = ih("NewGame");
        s.switchButtonText = ih("switchButton");
        s.switchButtonClass = cls("switchButton");
        s.analysisButtonDisabled = R(function () { return el("AnalysisButton").disabled === true; }, null);
        s.cursorStyle = R(function () { return String(el("canvas").style.cursor); }, null);
        s.tooltipText = R(function () { return String(el("tooltip").innerText); }, null);
        s.boardStyleTop = R(function () { return String(el("board").style.top); }, null);
        s.boardStyleLeft = R(function () { return String(el("board").style.left); }, null);
        s.wholeBoardOverflow = R(function () { return String(el("wholeboard").style.overflow); }, null);

        // --- control surface ---
        s.saveSettingsChecked = ck("saveSettings");
        s.tileSizeSelect = vl("tilesize");
        s.playstyleSelect = vl("playstyle");
        s.overlaySelect = vl("overlay");
        s.showhintsChecked = ck("showhints");
        s.autoplayChecked = ck("autoplay");
        s.acceptguessesChecked = ck("acceptguesses");
        s.gameTypeZeroChecked = ck("gameTypeZero");
        s.fastPlayChecked = ck("fastPlay");
        s.hardcoreChecked = ck("hardcore");
        s.reductionChecked = ck("reduction");
        s.lockMineCountChecked = ck("lockMineCount");
        s.buildModeChecked = ck("buildMode");
        s.buildZeroChecked = ck("buildZero");
        s.flagIsMineChecked = ck("flagIsMine");
        s.urlQueryStringChecked = ck("urlQueryString");
        s.useSeedChecked = ck("useSeed");
        s.seedValue = vl("seed");
        s.widthValue = vl("width");
        s.heightValue = vl("height");
        s.minesValue = vl("mines");
        s.beginnerChecked = ck("beginner");
        s.intermediateChecked = ck("intermediate");
        s.expertChecked = ck("expert");
        s.customChecked = ck("custom");
        s.pruneGuessesChecked = ck("pruneGuesses");
        s.useLTRChecked = ck("useLTR");
        s.early5050Checked = ck("early5050");
        s.reuseBruteForceChecked = ck("reuseBruteForce");
        s.bfMaxSolutionsValue = vl("bruteForceMaxSolutions");

        // --- data-testid probe presence (instrumentation self-check) ---
        s.probeBoardCanvas = tid("board-canvas");
        s.probeMessageLine = tid("message-line");
        s.probeTileSize = tid("tile-size");
        s.probeCount = R(function () { return document.querySelectorAll("[data-testid]").length; }, null);

        // --- persistence / URL / global residue (state isolation surface) ---
        s.storageCount = R(function () { return Number(localStorage.length); }, null);
        s.storageKeys = R(function () {
            var k = [];
            for (var i = 0; i < localStorage.length; i++) { k.push(localStorage.key(i)); }
            return k.sort().join(",");
        }, null);
        s.storageHasSettings = R(function () { return localStorage.getItem("settings") !== null; }, null);
        s.storageSettings = R(function () {
            var v = localStorage.getItem("settings");
            return v === null ? "" : String(v);
        }, null);
        s.storageSettingsLen = R(function () {
            var v = localStorage.getItem("settings");
            return v === null ? -1 : String(v).length;
        }, null);
        s.sessionCount = R(function () { return Number(sessionStorage.length); }, null);
        s.cookieLen = R(function () { return String(document.cookie || "").length; }, null);
        s.urlSearch = R(function () { return String(location.search); }, null);
        s.urlHasAnalysis = R(function () { return /[?&]analysis=/.test(String(location.search)); }, null);
        s.residueGlobals = R(function () {
            var n = 0;
            for (var k in window) { if (/^__rb_|^__repair|^__fix|^__hack/.test(k)) { n++; } }
            return n;
        }, null);

        // --- main.js module state ---
        s.tileSize = R(function () { return Number(TILE_SIZE); }, null);
        s.locked = R(function () { return canvasLocked === true; }, null);
        s.analysisMode = R(function () { return analysisMode === true; }, null);
        s.replayMode = R(function () { return replayMode === true; }, null);
        s.prevHash = R(function () { return Number(previousBoardHash); }, null);
        s.exportParms = R(function () { return exportParms === null ? "" : String(exportParms); }, null);
        s.exportParmsLen = R(function () { return exportParms === null ? -1 : String(exportParms).length; }, null);
        s.leftClickFlag = R(function () { return leftClickFlag === true; }, null);
        s.isExpanded = R(function () { return isExpanded === true; }, null);
        s.dragging = R(function () { return dragging === true; }, null);
        s.alwaysLockMineCounter = R(function () { return ALWAYS_LOCK_MINE_COUNTER === true; }, null);
        s.sgPruneGuesses = R(function () { return SolverGlobal.PRUNE_GUESSES === true; }, null);
        s.sgEarly5050 = R(function () { return SolverGlobal.EARLY_FIFTY_FIFTY_CHECKING === true; }, null);
        s.sgUseLTR = R(function () { return SolverGlobal.CALCULATE_LONG_TERM_SAFETY === true; }, null);
        s.sgReuseBF = R(function () { return SolverGlobal.REUSE_BRUTE_FORCE_ANALYSIS === true; }, null);
        s.bfgPrune = R(function () { return BruteForceGlobal.PRUNE_BF_ANALYSIS === true; }, null);
        s.bfgIncludeDead = R(function () { return BruteForceGlobal.INCLUDE_DEAD_TOP_TILES === true; }, null);
        s.bfgThreshold = R(function () { return Number(BruteForceGlobal.ANALYSIS_BFDA_THRESHOLD); }, null);
        s.serverGameCount = R(function () { return Number(serverGames.size); }, null);

        // --- boards ---
        addBoard(s, "", b);
        addBoard(s, "an_", an);
        addBoard(s, "gm_", gm);
        addServer(s, "sv_", sg);
        addServer(s, "an_sv_", theServer(an));

        // --- derived classifiers over the message line ---
        var m = s.msg === null ? "" : String(s.msg);
        s.msgUnable = (m === "Unable to continue");
        s.msgIdle = (m === "The solver is not running. Press the 'Analyse' button to see the solver's suggested move.");
        s.msgPressAnalyse = (m === "Press the 'Analyse' button to see the solver's suggested move.");
        s.msgAllSafe = (m === "No mines left to find, all the remaining tiles are safe");
        s.msgAllMines = (m === "No safe tiles left to find, all the remaining tiles are mines");
        s.msgWelcome = (m === "Welcome to minesweeper solver dedicated to Annie");
        s.msgNewGame = /^New game requested with width /.test(m);
        s.msgValidBoard = /^The board is valid\./.test(m);
        s.msgInvalidBoard = /^The board is in an invalid state/.test(m);
        s.msgGameOver = /^The game has been (won|lost)\./.test(m);
        s.msgStatus = pick(m, "^The game has been (won|lost)\\.", 1, "");
        s.msgSolved3BV = Number(pick(m, "3BV: (\\d+)\\/\\d+,", 1, -1));
        s.msgValue3BV = Number(pick(m, "3BV: \\d+\\/(\\d+),", 1, -1));
        s.msgThreeBV = pick(m, "3BV: (\\d+\\/\\d+),", 1, "");
        s.msgActions = Number(pick(m, "Actions: (\\d+),", 1, -1));
        s.msgEff = pick(m, "Efficiency: (\\S+)", 1, "");
        s.msgEffNum = Number(pick(m, "Efficiency: (\\d+(?:\\.\\d+)?)%", 1, -1));
        s.msgMinesPlaced = Number(pick(m, "^The board is valid\\. (\\d+) Mines placed\\.", 1, -1));
        s.msgFoundSafe = Number(pick(m, "^Found (\\d+) safe tiles\\.", 1, -1));
        s.msgFoundTrivial = Number(pick(m, "^Found (\\d+) trivial safe moves", 1, -1));
        s.msgSolutions = Number(pick(m, "([\\d,]+) possible solutions? remain", 1, "").replace(/,/g, "") || -1);
        s.msgLen = m.length;

        // --- watched tiles (registered with __MSX__.watch) ---
        for (var i = 0; i < WATCH.length; i++) {
            var c = WATCH[i][0], r = WATCH[i][1];
            s["w" + i] = R(function () {
                var t = board.getTileXY(c, r);
                if (!t) { return null; }
                return {
                    x: Number(t.x), y: Number(t.y), index: Number(t.index),
                    covered: t.isCovered() === true, flagged: t.isFlagged() === true,
                    value: Number(t.getValue()), prob: Number(t.probability),
                    hasHint: t.getHasHint() === true, hint: String(t.hintText === null || t.hintText === undefined ? "" : t.hintText),
                    hintAll: String(t.getHintText() === null || t.getHintText() === undefined ? "" : t.getHintText()),
                    eff: String(t.efficiencyText === null || t.efficiencyText === undefined ? "" : t.efficiencyText),
                    win: String(t.winRateText === null || t.winRateText === undefined ? "" : t.winRateText),
                    foundBomb: t.foundBomb === true, isSafe: t.isSafe === true, skull: t.skull === true,
                    onEdge: t.isOnEdge() === true, nextMove: t.isNextMove === true, bomb: t.isBomb() === true
                };
            }, null);
            s["sw" + i] = R(function () {
                var t = serverGames.get(board.id).getTile(board.xy_to_index(c, r));
                if (!t) { return null; }
                return {
                    bomb: t.isBomb() === true, covered: t.isCovered() === true,
                    flagged: t.isFlagged() === true, value: Number(t.value),
                    bv: t.is3BV === true, used: t.used3BV === true, exploded: t.exploded === true
                };
            }, null);
        }

        return s;
    }

    // ---- driver ------------------------------------------------------------
    function unlocked() { return R(function () { return canvasLocked === false; }, false); }

    var X = {
        // readiness: startup() ends with the welcome message and an unlocked canvas
        waitReady: function (ms) {
            var limit = Number(ms) > 0 ? Number(ms) : 25000;
            var t0 = Date.now();
            return (function loop() {
                var s = live();
                if (s.msgWelcome === true && s.exists === true && s.locked === false) { return Promise.resolve(true); }
                if (Date.now() - t0 > limit) { return Promise.resolve(false); }
                return sleep(50).then(loop);
            })();
        },
        waitUnlocked: function (ms) {
            var limit = Number(ms) > 0 ? Number(ms) : 20000;
            var t0 = Date.now();
            return (function loop() {
                if (unlocked()) { return Promise.resolve(true); }
                if (Date.now() - t0 > limit) { return Promise.resolve(false); }
                return sleep(40).then(loop);
            })();
        },
        waitMsg: function (source, ms) {
            var x = re(source, "");
            var limit = Number(ms) > 0 ? Number(ms) : 20000;
            var t0 = Date.now();
            return (function loop() {
                if (x && x.test(String(live().msg || ""))) { return Promise.resolve(true); }
                if (Date.now() - t0 > limit) { return Promise.resolve(false); }
                return sleep(60).then(loop);
            })();
        },

        clearStorage: function () {
            R(function () { localStorage.clear(); return 1; }, 0);
            R(function () { sessionStorage.clear(); return 1; }, 0);
            return true;
        },

        // mirrors the on-page controls.  Assigning .checked/.value fires no handler,
        // so configuration alone never moves the game.
        config: function (o) {
            o = o || {};
            function setC(id, v) { if (o[id] !== undefined) { R(function () { el(id).checked = (v === true || v === "true" || v === 1); return 1; }, 0); } }
            function setV(id, v) { if (o[id] !== undefined) { R(function () { el(id).value = String(v); return 1; }, 0); } }
            var flags = ["useSeed", "gameTypeZero", "noGuessMode", "fastPlay", "hardcore", "reduction", "showhints",
                "autoplay", "acceptguesses", "buildMode", "lockMineCount", "flagIsMine", "urlQueryString",
                "saveSettings", "pruneGuesses", "useLTR", "early5050", "pruneBruteForce", "includeDeadTilesBf",
                "defaultLockMineCounter", "reuseBruteForce"];
            var i;
            for (i = 0; i < flags.length; i++) { setC(flags[i], o[flags[i]] === true); }
            setV("overlay", o.overlay);
            setV("playstyle", o.playstyle);
            setV("tilesize", o.tilesize);
            setV("seed", o.seed);
            setV("bruteForceMaxSolutions", o.bruteForceMaxSolutions);
            if (o.leftClickFlag !== undefined) { R(function () { leftClickFlag = (o.leftClickFlag === true); return 1; }, 0); }
            // the Settings dialog only pushes these into the solver when it is closed;
            // set them directly so a scenario does not have to open the dialog.
            if (o.pruneGuesses !== undefined) { R(function () { SolverGlobal.PRUNE_GUESSES = (o.pruneGuesses === true); return 1; }, 0); }
            if (o.useLTR !== undefined) { R(function () { SolverGlobal.CALCULATE_LONG_TERM_SAFETY = (o.useLTR === true); return 1; }, 0); }
            if (o.early5050 !== undefined) { R(function () { SolverGlobal.EARLY_FIFTY_FIFTY_CHECKING = (o.early5050 === true); return 1; }, 0); }
            if (o.reuseBruteForce !== undefined) { R(function () { SolverGlobal.REUSE_BRUTE_FORCE_ANALYSIS = (o.reuseBruteForce === true); return 1; }, 0); }
            if (o.pruneBruteForce !== undefined) { R(function () { BruteForceGlobal.PRUNE_BF_ANALYSIS = (o.pruneBruteForce === true); return 1; }, 0); }
            if (o.includeDeadTilesBf !== undefined) { R(function () { BruteForceGlobal.INCLUDE_DEAD_TOP_TILES = (o.includeDeadTilesBf === true); return 1; }, 0); }
            return true;
        },

        watch: function (col, row) { WATCH.push([Number(col), Number(row)]); return WATCH.length - 1; },
        unwatchAll: function () { WATCH = []; return true; },

        newGame: function (w, h, mines, seed, analyse) {
            return X.waitUnlocked(20000).then(function () {
                return R(function () { return newGame(Number(w), Number(h), Number(mines), seed, analyse === true); }, Promise.resolve(false));
            }).then(function () { return X.waitUnlocked(20000); }).then(function () { return sleep(40).then(function () { return true; }); });
        },

        applyNewGame: function () {
            return X.waitUnlocked(20000).then(function () {
                R(function () { apply(); return 1; }, 0);
                return X.waitUnlocked(20000);
            }).then(function () { return sleep(40).then(function () { return true; }); });
        },

        // left button down+up on a tile: reveal when covered, chord when revealed
        click: function (col, row) {
            return X.waitUnlocked(20000).then(function () {
                R(function () { clickAction({ col: Number(col), row: Number(row), which: 1 }); return 1; }, 0);
                R(function () { releaseAction({ col: Number(col), row: Number(row), which: 1 }); return 1; }, 0);
                return X.waitUnlocked(20000);
            }).then(function () { return sleep(40).then(function () { return true; }); });
        },

        // right button: flag in play mode, place/remove a mine in the analyser
        flag: function (col, row) {
            return X.waitUnlocked(20000).then(function () {
                R(function () { clickAction({ col: Number(col), row: Number(row), which: 3 }); return 1; }, 0);
                R(function () { releaseAction({ col: Number(col), row: Number(row), which: 3 }); return 1; }, 0);
                return X.waitUnlocked(20000);
            }).then(function () { return sleep(40).then(function () { return true; }); });
        },

        flagList: function (list) {
            var i = 0;
            return (function next() {
                if (i >= list.length) { return Promise.resolve(true); }
                var p = list[i++];
                return X.flag(p[0], p[1]).then(next);
            })();
        },

        // send every still-covered non-mine tile to the server in one message
        revealSafe: function () {
            return X.waitUnlocked(20000).then(function () {
                var b = theBoard(), sg = theServer(b);
                if (!b || !sg) { return false; }
                var acts = [];
                for (var i = 0; i < sg.tiles.length; i++) {
                    if (!sg.tiles[i].isBomb()) { acts.push({ index: i, action: 1 }); }
                }
                if (!acts.length) { return false; }
                return R(function () {
                    return sendActionsMessage({ header: b.getMessageHeader(), actions: acts });
                }, Promise.resolve(false)).then(function () { return X.waitUnlocked(30000); }).then(function () { return sleep(40).then(function () { return true; }); });
            });
        },

        // deliberately step on a mine so the end-of-game report is produced
        loseGame: function () {
            return X.waitUnlocked(20000).then(function () {
                var b = theBoard(), sg = theServer(b);
                if (!b || !sg) { return ""; }
                for (var i = 0; i < sg.tiles.length; i++) {
                    if (!sg.tiles[i].isBomb()) { continue; }
                    var t = b.getTile(i);
                    if (!t || !t.isCovered() || t.isFlagged()) { continue; }
                    var c = t.x, r = t.y;
                    R(function () { clickAction({ col: c, row: r, which: 1 }); return 1; }, 0);
                    R(function () { releaseAction({ col: c, row: r, which: 1 }); return 1; }, 0);
                    return X.waitUnlocked(30000).then(function () { return sleep(40).then(function () { return c + "," + r; }); });
                }
                return "";
            });
        },

        solve: function () {
            return X.waitUnlocked(20000).then(function () {
                return R(function () { return startSolver(); }, Promise.resolve(false));
            }).then(function () { return X.waitUnlocked(30000); }).then(function () { return sleep(40).then(function () { return true; }); });
        },

        analyse: function () {
            return X.waitUnlocked(20000).then(function () {
                return R(function () { return doAnalysis(true); }, Promise.resolve(false));
            }).then(function () { return X.waitUnlocked(30000); }).then(function () { return sleep(240).then(function () { return true; }); });
        },

        // retries until the mode really changed: the 1s board checker can hold the
        // canvas lock, and switchToAnalysis() gives up when it is held.
        setAnalysis: function (want) {
            var target = (want === true);
            var i = 0;
            return (function next() {
                if (R(function () { return analysisMode === target; }, false)) { return Promise.resolve(true); }
                if (i++ > 60) { return Promise.resolve(false); }
                return X.waitUnlocked(8000).then(function () {
                    R(function () { setAnalysis(target); return 1; }, 0);
                    return sleep(60);
                }).then(function () { return X.waitUnlocked(8000); }).then(next);
            })();
        },

        openProps: function () { R(function () { propertiesOpen(); return 1; }, 0); return true; },
        closeProps: function () {
            return R(function () { return propertiesClose(); }, Promise.resolve(false))
                .then(function () { return X.waitUnlocked(20000); })
                .then(function () { return sleep(40).then(function () { return true; }); });
        },

        // real user path: the <select> onchange handler is changeTileSize(true)
        setTileSize: function (v) {
            return X.waitUnlocked(20000).then(function () {
                R(function () {
                    var sel = el("tilesize");
                    sel.value = String(v);
                    sel.dispatchEvent(new Event("change"));
                    return 1;
                }, 0);
                return X.waitUnlocked(20000);
            }).then(function () { return sleep(60).then(function () { return true; }); });
        },

        snap: function (tag) { FROZEN[String(tag)] = live(); return String(tag); },
        info: function () { return live(); }
    };

    window.__MSQ__ = function () { return { frozen: FROZEN }; };
    window.__MSX__ = X;
})();

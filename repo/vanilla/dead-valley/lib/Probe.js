// Probe.js -- measurement bridge added by the repair harness (instrumentation only).
//
// It adds NO application behaviour: nothing here subscribes to an application event
// bus, nothing here renders, and nothing here changes game state on its own. Three
// surfaces are published on window:
//
//   __DVQ__()  pure read. Flat snapshot of scalars plus the `frozen` bag. Safe to
//              call from an assertion poll: no writes, no timers, no events.
//   __DVX__    write surface, used from checkpoint SETUP steps only. Every command is
//              wrapped so it can never throw into the runner (it returns "ERR:..." ).
//   __DVW__    Promise waiters, also SETUP only (a setup js_eval is awaited).
//
// Monotone quantities (game clock, frame counters, cumulative distance/fuel) are only
// ever SAMPLED inside setup via __DVX__.snap(label) and then compared sample-to-sample,
// never asserted as "the value at this moment".
define(['Game', 'MainLoop'], function (Game, MainLoop) {

  var frozen = {};

  var q  = function (sel) { return document.querySelector(sel); };
  var qa = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  // Playwright visibility semantics: non-empty box and visibility !== 'hidden'
  // (opacity is deliberately NOT part of it) so probe reads and DOM asserts agree.
  var shown = function (el) {
    if (!el) { return false; }
    var st;
    try { st = window.getComputedStyle(el); } catch (e) { return false; }
    if (!st || st.visibility === 'hidden' || st.display === 'none') { return false; }
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  var shownSel = function (sel) { return shown(q(sel)); };

  var norm = function (s) {
    return String(s === null || s === undefined ? '' : s).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  };
  var text = function (sel) { var el = q(sel); return el ? norm(el.textContent) : ''; };
  var cls  = function (sel) { var el = q(sel); return el ? String(el.className || '') : ''; };
  var has  = function (sel, word) { return cls(sel).split(/\s+/).indexOf(word) >= 0; };

  var transformKey = (window.Modernizr && window.Modernizr.prefixed)
    ? window.Modernizr.prefixed('transform') : 'transform';

  var needleAngle = function () {
    var el = q('#fuel-gauge-needle');
    if (!el || !el.style) { return ''; }
    var st = el.style;
    return String(st[transformKey] || st.transform || st.webkitTransform || '');
  };

  // The pickup the prologue parks next to the farmhouse: the only vehicle in the
  // starting section that is spawned with fuel (maps/NS_start.json, 1658/2041).
  var truck = function () {
    var list = (Game && Game.sprites) || [];
    var i, sp, fallback = null;
    for (i = 0; i < list.length; i++) {
      sp = list[i];
      if (!sp || !sp.isCar || !sp.hasFuel || !sp.pos) { continue; }
      if (Math.abs(sp.pos.x - 1658) < 3 && Math.abs(sp.pos.y - 2041) < 3) { return sp; }
      if (!fallback && sp.hasFuel()) { fallback = sp; }
    }
    return fallback;
  };

  var countTips = function (needle) {
    return qa('.tip').filter(function (el) {
      return String(el.textContent || '').indexOf(needle) >= 0;
    }).length;
  };

  var read = function () {
    var s = {};
    var dude = Game ? Game.dude : null;
    var car = (dude && dude.driving) ? dude.driving : null;
    var t = truck();
    var life = q('#life');
    var pack = q('#dude-inventory');
    var stats = q('#stats-content');

    // ---- boot / main menu ----
    s.mapReady         = !!(Game && Game.map);
    s.menuShown        = shownSel('#main-screen');
    s.menuTitle        = text('#title');
    s.menuEntries      = qa('#menu li').length;
    s.menuShownEntries = qa('#menu li').filter(function (el) { return shown(el); }).length;
    s.menuSelected     = (q('#menu li.selected') || {}).id || '';
    s.resumeShown      = shownSel('#resume-game');
    s.resumeSelected   = has('#resume-game', 'selected');
    s.statsEntryShown  = shownSel('#stats');
    s.soundMarker      = text('#sound .choice span.on');
    s.soundChoices     = qa('#sound .choice span').length;
    s.pauseClass       = has('#main-screen', 'pause');
    s.paused           = !!(MainLoop && MainLoop.isPaused && MainLoop.isPaused());
    s.gameOver         = !!(Game && Game.isOver);

    // ---- secondary screens / prologue ----
    s.helpShown        = shownSel('#help');
    s.aboutShown       = shownSel('#about-screen');
    s.statsShown       = shownSel('#stats-screen');
    s.introShown       = shownSel('#intro-screen');
    s.trialLineShown   = shownSel('#time-trial-text');
    s.prologueParas    = qa('#intro-text p').length;
    s.loadingShown     = shownSel('#loading-screen');
    s.progressShown    = shownSel('#progress');
    s.gameoverShown    = shownSel('#game-over-screen');

    // ---- HUD readouts ----
    s.clockText        = text('#time');
    s.countdownShown   = shownSel('#time-remaining');
    s.countdownText    = text('#time-remaining');
    s.countdownSaysRemaining = s.countdownText.indexOf('Remaining') >= 0;
    s.odometerText     = text('#distance');
    s.fpsActive        = has('#framerate', 'active');
    s.readoutSpans     = qa('#lower-right > span').length;

    // ---- vitals ----
    s.heartFull        = life ? life.querySelectorAll('.heart.full').length : -1;
    s.heartEmpty       = life ? life.querySelectorAll('.heart.empty').length : -1;
    s.heartHalf        = life ? life.querySelectorAll('.heart.left-half').length : -1;
    s.heartAll         = life ? life.querySelectorAll('.heart').length : -1;
    s.dudeHealth       = dude ? dude.health : -1;
    s.dudeMaxHealth    = dude ? dude.maxHealth : -1;
    s.heartContainers  = dude ? Math.round(dude.maxHealth / 2) : -1;

    // ---- world / dude ----
    s.targetMiles      = Game ? Game.targetMiles : -1;
    s.dudeExists       = !!dude;
    s.dudeDistance     = dude ? dude.distanceFromOrigin() : -1;
    s.dudeDriving      = !!car;
    s.dudeInside       = !!(dude && dude.inside);
    s.spriteCount      = ((Game && Game.sprites) || []).length;
    s.carCount         = ((Game && Game.sprites) || []).filter(function (sp) { return !!(sp && sp.isCar); }).length;
    s.packItemCount    = (dude && dude.inventory && dude.inventory.items) ? dude.inventory.items.length : -1;
    s.handsItemCount   = (dude && dude.hands && dude.hands.items) ? dude.hands.items.length : -1;

    // ---- panels ----
    s.packTables       = pack ? pack.querySelectorAll('table.inventory').length : -1;
    s.packCells        = pack ? pack.querySelectorAll('table.inventory td').length : -1;
    s.packShown        = shownSel('#dude-inventory');
    s.cargoShown       = shownSel('#other-inventory');
    s.dialShown        = shownSel('#fuel-gauge');
    s.needleAngle      = needleAngle();
    s.engineLampShown  = shownSel('#check-engine-light');
    s.lowFuelLampShown = shownSel('#low-fuel-light');

    // ---- truck fuel model ----
    s.truckFound       = !!t;
    s.truckFuel        = t ? t.currentFuel : -1;
    s.truckCapacity    = t ? t.fuelCapacity : -1;
    s.truckPercent     = t ? Math.round(1000 * t.percentFuelRemaining()) / 1000 : -1;
    s.truckHealth      = t ? t.health : -1;

    // ---- hints ----
    s.tipCount         = qa('.tip').length;
    s.tipMove          = countTips('move around');
    s.tipDrive         = countTips('WASD to drive');
    s.tipSkip          = !!q('#skip-hints');

    // ---- stats screen ----
    s.statsHeaders     = stats ? stats.querySelectorAll('h2').length : -1;
    var zh = stats ? qa('#stats-content h2').filter(function (el) {
      return String(el.textContent || '').indexOf('Zombies Dispatched') === 0;
    }) : [];
    s.statsZombieHeader = zh.length ? norm(zh[0].textContent) : '';
    s.tallyOrder       = stats ? qa('#stats-content p').map(function (el) { return norm(el.textContent); }).join('|') : '';

    // ---- residue / isolation ----
    s.lsKeys           = window.localStorage ? window.localStorage.length : -1;
    s.ssKeys           = window.sessionStorage ? window.sessionStorage.length : -1;
    s.cookieLen        = String(document.cookie || '').length;
    s.hashLen          = String(window.location.hash || '').length;
    s.searchLen        = String(window.location.search || '').length;
    s.hasDudeSave      = !!(window.localStorage && window.localStorage.getItem('dude') !== null);
    s.cheatKeys        = window.Cheat ? Object.keys(window.Cheat).length : -1;

    return s;
  };

  var guard = function (fn) {
    return function () {
      try { return fn.apply(null, arguments); }
      catch (e) { return 'ERR:' + String((e && e.message) || e); }
    };
  };

  var X = {
    clearStorage: guard(function () {
      try { window.localStorage.clear(); } catch (e) { /* private mode */ }
      try { window.sessionStorage.clear(); } catch (e) { /* private mode */ }
      return true;
    }),
    seedStats: guard(function (json) { window.localStorage.setItem('stats', String(json)); return true; }),
    seedDude:  guard(function (json) { window.localStorage.setItem('dude', String(json)); return true; }),
    clickSel:  guard(function (sel) {
      var el = q(sel);
      if (!el) { return 'ERR:no element ' + sel; }
      if (window.jQuery) { window.jQuery(el).trigger('click'); } else { el.click(); }
      return true;
    }),
    snap:       guard(function (label) { frozen[String(label)] = read(); return true; }),
    resetFrozen: guard(function () { frozen = {}; return true; }),
    // sample the vitals path deterministically: top the dude up, take exactly `amount`
    // damage through the real Dude#takeDamage, then make him invulnerable so a roaming
    // zombie cannot add a second, unsampled hit before the assertion reads the meter.
    hurt: guard(function (amount) {
      var d = Game && Game.dude;
      if (!d) { return 'ERR:no dude'; }
      d.health = d.maxHealth;
      d.invulnerabilityCounter = 0;
      d.takingDamage = false;
      d.takeDamage(Number(amount) || 1, null, {}, null);
      d.makeInvulnerable();
      return true;
    }),
    // walk the dude to the fuelled pickup and drive him in through the very method the
    // E key routes to (Dude#enterOrExit). The world is generated with Math.random, so
    // the walk itself is not reproducible; the enter/exit path is.
    enterTruck: guard(function () {
      var d = Game && Game.dude, t = truck();
      if (!d) { return 'ERR:no dude'; }
      if (!t) { return 'ERR:no fuelled car in the starting section'; }
      if (d.driving) { return true; }
      var spot = t.driversSideLocation ? t.driversSideLocation() : t.pos;
      d.pos.set(spot);
      if (d.updateGrid) { d.updateGrid(); }
      if (d.touching && d.touching.indexOf(t) < 0) { d.touching.push(t); }
      d.enterOrExit();
      return !!d.driving;
    }),
    drainTruckFuel: guard(function (amount) {
      var d = Game && Game.dude;
      var t = (d && d.driving) ? d.driving : truck();
      if (!t || !t.receiveFuel) { return 'ERR:no fuel receiver'; }
      t.receiveFuel(-(Number(amount) || 1));
      return true;
    })
  };

  var poll = function (pred, ms) {
    var limit = Number(ms) || 20000;
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function loop() {
        var hit = false;
        try { hit = !!pred(); } catch (e) { hit = false; }
        if (hit) { resolve(true); return; }
        if (Date.now() - t0 > limit) { resolve(false); return; }
        window.setTimeout(loop, 60);
      })();
    });
  };

  var W = {
    bridgeReady: function (ms) { return poll(function () { return true; }, ms); },
    menuReady:   function (ms) { return poll(function () { return Game && Game.map && shownSel('#main-screen'); }, ms); },
    runStarted:  function (ms) { return poll(function () {
      return Game && Game.dude && Game.dude.health > 0 && Game.isOver === false && !shownSel('#main-screen');
    }, ms); },
    driving:     function (ms) { return poll(function () { return Game && Game.dude && !!Game.dude.driving; }, ms); },
    // two animation frames: enough for the 'end frame' HUD pass to have run
    settled: function () {
      return new Promise(function (resolve) {
        var done = false;
        var finish = function (v) { if (!done) { done = true; resolve(v); } };
        window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { finish(true); }); });
        window.setTimeout(function () { finish(false); }, 8000);
      });
    }
  };

  window.__DVQ__ = function () {
    var s;
    try { s = read(); } catch (e) { s = { probeError: String((e && e.message) || e) }; }
    s.frozen = frozen;
    return s;
  };
  window.__DVX__ = X;
  window.__DVW__ = W;

  return { ready: true, snapshot: window.__DVQ__ };
});

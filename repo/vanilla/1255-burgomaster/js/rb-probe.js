// rb-probe.js - RepairBench instrumentation bridge for 1255: Rise of Teutonics.
// Purpose: expose the seed's own state and action surface to the verifier without
// changing any gameplay rule. Three rules this file obeys:
//   1. LIVE-ONLY getters - window.__BM__() re-reads game state and the DOM on every
//      call and never caches, so a polled assertion always sees fresh values.
//   2. Every side effect lives in window.__BM_CMD__ (setup-driven); the getters above
//      are pure reads.
//   3. Determinism hooks only freeze/seed what the seed already makes non-deterministic
//      (its 1s timers, the 100s random-event timer and Math.random); they never alter
//      formulas, costs or rules.
(function () {
  "use strict";
  function byId(id) { return document.getElementById(id); }
  function txt(id) { var e = byId(id); return e ? String(e.textContent || "").replace(/\s+/g, " ").trim() : null; }
  function html(id) { var e = byId(id); return e ? String(e.innerHTML || "").replace(/\s+/g, " ").trim() : null; }
  function attr(id, a) { var e = byId(id); return e ? e.getAttribute(a) : null; }
  function style(id, p) { var e = byId(id); return e ? getComputedStyle(e)[p] : null; }
  function count(sel) { try { return document.querySelectorAll(sel).length; } catch (e) { return -1; } }
  function ids(sel) { try { return Array.prototype.map.call(document.querySelectorAll(sel), function (e) { return e.id; }).join("|"); } catch (e) { return ""; } }
  function num(v) { return (typeof v === "number" && isFinite(v)) ? v : null; }
  function stack(army, unit) {
    try {
      var u = army && army.units ? army.units[unit] : null;
      return u ? { count: u.count, stackHealth: u.stackHealth, health: u.health } : null;
    } catch (e) { return null; }
  }

  // ---- deterministic RNG (seeded LCG). The seed's combat/map code calls
  // randomFromRange()/Math.random(); freezing it makes those paths reproducible.
  var rngBackup = null;
  function seedRng(seed) {
    if (rngBackup === null) rngBackup = Math.random;
    var s = (Number(seed) >>> 0) || 1;
    Math.random = function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    return true;
  }
  function restoreRng() { if (rngBackup !== null) { Math.random = rngBackup; rngBackup = null; } return true; }

  window.__BM__ = function () {
    var g = window.game || {};
    var c = window.config || {};
    var myArmy = g.myheroArmy || { units: {} };
    var enArmy = g.enemyHeroArmy || { units: {} };
    return {
      // --- bridge/boot calibration ---
      ready: !!(window.game && window.config && window.locObj && window.__BM_CMD__ && window.__BM_RNG__
        && typeof window.updateButtonCaptions === "function" && typeof window.updateImagesBuildingTab === "function"
        && typeof window.researchTech === "function" && typeof window.calcAttackPhase === "function"
        && typeof window.setupAutosave === "function" && typeof window.changeColorMode === "function"
        && typeof window.openTab === "function" && typeof window.saveGame === "function"
        && window.tech_list && window.knightsData && window.sergeantsData && window.banditWarrior),
      language: window.language || null,
      locKeys: window.locObj ? Object.keys(window.locObj).length : 0,
      dcounter: window.dcounter_component ? num(window.dcounter_component.dcounter) : null,
      dialogShown: !!window.dialogShown,

      // --- treasury / population / calendar scalars ---
      gold: num(g.gold), gems: num(g.gems), pop: num(g.pop), food: num(g.food),
      happiness: num(g.happiness), season: num(g.season), year: num(g.year), ticks: num(g.ticks),
      treasuryGuard: num(g.treasuryGuard), sergeants: num(g.sergeants), turkopols: num(g.turkopols),
      knights: num(g.knights), fire: num(g.fire), fireGuard: num(g.fireGuard),
      festivalCooldown: num(g.festival_cooldown), prestige: num(g.prestige),

      // --- building levels ---
      lvlD: num(g.buildLevelD), lvlH: num(g.buildLevelH), lvlTreasury: num(g.buildLevelTreasury),
      lvlGallows: num(g.buildLevelGallows), lvlFountain: num(g.buildLevelFountain), lvlStash: num(g.buildLevelStash),
      lvlInn: num(g.buildLevelInn), lvlStable: num(g.buildLevelStable), lvlArchery: num(g.buildLevelArchery),
      lvlUniversity: num(g.buildLevelUniversity),

      // --- derived rules (called live, so a formula defect shows up here) ---
      goldLimit: typeof g.goldLimit === "function" ? num(g.goldLimit()) : null,
      popLimit: typeof g.popLimit === "function" ? num(g.popLimit()) : null,
      cityLevel: typeof g.getCityLevel === "function" ? num(g.getCityLevel()) : null,
      fireUpkeep: typeof g.fireGuardUpkeep === "function" ? num(g.fireGuardUpkeep()) : null,
      festivalPrice: typeof g.festivalPrice === "function" ? num(g.festivalPrice()) : null,
      guardHireCost: typeof g.hireTreasuryGuardCost === "function" ? num(g.hireTreasuryGuardCost()) : null,
      knightsUpkeep3: typeof g.hrKnghtsUpkp === "function" ? num(g.hrKnghtsUpkp(3)) : null,
      sergeantsUpkeep3: typeof g.hrSrgntsUpkp === "function" ? num(g.hrSrgntsUpkp(3)) : null,
      turkopolsUpkeep3: typeof g.hrTrkplsUpkp === "function" ? num(g.hrTrkplsUpkp(3)) : null,
      heroExists: typeof g.heroExists === "function" ? !!g.heroExists() : null,

      // --- history / progress arrays ---
      yearsLen: (g.years || []).length, popsLen: (g.pops || []).length, budgetsLen: (g.budgets || []).length,
      budgetTail: (g.budgets || []).length ? num((g.budgets || []).slice(-1)[0]) : null,
      yearTail: (g.years || []).length ? String((g.years || []).slice(-1)[0]) : null,
      techLearnedLen: (g.techLearned || []).length,
      techLearnedJoined: (g.techLearned || []).join("|"),
      tipsJoined: (g.tips || []).join("|"),
      tipsLen: (g.tips || []).length,
      blackMarketLen: (g.blackMarketGoods || []).length,
      mapCreated: num(g.mapCreated), mapLandLen: (g.myMapLand || []).length,

      // --- combat state ---
      attacker: num(g.attacker), isAutoBattle: !!g.isAutoBattle,
      myKnights: stack(myArmy, "knights"), mySergeants: stack(myArmy, "sergeants"),
      myTurkopols: stack(myArmy, "turkopols"), enemyBandits: stack(enArmy, "bandit"),
      myUnitsLen: myArmy.units ? Object.keys(myArmy.units).length : 0,
      enemyUnitsLen: enArmy.units ? Object.keys(enArmy.units).length : 0,

      // --- DOM: resource panel (rivets bindings) ---
      panelGold: txt("panelGoldValue"), panelPop: txt("panelPopValue"),
      panelGoldBound: txt("panelGoldValue") !== "{ game.gold }",
      panelPopBound: txt("panelPopValue") !== "{ game.pop }",

      // --- DOM: building-tab captions ---
      capTreasury: html("treasury"), capHomes: html("homes"), capDefence: html("defence"),
      capInn: html("buttonBldInn"), capUniversity: html("buttonBuildUniversity"),
      capHireHero: html("btnHireHero"), capGallows: html("buttonBldGallows"),
      capFountain: html("buttonBldFountain"), capStash: html("buttonBldStash"),
      capStable: html("buttonBldStable"), capArchery: html("buttonBldArchery"),
      defenceImg: attr("defences_img", "src"),

      // --- DOM: navigation / tabs ---
      tabCity: txt("tabCity"), tabBuildingBtn: txt("btnOpenTabBuilding"), tabSettingsBtn: txt("tabSettings"),
      tabAboutBtn: txt("tabAbout"), tabDiscordBtn: txt("tabDiscord"), saveBtn: txt("saveGameButton"),
      loadBtn: txt("loadGameButton"), downloadLink: txt("downloadGame"),
      buildingTabDisplay: style("tabBuilding", "display"), buildingTabClass: byId("tabBuilding") ? byId("tabBuilding").className : null,
      cityTabDisplay: style("Main", "display"),
      eventCountdown: txt("lblEventCountdownValue"),
      discordPlaceholder: txt("rbDiscordPlaceholder"),

      // --- DOM: university ---
      techImgs: count("#available_researches img"), techImgIds: ids("#available_researches img"),
      researchHelp: html("lblReseachHelp"),

      // --- DOM: settings ---
      autosaveImg: attr("autosaveImg", "src"), nightMode: !!g.nightMode, bodyBg: document.body ? document.body.style.backgroundColor : null,
      oAutosave: num(g.o_autosave), isMobile: num(g.isMobile), logSize: num(g.log_size),
      logHeight: byId("log") ? byId("log").style.height : null,
      mobileChecked: byId("cbMobileUI") ? !!byId("cbMobileUI").checked : null,
      logSizeInput: byId("inpStnEventLogSize") ? byId("inpStnEventLogSize").value : null,

      // --- DOM: garrison / hire / inn ---
      troopsSergeants: txt("spnSergeants"), troopsKnights: txt("spnKnights"), troopsTurkopols: txt("spnTurkopols"),
      garrisonHireBtn: txt("buttonHireGuard"), garrisonFireBtn: txt("buttonFireGuard"),
      innHireHero: html("btnHireHero"), innWelcome: txt("lblTabInn"),

      // --- persistence ---
      lsKeys: (function () { try { return Object.keys(localStorage).sort().join("|"); } catch (e) { return ""; } })(),
      lsGameLen: (function () { try { return (localStorage.getItem("game") || "").length; } catch (e) { return -1; } })(),
      lsGameGold: (function () { try { var raw = localStorage.getItem("game"); if (!raw) return null; var o = JSON.parse(raw); return num(o.gold); } catch (e) { return -1; } })(),
      lsLoadBtnDisplay: style("loadGameButton", "display"),

      // --- event log ---
      logText: (function () { var e = byId("log"); return e ? String(e.innerText || "").replace(/\s+/g, " ").trim().slice(-240) : null; })(),
      logLines: count("#log div"),
      chatDisplay: style("chat", "display"),
      cfgDcounterDef: num(c.dcounter_def), cfgFestCooldown: num(c.festCooldown)
    };
  };

  window.__BM_CMD__ = {
    // Freeze every timer the seed started (1s turn timer, 1s festival cooldown,
    // 100s random-event timer, autosave). Ids are swept, not guessed.
    freezeClocks: function () { for (var i = 1; i < 20000; i++) { clearInterval(i); clearTimeout(i); } return true; },
    forceTurns: function (n) { var k = 0; for (var i = 0; i < Number(n); i++) { window.game.calculateTurn(); k++; } return k; },
    ackModal: function () { try { if (typeof window.getAck === "function") window.getAck(); } catch (e) {} window.dialogShown = false; return true; },
    turnWithAck: function (n) { for (var i = 0; i < Number(n); i++) { window.game.calculateTurn(); window.__BM_CMD__.ackModal(); } return Number(n); },
    resetTutorials: function () { window.game.tips = []; window.game.isTutorialState = true; window.game.ticks = 0; window.dialogShown = false; return true; },
    setGold: function (v) { window.game.gold = Number(v); if (typeof window.updateResources === "function") window.updateResources(); return window.game.gold; },
    setPop: function (v) { window.game.pop = Number(v); return window.game.pop; },
    setLevel: function (field, v) { window.game[field] = Number(v); return window.game[field]; },
    build: function (structure) { var r = window.game.Build(String(structure)); return r === true; },
    refreshCaptions: function () { window.updateButtonCaptions(); return true; },
    refreshBuildingImages: function () { window.updateImagesBuildingTab(); return true; },
    refreshUI: function () { try { window.updateUI(); } catch (e) { return "ERR " + String(e).slice(0, 80); } return true; },
    openTab: function (name) { window.openTab(null, String(name)); return window.game.active_tab || name; },
    hire: function (unit, n) { window.numberToHire = Number(n); window.selectedUnitToHire = String(unit); window.game.hireUnits(); return true; },
    hireGuard: function () { window.answer = 2; window.game.hireTreasuryGuardCallback(); return window.game.treasuryGuard; },
    festival: function () { window.answer = 2; var g0 = window.game.gold; window.game.makeFestivalCallback(); return window.game.gold - g0; },
    colorMode: function () { window.changeColorMode(); return !!window.game.nightMode; },
    autosaveToggle: function () { window.changeAutosave(); return window.game.o_autosave; },
    autosaveRefresh: function () { window.setupAutosave(); return attr("autosaveImg", "src"); },
    mobileUI: function (on) { var e = byId("cbMobileUI"); if (e) { e.checked = !!on; } window.game.mobileUI(); return window.game.isMobile; },
    eventLogSize: function (v) { var e = byId("inpStnEventLogSize"); if (e) { e.value = String(v); } window.game.setupEventLogSize(); return window.game.log_size; },
    save: function () { window.saveGame(); return (localStorage.getItem("game") || "").length; },
    setLang: function (l) { try { localStorage.setItem("areso-lang", String(l)); } catch (e) {} window.loadStartLocale(); return String(l); },
    // university: the real user path (click the tech icon, then the Reserch button)
    researchViaUI: function () {
      var img = document.querySelector("#available_researches img");
      if (!img) return "no-tech-icon";
      img.click();
      var btn = document.querySelector("#lblReseachHelp button");
      if (!btn) return "no-research-button";
      btn.click();
      return "researched:" + img.id;
    },
    techIconCount: function () { return count("#available_researches img"); },
    redrawUniversity: function () { window.drawTabUniversity(); return count("#available_researches img"); },
    // combat: fixed armies so the round is reproducible under a seeded RNG
    makeArmies: function () {
      window.game.myheroArmy = { armyID: 1, units: {} };
      window.game.enemyHeroArmy = { armyID: 2, units: {} };
      window.game.genUnitStack(window.sergeantsData, 4, window.game.myheroArmy.units);
      window.game.genUnitStack(window.banditWarrior, 3, window.game.enemyHeroArmy.units);
      window.game.myhero = window.game.myhero || {};
      window.game.myhero.atk = 5; window.game.myhero.def = 5;
      window.game.enemyHero = { atk: 4, def: 4 };
      window.game.attacker = window.ATTACK_TURN ? window.ATTACK_TURN.HERO : 1;
      window.game.isAutoBattle = true;
      return window.game.attacker;
    },
    battlePhase: function (campaignType) { window.calcAttackPhase(String(campaignType || "Probe")); return window.game.attacker; },
    knightStack: function (n) { var u = {}; window.game.genUnitStack(window.knightsData, Number(n), u); return u.knights ? u.knights.stackHealth : null; },
    sergeantStack: function (n) { var u = {}; window.game.genUnitStack(window.sergeantsData, Number(n), u); return u.sergeants ? u.sergeants.stackHealth : null; },
    moveKnightsToHero: function (n) {
      window.game.knights = Number(n);
      window.game.myhero = window.game.myhero || {};
      window.game.myhero.knights = 0;
      window.game.myheroArmy = { armyID: 1, units: {} };
      window.numberToMove = Number(n); window.moveFromGarrison = true;
      window.game.moveKnights();
      var s = window.game.myheroArmy.units.knights;
      return s ? s.stackHealth : null;
    },
    logClear: function () { var e = byId("log"); if (e) { e.innerHTML = ""; } return true; }
  };

  window.__BM_RNG__ = { seed: seedRng, restore: restoreRng, seeded: function () { return rngBackup !== null; } };
})();

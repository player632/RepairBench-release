/* ==========================================================================
   rb-probe.js — RepairBench read-only instrumentation bridge.

   The Binding (isaac-webgame) draws everything into one <canvas>, so there is
   no DOM face for the simulation itself. The seed already publishes a debug
   surface (window.__game, created at the end of js/main.js); this bridge turns
   it into a *scalar-only* reading API that a DSL checkpoint can compare with
   ==, and adds the few DOM handles the overlay screens need.

   Rules this file obeys:
     * every getter returns a number, a string or 0/1 — never an object,
       because the DSL's assertEq compares loosely and an object expectation
       can never match;
     * nothing here is called from an assert except the pure readers. Anything
       that mutates the game is a driver with an obvious verb name, and the DSL
       only ever calls drivers from a checkpoint's setup phase;
     * no clock, frame counter, rAF tick or physics time is ever exposed as a
       reading. Time-dependent facts are reduced to discrete state (state name,
       heart count, door count, tear count, boolean flags);
     * it reads the seed's own objects. It never patches game logic, so a fix
       that restores the seed behaviour is observed, not manufactured.
   ========================================================================== */
(function () {
  'use strict';

  /* One deterministic run seed for every live checkpoint, and one fixed
     (level, seed) pair for the pure floor-plan reads so the generated dungeon
     is byte-for-byte reproducible between the clean and the repaired tree. */
  var SEED = 20260906;
  var PLAN_LEVEL = 3;
  var PLAN_SEED = 1;
  var POOL_SEED = 424242;

  function G() { return window.__game; }
  function R() { return window.__game.raw; }
  function P() { return window.__game.raw.player; }
  function el(id) { return document.getElementById(id); }
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : -1; }
  function str(v) { return v === null || v === undefined ? 'none' : String(v); }

  /* ------------------------------------------------------------- DOM reads */
  function hasClass(id, cls) { var e = el(id); return e ? (e.classList.contains(cls) ? 1 : 0) : -1; }
  function textOf(id) { var e = el(id); return e ? str(e.textContent).replace(/\s+/g, ' ').trim() : 'none'; }
  function displayOf(id) {
    var e = el(id);
    if (!e) return 'missing';
    try { return str(window.getComputedStyle(e).display); } catch (err) { return 'error'; }
  }
  function attrOf(id, attr) { var e = el(id); return e ? str(e.getAttribute(attr)) : 'none'; }
  function countSel(sel) { try { return document.querySelectorAll(sel).length; } catch (e) { return -1; } }

  /* ------------------------------------------------- data-testid face reads
     instrumentation.patch annotates the markup with data-testid hooks. These
     readers go through them (rather than through the seed's own ids) so the
     annotated face is load-bearing: if the hooks are stripped or renamed the
     guard checkpoints that use them go red. */
  function byTid(t) {
    try {
      var l = document.querySelectorAll('[data-testid="' + t + '"]');
      return l && l.length ? l[0] : null;
    } catch (e) { return null; }
  }
  function tidCount(t) { try { return document.querySelectorAll('[data-testid="' + t + '"]').length; } catch (e) { return -1; } }

  /* ------------------------------------------------------- pure plan reads */
  function plan() { return generateFloor(PLAN_LEVEL, PLAN_SEED, []); }
  function planEdges(pl) {
    var e = 0;
    for (var i = 0; i < pl.rooms.length; i++) for (var j = 0; j < DIRS.length; j++) if (pl.rooms[i].doors[DIRS[j]]) e++;
    return e / 2;
  }
  function planUnreachable(pl) {
    var n = 0;
    for (var i = 0; i < pl.rooms.length; i++) if (!(pl.rooms[i].dist >= 0)) n++;
    return n;
  }
  function planAsymDoors(pl) {
    var bad = 0;
    for (var i = 0; i < pl.rooms.length; i++) {
      var r = pl.rooms[i];
      for (var j = 0; j < DIRS.length; j++) {
        var d = DIRS[j], door = r.doors[d];
        if (!door) continue;
        var back = door.to && door.to.doors ? door.to.doors[DIR_OPP[d]] : null;
        if (!back || back.to !== r) bad++;
      }
    }
    return bad;
  }
  function planTypeCount(pl, t) {
    var n = 0;
    for (var i = 0; i < pl.rooms.length; i++) if (pl.rooms[i].type === t) n++;
    return n;
  }
  function planRoomOfType(pl, t) {
    for (var i = 0; i < pl.rooms.length; i++) if (pl.rooms[i].type === t) return pl.rooms[i];
    return null;
  }
  function planPropsOfKind(room, kind) {
    if (!room) return -1;
    var n = 0;
    for (var i = 0; i < room.props.length; i++) if (room.props[i].kind === kind) n++;
    return n;
  }
  function planCentreProps(pl) {
    var n = 0, cx = VIEW_W / 2, cy = VIEW_H / 2;
    for (var i = 0; i < pl.rooms.length; i++) {
      var pr = pl.rooms[i].props;
      for (var j = 0; j < pr.length; j++) if (Math.abs(pr[j].x - cx) < 2 && Math.abs(pr[j].y - cy) < 2) n++;
    }
    return n;
  }
  function planDoorCount(room) {
    if (!room) return -1;
    var n = 0;
    for (var j = 0; j < DIRS.length; j++) if (room.doors[DIRS[j]]) n++;
    return n;
  }

  /* --------------------------------------------------------- item pool read */
  function poolDrawId(n) {
    var pool = new ItemPool(POOL_SEED), last = 'none';
    for (var i = 0; i < n; i++) {
      var it = null;
      try { it = pool.next(); } catch (e) { return 'threw'; }
      if (!it) return 'none';
      last = str(it.id);
    }
    return last;
  }
  function poolDistinct(n) {
    var pool = new ItemPool(POOL_SEED), seen = {}, c = 0;
    for (var i = 0; i < n; i++) {
      var it = null;
      try { it = pool.next(); } catch (e) { return -1; }
      if (!it) break;
      if (!seen[it.id]) { seen[it.id] = 1; c++; }
    }
    return c;
  }

  var api = {
    /* ------------------------------------------------------------ lifecycle */
    ready: function () { return (window.__game && window.__game.raw && typeof generateFloor === 'function') ? 1 : 0; },
    version: function () { return 'rb-probe/isaac-webgame-1'; },
    runSeed: function () { return SEED; },
    planSeed: function () { return PLAN_SEED; },
    planLevel: function () { return PLAN_LEVEL; },

    /** Conditional first-screen handling: if the title screen is actually up,
        press its button (and record that we did); otherwise skip and record 0.
        Either way the run is then restarted from the fixed seed so every
        checkpoint sees the identical dungeon. */
    boot: function () {
      var clicked = 0, t = el('screen-title'), b = el('btn-start');
      try { G().setSfx(false); } catch (e) {}
      if (t && b && !t.classList.contains('hidden')) {
        try { b.click(); clicked = 1; } catch (e) { clicked = -1; }
      }
      try { G().start(SEED); } catch (e) { return -1; }
      this.safe();
      return clicked;
    },

    /** Freeze the run into a hazard-free, reproducible posture: empty start
        room, no projectiles, no enemies, player at the exact centre, no
        i-frames pending, simulation paused so nothing drifts between a setup
        step and the assert that reads it. */
    safe: function () {
      var r = R();
      try { G().setSfx(false); } catch (e) {}
      try { G().clearEnemies(); } catch (e) {}
      r.tears.length = 0; r.enemyTears.length = 0; r.lasers.length = 0;
      r.toasts.length = 0; r.banner = null; r.trans = null;
      r.player.x = VIEW_W / 2; r.player.y = VIEW_H / 2;
      r.player.vx = 0; r.player.vy = 0;
      r.player.invuln = 0; r.player.hitStun = 0; r.player.dead = false;
      r.player.headDir = 'down';
      r.paused = true;
      r.state = STATE.PLAY;
      return 1;
    },
    halt: function () { R().paused = true; return 1; },
    go: function () { R().paused = false; return 1; },

    /* ------------------------------------------------------------ scalars: run */
    state: function () { return str(R().state); },
    floor: function () { return num(R().floorIndex); },
    hp: function () { return num(P().hp); },
    maxHp: function () { return num(P().stats.maxHp); },
    hearts: function () { return num(P().hearts); },
    coins: function () { return num(P().coins); },
    kills: function () { return num(R().stats ? R().stats.kills : -1); },
    damageTaken: function () { return num(R().stats ? R().stats.damageTaken : -1); },
    itemsPicked: function () { return num(R().stats ? R().stats.itemsPicked : -1); },
    roomsVisited: function () { return num(R().stats ? R().stats.rooms : -1); },
    dmgLogLen: function () { return num(R().dmgLog ? R().dmgLog.length : -1); },
    px: function () { return Math.round(num(P().x)); },
    py: function () { return Math.round(num(P().y)); },
    playerDead: function () { return P().dead ? 1 : 0; },
    shieldUp: function () { return P().shieldUp ? 1 : 0; },
    revives: function () { return num(P().flags.revives); },
    revivedCount: function () { return num(P().revivedCount); },
    invulnPositive: function () { return P().invuln > 0 ? 1 : 0; },
    itemCount: function () { return num(P().items.length); },
    hasItem: function (id) { for (var i = 0; i < P().items.length; i++) if (P().items[i].id === id) return 1; return 0; },
    stat: function (k) { return num(P().stats[k]); },
    statRounded: function (k) { return Math.round(num(P().stats[k]) * 100) / 100; },
    flag: function (k) { return P().flags[k] ? 1 : 0; },
    flagNum: function (k) { return num(P().flags[k]); },
    headDir: function () { return str(P().headDir); },
    shootDir: function () { return str(G().input ? G().input.shootDir : null); },
    moveX: function () { return num(G().input ? G().input.mx : -1); },
    tearCount: function () { return num(R().tears.length); },
    enemyTearCount: function () { return num(R().enemyTears.length); },
    laserCount: function () { return num(R().lasers.length); },
    enemyCount: function () { return num(R().enemies.length); },
    enemyAlive: function () { return num(R().enemies.filter(function (e) { return !e.dead; }).length); },
    toastCount: function () { return num(R().toasts.length); },
    bannerUp: function () { return R().banner ? 1 : 0; },
    transActive: function () { return R().trans ? 1 : 0; },
    pausedFlag: function () { return R().paused ? 1 : 0; },
    bossPresent: function () { return (R().boss && !R().boss.dead) ? 1 : 0; },
    bossType: function () { return str(R().boss ? R().boss.type : null); },
    trapdoorPresent: function () { return R().trapdoor ? 1 : 0; },

    /* ------------------------------------------------------- scalars: room */
    roomType: function () { return str(R().room ? R().room.type : null); },
    roomCleared: function () { return R().room ? (R().room.cleared ? 1 : 0) : -1; },
    roomId: function () { return num(R().room ? R().room.id : -1); },
    doorCount: function () { return planDoorCount(R().room); },
    openDoorCount: function () {
      var r = R().room; if (!r) return -1;
      var n = 0;
      for (var j = 0; j < DIRS.length; j++) { var d = r.doors[DIRS[j]]; if (d && d.open) n++; }
      return n;
    },
    doorOpen: function (d) { var r = R().room; return (r && r.doors[d] && r.doors[d].open) ? 1 : 0; },
    hasDoors: function () { return planDoorCount(R().room) > 0 ? 1 : 0; },
    doorsAllOpen: function () { var n = planDoorCount(R().room); return (n > 0 && this.openDoorCount() === n) ? 1 : 0; },
    doorsAllShut: function () { return (planDoorCount(R().room) > 0 && this.openDoorCount() === 0) ? 1 : 0; },
    doorExists: function (d) { var r = R().room; return (r && r.doors[d]) ? 1 : 0; },
    pickupCount: function () { return num(R().room ? R().room.pickups.length : -1); },
    propCountOfKind: function (kind) { return planPropsOfKind(R().room, kind); },
    enemySpecCount: function () { return num(R().room ? R().room.enemySpec.length : -1); },

    /* --------------------------------------------------------- scalars: DOM */
    titleHidden: function () { return hasClass('screen-title', 'hidden'); },
    deadHidden: function () { return hasClass('screen-dead', 'hidden'); },
    winHidden: function () { return hasClass('screen-win', 'hidden'); },
    pauseHidden: function () { return hasClass('screen-pause', 'hidden'); },
    touchUiHidden: function () { return hasClass('touch-ui', 'hidden'); },
    deadDisplay: function () { return displayOf('screen-dead'); },
    winDisplay: function () { return displayOf('screen-win'); },
    pauseDisplay: function () { return displayOf('screen-pause'); },
    titleDisplay: function () { return displayOf('screen-title'); },
    deadSubText: function () { return textOf('dead-sub'); },
    deadStatsCells: function () { return countSel('#dead-stats .stat-cell'); },
    winStatsCells: function () { return countSel('#win-stats .stat-cell'); },
    deadItemChips: function () { return countSel('#dead-items span'); },
    shootBtnCount: function () { return countSel('.sbtn'); },
    shootBtnOnCount: function () { return countSel('.sbtn.on'); },
    shootBtnDir: function (id) { return attrOf(id, 'data-dir'); },
    titleLinkTargets: function () {
      var n = 0, ls = document.querySelectorAll('#screen-title a');
      for (var i = 0; i < ls.length; i++) if (ls[i].getAttribute('target') === '_blank') n++;
      return n;
    },
    titleLinkCount: function () { return countSel('#screen-title a'); },
    startBtnText: function () { return textOf('btn-start'); },
    retryBtnText: function () { return textOf('btn-retry'); },
    canvasW: function () { var c = el('game'); return c ? num(c.width) : -1; },
    canvasH: function () { var c = el('game'); return c ? num(c.height) : -1; },
    touchModeFlag: function () { return window.__touchMode ? 1 : 0; },

    /* -------------------------------------------------- pure plan scalars */
    planRooms: function () { return plan().rooms.length; },
    planEdges: function () { return planEdges(plan()); },
    planIsTree: function () { var pl = plan(); return planEdges(pl) === pl.rooms.length - 1 ? 1 : 0; },
    planLoopRooms: function () { var pl = plan(); return planEdges(pl) - (pl.rooms.length - 1); },
    planUnreachable: function () { return planUnreachable(plan()); },
    planAsymDoors: function () { return planAsymDoors(plan()); },
    planStartGx: function () { return num(plan().start.gx); },
    planStartGy: function () { return num(plan().start.gy); },
    planStartCleared: function () { return plan().start.cleared ? 1 : 0; },
    planBossDist: function () { return num(plan().boss ? plan().boss.dist : -1); },
    planBossNeigh: function () { return num(plan().boss ? plan().boss.neigh.length : -1); },
    planBossType: function () { return str(plan().bossType); },
    planChapter: function () { return str(plan().chapter ? plan().chapter.label : null); },
    planTypeCount: function (t) { return planTypeCount(plan(), t); },
    planHasShop: function () { return plan().shop ? 1 : 0; },
    planShopCleared: function () { var s = plan().shop; return s ? (s.cleared ? 1 : 0) : -1; },
    planShopStalls: function () { return planPropsOfKind(plan().shop, 'shopItem'); },
    planShopDoors: function () { return planDoorCount(plan().shop); },
    planTreasureCleared: function () { var t = plan().treasure; return t ? (t.cleared ? 1 : 0) : -1; },
    planTreasurePedestal: function () { return planPropsOfKind(plan().treasure, 'pedestal'); },
    planNormalUncleared: function () {
      var pl = plan(), n = 0;
      for (var i = 0; i < pl.rooms.length; i++) if (pl.rooms[i].type === 'normal' && !pl.rooms[i].cleared) n++;
      return n;
    },
    planCentreProps: function () { return planCentreProps(plan()); },
    planBossRoomSpec: function () {
      var b = plan().boss;
      return b ? num(b.enemySpec.length) : -1;
    },
    planBossSpecIsBoss: function () {
      var b = plan().boss;
      return (b && b.enemySpec.length === 1 && b.enemySpec[0].boss) ? 1 : 0;
    },
    /** pickBoss freshness: with `used` naming one of the chapter's two bosses,
        a healthy pool must hand back the other one. */
    planBossFresh: function (usedCsv) {
      var used = String(usedCsv || '').split(',').filter(function (x) { return x.length; });
      var pl = generateFloor(PLAN_LEVEL, PLAN_SEED, []);
      var fresh = generateFloor(PLAN_LEVEL, PLAN_SEED, used);
      return (used.indexOf(fresh.bossType) < 0 && pl.chapter.bosses.indexOf(fresh.bossType) >= 0) ? 1 : 0;
    },

    /* ------------------------------------------------------- item pool reads */
    poolFirst: function () { return poolDrawId(1); },
    poolDraw: function (n) { return poolDrawId(n); },
    poolDistinct: function (n) { return poolDistinct(n); },
    itemsCatalogue: function () { return num(ITEMS.length); },

    /* -------------------------------------------------------------- drivers */
    resetInvuln: function () { P().invuln = 0; return 1; },
    setHp: function (n) { P().hp = n; return num(P().hp); },
    setRevives: function (n) { P().flags.revives = n; P().revivedCount = 0; return num(P().flags.revives); },
    setShield: function (v) { P().flags.shield = !!v; P().shieldUp = !!v; return P().shieldUp ? 1 : 0; },
    setCoins: function (n) { try { G().setCoins(n); } catch (e) { P().coins = n; } return num(P().coins); },
    hurtOnce: function (n) {
      var r = R();
      return P().takeDamage(n, r, P().x + 40, P().y, 'probe') ? 1 : 0;
    },
    give: function (id) { try { return str(G().giveItem(id)); } catch (e) { return 'threw'; } },
    clearTears: function () { R().tears.length = 0; R().enemyTears.length = 0; R().lasers.length = 0; return 1; },
    fire: function (dir) {
      var r = R();
      r.tears.length = 0;
      try { P().fireTears(dir, r); } catch (e) { return -1; }
      return num(r.tears.length);
    },
    fireLaser: function (dir) {
      var r = R();
      r.lasers.length = 0;
      try { P().fireBrimstone(dir, r); } catch (e) { return -1; }
      return num(r.lasers.length);
    },
    tearSignX: function (i) { var t = R().tears[i || 0]; return t ? Math.sign(t.vx) : -9; },
    tearSignY: function (i) { var t = R().tears[i || 0]; return t ? Math.sign(t.vy) : -9; },
    enterRoomOfType: function (type) {
      var r = R(), room = null;
      for (var i = 0; i < r.plan.rooms.length; i++) if (r.plan.rooms[i].type === type) room = r.plan.rooms[i];
      if (!room) return -1;
      for (var j = 0; j < r.plan.rooms.length; j++) r.plan.rooms[j].visited = true;
      room.cleared = true;
      r.player.x = VIEW_W / 2; r.player.y = VIEW_H / 2;
      try { r.enterRoom(room, null); } catch (e) { return -2; }
      r.refreshDoors();
      r.paused = true;
      return num(r.room.id);
    },
    /** Install a specific, reproducible floor plan into the live run so a
        checkpoint can stand in a room type floor 1 never generates (a shop
        only exists from floor 2 down). Uses the seed's own generator only. */
    loadPlan: function (level, seed) {
      var r = R();
      try {
        r.plan = generateFloor(level, seed, []);
        r.floorIndex = level;
        r.theme = r.plan.theme;
        r.bossesSeen = [];
        r.trapdoor = null;
        r.bossDead = false;
        r.room = r.plan.start;
        r.player.x = VIEW_W / 2; r.player.y = VIEW_H / 2;
        r.enterRoom(r.plan.start, null);
        r.refreshDoors();
        r.paused = true;
        r.state = STATE.PLAY;
      } catch (e) { return -1; }
      return num(r.plan.rooms.length);
    },
    /** Walk into a room of this type WITHOUT touching its generated
        cleared flag - that flag is exactly what some checkpoints read. */
    enterRoomAsGenerated: function (type) {
      var r = R(), room = null;
      for (var i = 0; i < r.plan.rooms.length; i++) if (r.plan.rooms[i].type === type) room = r.plan.rooms[i];
      if (!room) return -1;
      for (var j = 0; j < r.plan.rooms.length; j++) r.plan.rooms[j].visited = true;
      r.player.x = VIEW_W / 2; r.player.y = VIEW_H / 2;
      try { r.enterRoom(room, null); } catch (e) { return -2; }
      r.refreshDoors();
      r.paused = true;
      return num(r.room.id);
    },
    enterUnclearedNormal: function () {
      var r = R(), room = null;
      for (var i = 0; i < r.plan.rooms.length; i++) {
        var c = r.plan.rooms[i];
        if (c.type === 'normal' && !c.cleared && c.enemySpec.length) { room = c; break; }
      }
      if (!room) return -1;
      for (var j = 0; j < r.plan.rooms.length; j++) r.plan.rooms[j].visited = true;
      room.cleared = false;
      r.player.x = VIEW_W / 2; r.player.y = VIEW_H / 2;
      try { r.enterRoom(room, null); } catch (e) { return -2; }
      r.refreshDoors();
      r.paused = true;
      return num(r.room.id);
    },
    /** Stand in a room that has a door in `dir`, then walk through it. */
    walkThrough: function (dir) {
      var r = R(), room = null;
      for (var i = 0; i < r.plan.rooms.length; i++) if (r.plan.rooms[i].doors[dir]) { room = r.plan.rooms[i]; break; }
      if (!room) return -1;
      for (var j = 0; j < r.plan.rooms.length; j++) r.plan.rooms[j].visited = true;
      room.cleared = true;
      r.player.x = VIEW_W / 2; r.player.y = VIEW_H / 2;
      try { r.enterRoom(room, null); } catch (e) { return -2; }
      r.refreshDoors();
      var fromId = r.room.id;
      var ok = false;
      try { ok = r.goThrough(dir); } catch (e) { return -3; }
      r.paused = true;
      return (ok && r.room.id !== fromId) ? 1 : 0;
    },
    pressArrow: function (dir) { try { G().press(dir); } catch (e) { return -1; } return 1; },
    releaseArrow: function (dir) { try { G().release(dir); } catch (e) { return -1; } return 1; },
    releaseAll: function () {
      var ds = ['up', 'down', 'left', 'right'];
      for (var i = 0; i < ds.length; i++) { try { G().release(ds[i]); } catch (e) {} }
      return 1;
    },
    pressShootButton: function (id) {
      var b = el(id);
      if (!b) return -1;
      try { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7 })); } catch (e) { return -2; }
      return 1;
    },
    releaseShootButton: function (id) {
      var b = el(id);
      if (!b) return -1;
      try { b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 })); } catch (e) { return -2; }
      return 1;
    },
    key: function (code) {
      try { window.dispatchEvent(new KeyboardEvent('keydown', { code: code, bubbles: true })); } catch (e) { return -1; }
      return 1;
    },
    keyUp: function (code) {
      try { window.dispatchEvent(new KeyboardEvent('keyup', { code: code, bubbles: true })); } catch (e) { return -1; }
      return 1;
    },
    dropPickupAtPlayer: function (kind) {
      var r = R();
      r.room.pickups.push({ kind: kind, x: r.player.x, y: r.player.y, r: 13, sub: kind === 'heart' ? 'full' : null });
      return num(r.room.pickups.length);
    },
    collectPickups: function () { try { R().updatePickups(); } catch (e) { return -1; } return num(R().room.pickups.length); },
    spawnAt: function (type, dx, dy) {
      var r = R();
      try { r.spawnEnemy(type, r.player.x + (dx || 0), r.player.y + (dy || 0)); } catch (e) { return -1; }
      return num(r.enemies.length);
    },
    enemyHp: function (i) { var e = R().enemies[i || 0]; return e ? num(Math.round(e.hp)) : -1; },
    enemyType: function (i) { var e = R().enemies[i || 0]; return e ? str(e.type) : 'none'; },
    enemySpawnT: function (i) { var e = R().enemies[i || 0]; return e ? (e.spawnT > 0 ? 1 : 0) : -1; },
    hurtEnemyFront: function (dmg) {
      var e = R().enemies[0];
      if (!e) return -1;
      e.faceX = 1; e.faceY = 0;
      try { R().damageEnemy(e, dmg, e.x + 60, e.y, 0); } catch (err) { return -2; }
      return num(Math.round(e.hp));
    },
    hurtEnemyBack: function (dmg) {
      var e = R().enemies[0];
      if (!e) return -1;
      e.faceX = 1; e.faceY = 0;
      try { R().damageEnemy(e, dmg, e.x - 60, e.y, 0); } catch (err) { return -2; }
      return num(Math.round(e.hp));
    },
    hitPointAtOffset: function (dx, dy) {
      var e = R().enemies[0];
      if (!e) return -1;
      var hp = null;
      try { hp = enemyHitPoint(e, e.x + dx, e.y + dy, 6); } catch (err) { return -2; }
      return hp ? 1 : 0;
    },
    killAllEnemies: function () { try { G().killAll(); } catch (e) { return -1; } return num(R().stats.kills); },
    checkRoomClearNow: function () { try { R().checkRoomClear(); } catch (e) { return -1; } return R().room.cleared ? 1 : 0; },
    forceDead: function () {
      var r = R();
      r.player.invuln = 0; r.player.shieldUp = false; r.player.flags.revives = 0;
      r.player.hp = 1;
      try { r.player.takeDamage(9, r, r.player.x + 40, r.player.y, 'probe-lethal'); } catch (e) { return -1; }
      return r.player.dead ? 1 : 0;
    },
    descendNow: function () { try { R().descend(); } catch (e) { return -1; } return str(R().state); },
    setFinalTrapdoor: function () { R().trapdoor = { kind: 'trapdoor', x: VIEW_W / 2, y: VIEW_H / 2, r: 26, solid: false, final: true }; return 1; },

    /* --------------------------------------------------- data-testid reads */
    tidPresent: function (t) { return byTid(t) ? 1 : 0; },
    tidCount: function (t) { return tidCount(t); },
    tidTag: function (t) { var e = byTid(t); return e ? str(e.tagName).toUpperCase() : 'none'; },
    tidAttr: function (t, a) { var e = byTid(t); return e ? str(e.getAttribute(a)) : 'none'; },
    tidText: function (t) { var e = byTid(t); return e ? str(e.textContent).replace(/\s+/g, ' ').trim() : 'none'; },
    tidHidden: function (t) { var e = byTid(t); return e ? (e.classList.contains('hidden') ? 1 : 0) : -1; },
    tidDisplay: function (t) {
      var e = byTid(t);
      if (!e) return 'missing';
      try { return str(window.getComputedStyle(e).display); } catch (err) { return 'error'; }
    },
    tidWidth: function (t) { var e = byTid(t); return e ? num(e.width) : -1; },
    tidHeight: function (t) { var e = byTid(t); return e ? num(e.height) : -1; },

    /* ------------------------------------------------------------- hygiene */
    lsCount: function () { try { return window.localStorage.length; } catch (e) { return -1; } },
    ssCount: function () { try { return window.sessionStorage.length; } catch (e) { return -1; } },
    cookieLen: function () { try { return String(document.cookie).length; } catch (e) { return -1; } },
    urlSearch: function () { try { return String(window.location.search); } catch (e) { return 'x'; } },
    urlHash: function () { try { return String(window.location.hash); } catch (e) { return 'x'; } },
    urlPath: function () { try { return String(window.location.pathname); } catch (e) { return 'x'; } },
    /** How many extra window.__rb* globals exist beyond the bridge itself. */
    extraGlobals: function () {
      var n = 0;
      for (var k in window) if (Object.prototype.hasOwnProperty.call(window, k) && /^__rb/.test(k) && k !== '__rb') n++;
      return n;
    },
  };

  window.__rb = api;
})();

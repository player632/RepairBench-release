/* ============================================================
   Harness bridge — INSTRUMENTATION ONLY, not part of the game.

   Two surfaces, deliberately split the same way the grading driver is:

     window.__RGQ__()   PURE READ. Returns one flat object of scalars
                        (numbers / booleans / strings) describing the live
                        app plus every frozen snapshot taken so far. It never
                        clicks, types, dispatches, mutates or renders, because
                        assertions are re-polled for several seconds and any
                        side effect inside them would be applied repeatedly.

     window.__RGX__     SETUP ONLY. Reaches a reproducible fixture: waits for
                        boot, starts a survey, pins the mutable drive envelope,
                        places the rover, and advances the app's own simulation
                        entry points by hand. Nothing here restates a game
                        rule; every command calls into the shipped code.

   The bridge is an ES module so it shares ONE instance of each game module
   with src/main.js (ES modules are cached by resolved URL). That is what lets
   it read the live mutable envelope objects instead of guessing at them.

   Frame loop control: halt() replaces requestAnimationFrame with a queue so
   the shipped rAF loop parks, and resume() restores it and replays the queued
   callback. Without this the background loop advances the simulation between
   two setup steps and no fixture is reproducible.
   ============================================================ */
import { DRIVE } from './src/game/rover.js';
import { OPS } from './src/game/gameplay.js';
import { HOME } from './src/world/props.js';
import { PLAYABLE_R } from './src/world/terrain.js';
import { CAM } from './src/game/camera.js';
import { CODEX, MISSIONS, SAMPLES } from './src/game/lore.js';

const CAMMODES = { CHASE: CAM.CHASE, ORBIT: CAM.ORBIT, MAST: CAM.MAST, MASTCAM: CAM.MAST, PHOTO: CAM.PHOTO };

const $ = (id) => document.getElementById(id);
const r6 = (v) => (typeof v === 'number' && isFinite(v)) ? Math.round(v * 1e6) / 1e6 : null;
const txt = (el) => (el ? String(el.textContent == null ? '' : el.textContent).trim() : null);
const cls = (el) => (el ? String(el.className == null ? '' : el.className) : '');
const hasCls = (el, c) => !!(el && el.classList && el.classList.contains(c));
const kids = (el) => (el ? Array.prototype.slice.call(el.children) : []);
const all = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));

function fillOf(gauge) {
  if (!gauge) return null;
  const i = gauge.querySelector('.bar i');
  if (!i) return null;
  const m = /scaleX\((-?[0-9.eE+]+)\)/.exec(String(i.style.transform || ''));
  return m ? r6(parseFloat(m[1])) : null;
}

/* Headless runs have no pointer lock; asking for it produces an unhandled
   rejection and steals focus from the page under test. Parking it changes no
   game rule — the mouse-look accumulator is simply never fed, and this bridge
   drives the rover through the control struct instead. */
try {
  HTMLCanvasElement.prototype.requestPointerLock = function () {};
  if (document.exitPointerLock) document.exitPointerLock = function () {};
} catch (e) { /* older engines: nothing to park */ }

/* ---------------- marks: named world points the snapshot re-reads ---------- */
const marks = Object.create(null);
const frozen = Object.create(null);
let baseGlobals = null;
let rafOriginal = null;
let rafQueued = [];
let halted = false;
let lastImpact = null;

const SAFE_SETTINGS_KEYS = ['regolith.anaxagoras.v1', 'regolith.anaxagoras.v1.set'];

function app() { return window.REGOLITH || null; }
function live() {
  const A = app();
  return !!(A && A.game && A.rover && A.terrain && A.props && A.sky && A.rig
    && A.hud && A.input && A.audio && typeof A.tick === 'function');
}

/* ============================================================
   PURE-READ SNAPSHOT
   ============================================================ */
function snapshot() {
  const A = app();
  const g = A && A.game, r = A && A.rover, t = A && A.terrain, p = A && A.props;
  const sky = A && A.sky, rig = A && A.rig, hud = A && A.hud, eng = A && A.engine;
  const s = {};

  /* ---- readiness / screen state ---- */
  s.ready = live();
  s.appState = A ? r6(A.state) : null;
  s.bootHidden = hasCls($('boot'), 'hidden');
  s.menuHidden = hasCls($('menu'), 'hidden');
  s.hudHidden = hasCls($('hud'), 'hidden');
  s.pauseHidden = hasCls($('pause'), 'hidden');
  s.codexHidden = hasCls($('codex'), 'hidden');
  s.helpHidden = hasCls($('help'), 'hidden');
  s.cardHidden = hasCls($('cardOverlay'), 'hidden');
  s.loadText = txt($('loadtext'));
  s.loadFill = $('loadfill') ? String($('loadfill').style.width || '') : null;
  s.cardKicker = txt($('cardKicker'));
  s.cardTitle = txt($('cardTitle'));
  s.cardObjText = txt($('cardObj'));
  s.menuBriefText = txt($('menuBrief'));
  s.continueHidden = $('btnContinue') ? !!$('btnContinue').hidden : null;
  s.dossierText = (function () {
    const rows = all('.dossier-row');
    return rows.map((d) => txt(d).replace(/\s+/g, ' ')).join(' | ');
  })();

  /* ---- gauges ---- */
  const gb = $('gBatt'), gt = $('gHeat'), gi = $('gHull');
  s.powerText = txt(gb && gb.querySelector('b'));
  s.heatText = txt(gt && gt.querySelector('b'));
  s.hullText = txt(gi && gi.querySelector('b'));
  s.powerFill = fillOf(gb); s.heatFill = fillOf(gt); s.hullFill = fillOf(gi);
  s.powerWarn = hasCls(gb, 'warn'); s.powerCrit = hasCls(gb, 'crit');
  s.heatWarn = hasCls(gt, 'warn'); s.heatCrit = hasCls(gt, 'crit');
  s.hullWarn = hasCls(gi, 'warn'); s.hullCrit = hasCls(gi, 'crit');
  s.gaugeCount = all('#hud .gauge').length;

  /* ---- system chips ---- */
  const chips = all('#sysChips .chip');
  const chipText = (name) => { const c = chips.filter((x) => txt(x).indexOf(name) === 0)[0]; return c ? txt(c) : null; };
  const chipOn = (name) => { const c = chips.filter((x) => txt(x).indexOf(name) === 0)[0]; return c ? hasCls(c, 'on') : null; };
  s.chipCount = chips.length;
  s.chipTexts = chips.map((c) => txt(c)).join(' | ');
  s.chipOnTexts = chips.filter((c) => hasCls(c, 'on')).map((c) => txt(c)).join(' | ');
  s.chipOnCount = chips.filter((c) => hasCls(c, 'on')).length;
  s.chipUplink = chipText('UPLINK'); s.chipUplinkOn = chipOn('UPLINK');
  s.chipArm = chipText('ARM'); s.chipArmOn = chipOn('ARM');
  s.chipArray = chipText('ARRAY'); s.chipArrayOn = chipOn('ARRAY');
  s.chipLamps = chipText('LAMPS'); s.chipLampsOn = chipOn('LAMPS');
  s.chipGpr = chipText('GPR'); s.chipGprOn = chipOn('GPR');
  s.chipDrill = chipText('DRILL'); s.chipDrillOn = chipOn('DRILL');
  s.chipTc = chipText('TC'); s.chipTcOn = chipOn('TC');
  s.chipRelay = chipText('RELAY'); s.chipRelayOn = chipOn('RELAY');

  /* ---- sample bay ---- */
  const slots = kids($('baygrid'));
  s.slotCount = slots.length;
  s.slotFullCount = slots.filter((x) => hasCls(x, 'full')).length;
  s.slotRareCount = slots.filter((x) => hasCls(x, 'rare')).length;
  s.slotFirstFull = slots.length ? hasCls(slots[0], 'full') : null;
  s.slotClasses = slots.map((x) => cls(x)).join(' | ');
  s.slotTitles = slots.map((x) => String(x.title || '')).join(' | ');
  s.bayCountText = txt($('bayCount'));

  /* ---- clocks / readouts ---- */
  s.metText = txt($('met'));
  s.sunPhaseText = txt($('sunPhase'));
  s.rangeText = txt($('rangeHome'));
  s.mapScaleText = txt($('mapScale'));
  s.gprStateText = txt($('gprState'));

  /* ---- mission panel ---- */
  s.missionTagText = txt($('missionTag'));
  s.missionNameText = txt($('missionName'));
  const objs = all('#missionObj div');
  s.objRowCount = objs.length;
  s.objDoneRowCount = objs.filter((x) => hasCls(x, 'done')).length;
  s.objTexts = objs.map((x) => txt(x).replace(/\s+/g, ' ')).join(' | ');

  /* ---- log feed / prompt / banners ---- */
  const lines = kids($('logfeed'));
  s.logCount = lines.length;
  s.logTexts = lines.map((x) => txt(x)).join(' | ');
  s.logFirst = lines.length ? txt(lines[0]) : null;
  s.logClasses = lines.map((x) => cls(x)).join(' | ');
  s.promptHidden = hasCls($('prompt'), 'hidden');
  s.promptText = txt($('prompt'));
  s.discoveryHidden = hasCls($('discovery'), 'hidden');
  s.discoveryKicker = txt(document.querySelector('#discovery .d-kicker'));
  s.discoveryName = txt(document.querySelector('#discovery .d-name'));
  s.discoverySub = txt(document.querySelector('#discovery .d-sub'));
  s.vigClass = cls($('vig'));

  /* ---- codex ---- */
  const li = kids($('codexList'));
  s.codexCount = li.length;
  s.codexLockedCount = li.filter((x) => hasCls(x, 'locked')).length;
  s.codexSealedCount = li.filter((x) => txt(x).indexOf('[ SEALED ]') > -1).length;
  s.codexEntries = li.map((x) => String(x.dataset.id || '') + '=' + txt(x).replace(/\s+/g, ' ')).join(' | ');
  s.codexReadHeading = txt(document.querySelector('#codexRead h3'));
  s.codexReadMeta = txt(document.querySelector('#codexRead .meta'));

  /* ---- settings / controls sheets ---- */
  const rows = kids($('settingsBody'));
  s.settingsRowCount = rows.length;
  s.settingsLabels = rows.map((d) => String(txt(d.querySelector('label')) || '').split('\n')[0]).join(' | ');
  s.segOnPerRow = rows.map((d) => {
    const seg = d.querySelector('.seg');
    if (!seg) return -1;
    const b = kids(seg);
    for (let i = 0; i < b.length; i++) if (hasCls(b[i], 'on')) return i;
    return -1;
  }).join(',');
  const keyrows = all('#keysBody .keyrow');
  s.helpRowCount = keyrows.length;
  s.helpText = $('keysBody') ? txt($('keysBody')).replace(/\s+/g, ' ') : null;
  s.hudScaleVar = String(document.documentElement.style.getPropertyValue('--hud-k') || '');

  /* ---- mission bookkeeping ---- */
  s.power = r6(g && g.power); s.heat = r6(g && g.heat); s.hull = r6(g && g.hull);
  s.met = r6(g && g.met); s.gt = r6(g && g.t);
  s.missionIdx = g ? r6(g.missionIdx) : null;
  s.missionCount = MISSIONS.length;
  s.missionTag = g && g.mission ? String(g.mission.tag) : null;
  s.missionName = g && g.mission ? String(g.mission.name) : null;
  s.objDoneIds = g ? Object.keys(g.objDone).filter((k) => g.objDone[k]).sort().join(',') : null;
  s.objDoneCount = g ? Object.keys(g.objDone).filter((k) => g.objDone[k]).length : null;
  s.countFind = g ? r6(g.counts.find3 || 0) : null;
  s.countRelays = g ? r6(g.counts.relays || 0) : null;
  s.relaysPlaced = g ? r6(g.relaysPlaced) : null;
  s.excavated = g ? r6(g.excavated) : null;
  s.bayLen = g ? r6(g.bay.length) : null;
  s.bayRareLen = g ? r6(g.bay.filter((b) => b.rare).length) : null;
  s.bayTypes = g ? g.bay.map((b) => String(b.type)).join(',') : null;
  s.bayFull = g ? !!g.bayFull : null;
  s.unlockedCount = g ? r6(g.unlocked.size) : null;
  s.unlockedIds = g ? Array.from(g.unlocked).sort().join(',') : null;
  s.codexTotal = CODEX.length;
  s.scanActive = g ? !!g.scan.active : null;
  s.scanCool = r6(g && g.scan.cool);
  s.scanT = r6(g && g.scan.t);
  s.scanR = r6(g && g.scan.r);
  s.drillActive = g ? !!g.drill.active : null;
  s.drillT = r6(g && g.drill.t);
  s.drillTargetDepth = g && g.drill.target ? r6(g.drill.target.depth) : null;
  s.anomsTotal = g ? r6(g.anoms.length) : null;
  s.anomsFound = g ? r6(g.anoms.filter((a) => a.found).length) : null;
  s.anomsTaken = g ? r6(g.anoms.filter((a) => a.taken).length) : null;
  s.anomsMarked = g ? r6(g.anoms.filter((a) => a.marker).length) : null;
  s.stationVisited = g ? !!g.stationVisited : null;
  s.nodeTaken = g ? !!g.nodeTaken : null;
  s.transmitted = g ? !!g.transmitted : null;
  s.freeRoam = g ? !!g.freeRoam : null;
  s.dangerTone = r6(g && g.dangerTone);
  s.flipTimer = r6(g && g.flipTimer);
  s.atHome = g ? !!g.atHome : null;
  s.distHome = r6(g ? g.distTo(HOME.x, HOME.z) : null);
  s.tcOn = g ? (g.tc !== false) : null;
  s.lastImpact = r6(lastImpact);

  /* ---- rover ---- */
  s.rx = r6(r && r.pos.x); s.ry = r6(r && r.pos.y); s.rz = r6(r && r.pos.z);
  s.vx = r6(r && r.vel.x); s.vy = r6(r && r.vel.y); s.vz = r6(r && r.vel.z);
  s.vlen = r6(r ? r.vel.length() : null);
  s.speed = r6(r && r.speed); s.odo = r6(r && r.odo);
  s.upY = r6(r ? r.up.y : null);
  s.fwdX = r6(r ? r.forward.x : null); s.fwdZ = r6(r ? r.forward.z : null);
  s.rgtX = r6(r ? r.right.x : null);
  s.armOut = r ? !!r.armOut : null;
  s.armYaw = r6(r && r.armYaw); s.armReach = r6(r && r.armReach);
  s.armDrop = r6(r && r.armDrop); s.armDeploy = r6(r && r.armDeploy);
  s.armTargetX = r6(r && r.armTarget.x); s.armTargetY = r6(r && r.armTarget.y);
  s.armTargetZ = r6(r && r.armTarget.z);
  s.panelDeploy = r6(r && r.panelDeploy); s.panelTarget = r6(r && r.panelTarget);
  s.headlights = r ? !!r.headlights : null; s.lampPower = r6(r && r.lampPower);
  s.powerScale = r6(r && r.powerScale); s.motorLoad = r6(r && r.motorLoad);
  s.sunVis = r6(r && r.sunVis);
  s.flipped = r ? !!r.flipped : null; s.airborne = r ? !!r.airborne : null;
  s.airTime = r6(r && r.airTime); s.hardHit = r6(r && r.hardHit);
  s.spinRef = r6(r && r.spinRef); s.drilling = r ? !!r.drilling : null;
  s.wheelCount = r ? r6(r.wheels.length) : null;
  s.wheelContacts = r ? r6(r.wheels.filter((w) => w.contact).length) : null;
  s.wheelSlipMax = r ? r6(Math.max.apply(null, r.wheels.map((w) => w.slipLong))) : null;
  s.wheelSinkMax = r ? r6(Math.max.apply(null, r.wheels.map((w) => w.sink))) : null;
  s.wheelLoadSum = r ? r6(r.wheels.reduce((a, w) => a + (w.load || 0), 0)) : null;
  s.steerFrontL = r ? r6(r.wheels[0].steer) : null;
  s.steerTargetFrontL = r ? r6(r.wheels[0].targetSteer) : null;
  s.steerTargetFrontR = r ? r6(r.wheels[1].targetSteer) : null;
  s.steerTargetRearL = r ? r6(r.wheels[4].targetSteer) : null;
  s.clearance = (r && t) ? r6(r.pos.y - t.heightAt(r.pos.x, r.pos.z)) : null;

  /* ---- world ---- */
  s.relaysLen = p && p.relays ? r6(p.relays.length) : 0;
  s.collidersLen = p ? r6(p.colliders.length) : null;
  s.collidersRock = p ? r6(p.colliders.filter((c) => c.kind === 'rock').length) : null;
  s.collidersRelay = p ? r6(p.colliders.filter((c) => c.kind === 'relay').length) : null;
  s.collidersHome = p ? r6(p.colliders.filter((c) => c.kind === 'home').length) : null;
  s.colliderKinds = p ? Array.from(new Set(p.colliders.map((c) => String(c.kind)))).sort().join(',') : null;
  s.padLight = r6(p && p.padLight);
  s.dustN = r6(A && A.dust && A.dust.n);
  s.playableR = r6(PLAYABLE_R);
  s.homeX = r6(HOME.x); s.homeZ = r6(HOME.z);

  /* ---- marked world points (re-read live, so a dent shows up here) ---- */
  for (const name of Object.keys(marks)) {
    const m = marks[name];
    s['h_' + name] = t ? r6(t.heightAt(m.x, m.z)) : null;
    s['d_' + name] = t ? r6(t.dentAt(m.x, m.z)) : null;
    s['sl_' + name] = t ? r6(t.slopeAt(m.x, m.z)) : null;
    s['x_' + name] = r6(m.x); s['z_' + name] = r6(m.z);
  }
  s.markNames = Object.keys(marks).sort().join(',');

  /* ---- camera / sky ---- */
  s.camMode = rig ? r6(rig.mode) : null;
  s.camModeName = rig ? String(rig.modeName) : null;
  s.camPhotoMode = rig ? r6(CAM.PHOTO) : null;
  s.camYaw = r6(rig && rig.yaw); s.camPitch = r6(rig && rig.pitch);
  s.camDist = r6(rig && rig.dist); s.camFov = r6(rig && rig.fov);
  s.camFovTarget = r6(rig && rig.fovTarget); s.camShake = r6(rig && rig.shake);
  s.camLookIdle = r6(rig && rig.lookIdle); s.camAutoCentre = r6(rig && rig.autoCentre);
  s.camSens = r6(rig && rig.sens); s.camInvertY = rig ? !!rig.invertY : null;
  s.camPosX = r6(rig && rig.cam.position.x); s.camPosY = r6(rig && rig.cam.position.y);
  s.camPosZ = r6(rig && rig.cam.position.z);
  s.mastYaw = r6(r && r.mastYaw); s.mastPitch = r6(r && r.mastPitch);
  s.sunDirX = r6(sky && sky.sunDir.x); s.sunDirY = r6(sky && sky.sunDir.y);
  s.sunDirZ = r6(sky && sky.sunDir.z);
  s.sunAltDeg = sky ? r6(Math.asin(Math.max(-1, Math.min(1, sky.sunDir.y))) * 180 / Math.PI) : null;
  s.starIntensity = r6(sky && sky.starIntensity);

  /* ---- live mutable envelope (shared module objects) ---- */
  s.envMaxSpeed = r6(DRIVE.maxSpeed);
  s.envCommsDelay = r6(DRIVE.commsDelay);
  s.envDrillTime = r6(OPS.drillTime);
  s.envDrainScale = r6(OPS.drainScale);

  /* ---- app frame state ---- */
  s.elapsed = r6(A && A.elapsed);
  s.sunAz = r6(A && A.sunAz);
  s.fps = r6(A && A.fps);
  s.cmdInFlight = r6(A && A.cmdInFlight);
  s.audioReady = A && A.audio ? !!A.audio.ready : null;
  s.canvasCount = all('canvas').length;
  s.hudBridgeHalted = halted;

  /* ---- residue / isolation ---- */
  let lsKeys = [];
  try { lsKeys = Object.keys(localStorage); } catch (e) { lsKeys = []; }
  s.lsLen = r6(lsKeys.length);
  s.lsKeys = lsKeys.sort().join(',');
  s.lsOffWhitelist = r6(lsKeys.filter((k) => SAFE_SETTINGS_KEYS.indexOf(k) < 0).length);
  try { s.ssLen = r6(Object.keys(sessionStorage).length); } catch (e) { s.ssLen = -1; }
  s.cookieLen = r6(String(document.cookie || '').length);
  s.locHash = String(location.hash || '');
  s.locSearch = String(location.search || '');
  s.locPathname = String(location.pathname || '');
  s.locIsIndex = /\/(index\.html)?$/.test(String(location.pathname || ''));
  s.residueNewCount = baseGlobals
    ? r6(Object.getOwnPropertyNames(window).filter((n) => baseGlobals.indexOf(n) < 0
        && n.indexOf('__RG') !== 0).length)
    : -1;
  const res = (typeof performance.getEntriesByType === 'function')
    ? performance.getEntriesByType('resource') : [];
  s.resourceCount = r6(res.length);
  s.crossOriginCount = r6(res.filter((e) => {
    const n = String(e.name || '');
    if (!/^https?:/i.test(n)) return false;              // data:/blob: are not network
    try { return new URL(n, location.href).origin !== location.origin; }
    catch (err) { return true; }
  }).length);
  s.vendorThreeLoaded = res.some((e) => /vendor\/three\//.test(String(e.name)));

  s.frozen = frozen;
  return s;
}

/* ============================================================
   SETUP-ONLY COMMANDS
   ============================================================ */
const X = {
  version: 'moon-rover-bridge-1',

  sleep(ms) { return new Promise((res) => setTimeout(() => res(true), ms)); },

  async waitReady(ms) {
    const limit = Date.now() + (ms || 60000);
    while (Date.now() < limit) {
      const lt = txt($('loadtext')) || '';
      if (/LINK FAILURE/i.test(lt)) return false;
      if (live() && A_state() >= 1 && hasCls($('boot'), 'hidden')) return true;
      await X.sleep(100);
    }
    return false;
  },

  probeReady() { return live() && A_state() >= 1; },

  clearStorage() {
    try { localStorage.clear(); } catch (e) { /* private mode */ }
    try { sessionStorage.clear(); } catch (e) { /* private mode */ }
    try { document.cookie.split(';').forEach((c) => {
      const k = c.split('=')[0].trim();
      if (k) document.cookie = k + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }); } catch (e) { /* ignore */ }
    return true;
  },

  markBaseline() {
    baseGlobals = Object.getOwnPropertyNames(window);
    return baseGlobals.length;
  },

  resetFrozen() { for (const k of Object.keys(frozen)) delete frozen[k]; return true; },

  snap(tag) {
    const s = snapshot();
    delete s.frozen;
    frozen[String(tag)] = s;
    return true;
  },

  /* ---- frame-loop control ---- */
  halt() {
    if (halted) return true;
    rafOriginal = window.requestAnimationFrame.bind(window);
    rafQueued = [];
    window.requestAnimationFrame = function (cb) { rafQueued.push(cb); return rafQueued.length; };
    halted = true;
    return true;
  },
  resume() {
    if (!halted) return true;
    halted = false;
    window.requestAnimationFrame = rafOriginal;
    const q = rafQueued; rafQueued = [];
    for (const cb of q) { try { rafOriginal(cb); } catch (e) { /* ignore */ } }
    return true;
  },

  /* ---- pin the mutable envelope so one checkpoint cannot be disturbed by
         another defect's reach into the same shared objects ---- */
  pin() {
    DRIVE.maxSpeed = 8.4;
    DRIVE.commsDelay = 0;
    OPS.drillTime = 4.2;
    OPS.drainScale = 1;
    const A = app();
    if (A) {
      if (A.game) A.game.tc = true;
      if (A.rig) { A.rig.invertY = false; A.rig.sens = 1.0; A.rig.autoCentre = 1; A.rig.fovScale = 1; A.rig.shake = 0; }
      if (A.settings) { A.settings.realistic = false; A.settings.comms = false; }
    }
    return true;
  },

  /** Start a fresh campaign survey from the main menu and acknowledge the
      first-run mission card whenever it appears (conditional, never assumed). */
  async beginSurvey(opts) {
    const o = opts || {};
    const A = app();
    if (!live()) return false;
    X.clearStorage();
    if (o.halt !== false) X.halt();
    /* halt() swaps window.requestAnimationFrame for a queue, but the frame the
       shipped loop had ALREADY scheduled with the real one still fires once, and
       src/main.js:473-474 clamps its now-stale dt to 0.1 s - one stray stepWorld()
       landing between two setup steps, which is precisely what the frame-loop
       control documented at the top of this file exists to prevent. A callback in
       the queue is the proof that the shipped loop re-registered into the fake
       rAF and is now parked, so wait for it (bounded) before touching the app.
       Absorbing it here, while App.state is still ST.MENU, also keeps it on the
       idleWorld() branch (src/main.js:501, :525) where it cannot advance
       game.met (src/game/gameplay.js:334) at all. Under a loaded host a real
       frame can be seconds late, so without this wait the fixture's met/elapsed
       at snap time was a coin flip between 0 and 0.1. */
    if (halted) { const tp = Date.now(); while (rafQueued.length === 0 && Date.now() - tp < 2500) await X.sleep(20); }
    A.settings.realistic = false;
    A.settings.comms = false;
    A.startGame(!!o.freeRoam, false);
    X.pin();
    const t0 = Date.now();
    /* startGame() defers the first-run mission card into setTimeout(..., 700)
       whose body is `App.hud.showCard(MISSIONS[0]); App.state = ST.CARD;`
       (src/main.js:232-236), and App.state is already ST.PLAY on the synchronous
       pass. This loop therefore used to take its `A.state === 2` exit at t=0 and
       return; 700 ms later the card re-parked the fixture in ST.CARD for the rest
       of the checkpoint. tick() then sees playing=false (src/main.js:481) and
       takes idleWorld() (:500-501, :525) instead of stepWorld(), so game.update()
       - and with it met (src/game/gameplay.js:334), the radar cooldown decay
       (:350) and powerScale (:390) - never advances, even after X.resume()
       restarts the real frame loop. openPanel() also declines to record
       panelReturn from ST.CARD (src/main.js:249), so every sheet closed back to
       the main menu (src/main.js:258). ST.PLAY only means "no card is coming" on
       the free-roam path, where startGame's own `if (!resumed && !freeRoam)`
       guard (src/main.js:232) scheduled none; on the campaign path poll for the
       card and acknowledge it through #cardGo (src/main.js:276-280), which is
       what the doc comment above this function always claimed the loop did. */
    while (Date.now() - t0 < 4000) {
      const card = $('cardOverlay');
      if (card && !card.classList.contains('hidden')) { const b = $('cardGo'); if (b) b.click(); break; }
      if (A.state === 2 && o.freeRoam) break;
      await X.sleep(50);
    }
    A.state = 2;
    A.terrain.clearDent();
    A.terrain.clearTrails();
    if (A.dust) A.dust.clear();
    A.game.met = 0;
    A.elapsed = 0;
    A.game._lowWarned = false;
    A.game._brownWarned = false;
    A.game._fenceWarn = false;
    X.pin();
    X.snap('z');
    return live();
  },

  /* ---- DOM / menu ---- */
  clickId(id) { const el = $(id); if (!el) return false; el.click(); return true; },
  openSystems() { X.clickId('btnSettings'); return !hasCls($('pause'), 'hidden'); },
  openControls() { X.clickId('btnControls'); return !hasCls($('help'), 'hidden'); },
  closeSheets() { X.clickId('btnResume'); return true; },

  /** Click one option of one segmented row of the systems sheet, by label. */
  clickSeg(label, optIndex) {
    const rows = kids($('settingsBody'));
    for (const d of rows) {
      const l = d.querySelector('label');
      if (!l || String(txt(l) || '').split('\n')[0].trim().indexOf(label) !== 0) continue;
      const seg = d.querySelector('.seg');
      if (!seg) return false;
      const b = kids(seg)[optIndex];
      if (!b) return false;
      b.click();
      return true;
    }
    return false;
  },

  /* ---- fixture setters ---- */
  place(x, z, yaw) { const A = app(); A.rover.placeAt(x, z, yaw || 0); return true; },
  lift(dy) { const A = app(); A.rover.pos.y += dy; A.rover.vel.set(0, 0, 0); A.rover.omega.set(0, 0, 0); return true; },
  setVel(vx, vy, vz) { const A = app(); A.rover.vel.set(vx, vy, vz); return true; },
  setVelForward(v) {
    const A = app(); const f = A.rover.forward;
    A.rover.vel.set(f.x * v, 0, f.z * v);
    return true;
  },
  /** Upright the chassis and point it along a bearing, without touching the
      shared scratch vectors the getters hand back. */
  levelChassis(yaw) {
    const A = app(); const r = A.rover;
    const y = yaw || 0;
    r.quat.set(0, Math.sin(y / 2), 0, Math.cos(y / 2));
    r.omega.set(0, 0, 0);
    r.vel.set(0, 0, 0);
    r.sync();
    return true;
  },
  setPower(v) { const A = app(); A.game.power = v; A.game._lowWarned = false; A.game._brownWarned = false; return true; },
  setHull(v) { const A = app(); A.game.hull = v; return true; },
  setHeat(v) { const A = app(); A.game.heat = v; return true; },
  setMet(v) { const A = app(); A.game.met = v; return true; },
  setMission(i) { const A = app(); A.game.missionIdx = i; A.game.hud.missionDirty = true; return true; },
  setArmOut(b) { const A = app(); A.rover.armOut = !!b; A.rover.armDeploy = b ? 1 : 0; A.rover.aimPoint(); return true; },
  setArmAim(yaw, reach) {
    const A = app();
    A.rover.armYaw = yaw; A.rover.armReach = reach; A.rover.aimPoint();
    return true;
  },
  setPanel(v) { const A = app(); A.rover.panelTarget = v; A.rover.panelDeploy = v; return true; },
  setLamps(b) { const A = app(); A.rover.headlights = !!b; A.rover.lampPower = b ? 1 : 0; return true; },
  setSunVis(v) { const A = app(); A.rover.sunVis = v; return true; },
  setOdo(v) { const A = app(); A.rover.odo = v; return true; },
  setTc(b) { const A = app(); A.game.tc = !!b; return true; },
  setAutoCentre(v) { const A = app(); A.rig.autoCentre = v; A.settings.autoCentre = v; return true; },
  /** Camera mode by number or by the rig's own name table (CHASE/ORBIT/MAST/PHOTO).
      Entering MAST re-datums yaw to the rover heading — shipped behaviour, and
      the only way this bridge sets a known yaw without restating the chase math. */
  setCamMode(m) {
    const A = app();
    const k = typeof m === 'string' ? CAMMODES[String(m).toUpperCase().replace(/[^A-Z]/g, '')] : m;
    if (typeof k !== 'number') return false;
    A.rig.setMode(k, A.rover);
    return true;
  },
  camModes() { return { CHASE: CAM.CHASE, ORBIT: CAM.ORBIT, MAST: CAM.MAST, PHOTO: CAM.PHOTO }; },
  cycleCam() { const A = app(); A.rig.cycle(A.rover); return r6(A.rig.mode); },
  setLookIdle(v) { const A = app(); A.rig.lookIdle = v; return true; },
  setYaw(v) { const A = app(); A.rig.yaw = v; return true; },
  setPitch(v) { const A = app(); A.rig.pitch = v; return true; },
  setBay(list) {
    const A = app();
    A.game.bay.length = 0;
    for (const type of list) {
      const def = SAMPLES[type] || SAMPLES.regolith;
      A.game.bay.push({ type: type, name: def.name, rare: !!def.rare });
    }
    A.game.hud.bayDirty = true;
    return true;
  },
  setUnlocked(ids) {
    const A = app();
    A.game.unlocked = new Set(ids);
    A.game.hud.codexDirty = true;
    return true;
  },
  setCounts(obj) { const A = app(); Object.assign(A.game.counts, obj); A.game.hud.missionDirty = true; return true; },
  setObjDone(ids) {
    const A = app();
    A.game.objDone = {};
    for (const id of ids) A.game.objDone[id] = true;
    A.game.hud.missionDirty = true;
    return true;
  },
  setScanCool(v) { const A = app(); A.game.scan.cool = v; A.game.scan.active = false; A.game.scan.t = 0; return true; },

  /* ---- named world marks ---- */
  mark(name, x, z) { marks[String(name).replace(/[^A-Za-z0-9_]/g, '')] = { x: x, z: z }; return true; },
  clearMarks() { for (const k of Object.keys(marks)) delete marks[k]; return true; },

  /** Deterministic site search: the first point of a fixed spiral that is high
      enough, gentle enough and clear of every solid the world registered. */
  highGround(name, minH, nearX, nearZ, radius, clearance) {
    const A = app(); const t = A.terrain; const cols = A.props.colliders || [];
    const maxR = radius || 120;
    const clr = clearance || 8;
    const ok = (x, z) => {
      if (Math.hypot(x, z) > PLAYABLE_R - 30) return false;
      if (t.heightAt(x, z) < minH) return false;
      if (t.slopeAt(x, z) > 12) return false;
      for (const c of cols) if (Math.hypot(c.x - x, c.z - z) < (c.r || 0) + clr) return false;
      return true;
    };
    if (ok(nearX, nearZ)) { X.mark(name, nearX, nearZ); return { x: nearX, z: nearZ, h: t.heightAt(nearX, nearZ) }; }
    for (let ring = 6; ring <= maxR; ring += 6) {
      const n = Math.max(8, Math.round(ring * 1.2));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = nearX + Math.cos(a) * ring, z = nearZ + Math.sin(a) * ring;
        if (ok(x, z)) { X.mark(name, x, z); return { x: x, z: z, h: t.heightAt(x, z) }; }
      }
    }
    return null;
  },

  /** A site that is deliberately LOW, for guards that must refuse a placement. */
  lowGround(name, maxH, nearX, nearZ, radius) {
    const A = app(); const t = A.terrain;
    const maxR = radius || 200;
    const ok = (x, z) => {
      if (Math.hypot(x, z) > PLAYABLE_R - 30) return false;
      if (t.heightAt(x, z) > maxH) return false;
      if (t.slopeAt(x, z) > 12) return false;
      return true;
    };
    if (ok(nearX, nearZ)) { X.mark(name, nearX, nearZ); return { x: nearX, z: nearZ, h: t.heightAt(nearX, nearZ) }; }
    for (let ring = 8; ring <= maxR; ring += 8) {
      const n = Math.max(8, Math.round(ring * 1.0));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = nearX + Math.cos(a) * ring, z = nearZ + Math.sin(a) * ring;
        if (ok(x, z)) { X.mark(name, x, z); return { x: x, z: z, h: t.heightAt(x, z) }; }
      }
    }
    return null;
  },

  siteOf(name) { return marks[name] || null; },
  moveSiteTo(name) { const m = marks[name]; if (!m) return false; X.place(m.x, m.z, 0); return true; },
  offsetSite(name, dx, dz) {
    const m = marks[name]; if (!m) return false;
    X.place(m.x + dx, m.z + dz, 0);
    return true;
  },

  /* ---- input edges ---- */
  press(code) { const A = app(); A.input.keys.add(code); A.input.pressed.add(code); return true; },
  release(code) { const A = app(); A.input.keys.delete(code); return true; },
  endFrame() { const A = app(); A.input.endFrame(); return true; },
  clearKeys() { const A = app(); A.input.keys.clear(); A.input.pressed.clear(); A.input.mouse.down = false; A.input.mouse.clicked = false; return true; },
  mouseDown() { const A = app(); A.input.mouse.down = true; A.input.mouse.clicked = true; return true; },
  mouseUp() { const A = app(); A.input.mouse.down = false; return true; },

  /* ---- the app's own simulation entry points, stepped by hand ---- */
  ctl(throttle, steer, brake) {
    const A = app();
    return { throttle: throttle || 0, steer: steer || 0, brake: brake || 0, tc: A.game.tc !== false };
  },
  stepRover(n, dt, ctl) {
    const A = app();
    for (let i = 0; i < n; i++) A.rover.step(dt, ctl || X.ctl(0, 0, 0), A.terrain);
    return true;
  },
  stepGame(n, dt, ctl) {
    const A = app();
    for (let i = 0; i < n; i++) A.game.update(dt, ctl || X.ctl(0, 0, 0), A.input);
    return true;
  },
  stepRig(n, dt, look, ctl) {
    const A = app();
    const inp = Object.assign({ lookX: 0, lookY: 0, zoom: 0, looking: false, boost: false, up: false, down: false }, look || {});
    for (let i = 0; i < n; i++) A.rig.update(dt, A.rover, inp, ctl || { throttle: 0, steer: 0 });
    return true;
  },
  stepHud(n, dt) {
    const A = app();
    for (let i = 0; i < n; i++) A.hud.update(dt || 0, A.game, A.rover, A.sky, A.rig);
    return true;
  },
  /** rover + props + game + hud, one full simulated frame, no rendering. */
  stepSim(n, dt, ctl) {
    const A = app();
    const c = ctl || X.ctl(0, 0, 0);
    for (let i = 0; i < n; i++) {
      A.rover.hardHit = 0;
      A.rover.step(dt, c, A.terrain);
      lastImpact = A.props.resolve(A.rover);
      A.rover.sync();
      A.rover.updateVisuals(dt, c);
      A.game.update(dt, c, A.input);
      A.hud.update(dt, A.game, A.rover, A.sky, A.rig);
      A.input.endFrame();
    }
    return true;
  },

  /* ---- game actions (the shipped ones, not restatements) ---- */
  scan() { const A = app(); A.game.doScan(); return true; },
  startDrill() { const A = app(); A.game.startDrill(); return true; },
  toggleArm() { const A = app(); A.game.toggleArm(); return true; },
  togglePanel() { const A = app(); A.game.togglePanel(); return true; },
  deployRelay() { const A = app(); A.game.deployRelay(); return true; },
  unlock(id) { const A = app(); A.game.unlock(id); return true; },
  resolveProps() { const A = app(); lastImpact = A.props.resolve(A.rover); return r6(lastImpact); },
  logLine(text, kind) { const A = app(); A.hud.log(text, kind); return true; },

  /* ---- terrain deformations ---- */
  excavate(x, z, radius, depth) { const A = app(); A.terrain.excavate(x, z, radius, depth); return true; },
  rut(x, z, halfWidth, depth, dig) { const A = app(); A.terrain.rut(x, z, halfWidth, depth, dig || 0); return true; },
  /** Roll a wheel along a straight line the way the frame loop does. */
  rollRut(name, x0, z0, dx, dz, steps, halfWidth, depth) {
    const A = app();
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len, uz = dz / len;
    for (let i = 0; i <= steps; i++) {
      A.terrain.rut(x0 + ux * (i * (len / steps)), z0 + uz * (i * (len / steps)), halfWidth, depth, 0);
    }
    X.mark(name, x0, z0);
    return true;
  },
  clearDent() { const A = app(); A.terrain.clearDent(); A.terrain.clearTrails(); return true; },
  addTrack(ax, az, bx, bz, width, strength) {
    const A = app(); A.terrain.addTrack(ax, az, bx, bz, width, strength); return true;
  },

  /* ---- deterministic world-site finders -------------------------------
     A fixture must reach the SAME place in every graded state, so these
     scan a fixed polar grid with the app's own height/slope/collider data
     and take an extremum (highest point, biggest isolated rock, emptiest
     ground) rather than the first hit. Nothing here restates a game rule:
     every test is a call into terrain/props. */
  _grid(maxR, stepR) {
    const pts = [{ x: 0, z: 0 }];
    const R = maxR || 400, dr = stepR || 7;
    for (let r = dr; r <= R; r += dr) {
      const n = Math.max(12, Math.round(r * 0.9));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
      }
    }
    return pts;
  },
  _clearOf(x, z, clr, skip) {
    const A = app(); const cols = (A.props && A.props.colliders) || [];
    for (const c of cols) {
      if (skip && c === skip) continue;
      if (Math.hypot(c.x - x, c.z - z) < (c.r || 0) + clr) return false;
    }
    return true;
  },
  /** Highest drivable point on the map: the relay chain needs line of sight,
      and the game itself gates a beacon on altitude, so this is the site a
      player would drive to. */
  peak(name, maxSlope, clr, maxR) {
    const A = app(); const t = A.terrain;
    const ms = maxSlope == null ? 10 : maxSlope, cl = clr == null ? 6 : clr;
    let best = null;
    for (const p of X._grid(maxR || 400, 7)) {
      if (Math.hypot(p.x, p.z) > PLAYABLE_R - 30) continue;
      if (t.slopeAt(p.x, p.z) > ms) continue;
      if (!X._clearOf(p.x, p.z, cl)) continue;
      const h = t.heightAt(p.x, p.z);
      if (!best || h > best.h) best = { x: p.x, z: p.z, h: h };
    }
    if (!best) return null;
    X.mark(name || 'peak', best.x, best.z);
    return best;
  },
  /** A boulder with nothing else solid near it, so a single collision
      resolution step has exactly one collider to answer for. */
  rockSite(name, minIso, maxR) {
    const A = app(); const cols = (A.props && A.props.colliders) || [];
    const iso = minIso == null ? 12 : minIso;
    let best = null;
    for (const c of cols) {
      if (c.kind !== 'rock') continue;
      if (Math.hypot(c.x, c.z) > (maxR || 400)) continue;
      let near = Infinity;
      for (const o of cols) {
        if (o === c) continue;
        const d = Math.hypot(o.x - c.x, o.z - c.z) - (o.r || 0);
        if (d < near) near = d;
      }
      if (near < iso) continue;
      if (!best || c.r > best.r) { best = c; best.iso = near; }
    }
    if (!best) return null;
    X.mark(name || 'rock', best.x, best.z);
    return { x: best.x, z: best.z, r: r6(best.r), kind: best.kind, iso: r6(best.iso) };
  },
  /** Emptiest ground on the map: a stand-off point where no solid is within
      reach, for guards that must show a clean, unpushed chassis. */
  clearSite(name, minClear, maxR) {
    const A = app(); const t = A.terrain;
    const cl = minClear == null ? 14 : minClear;
    let best = null;
    for (const p of X._grid(maxR || 400, 7)) {
      if (Math.hypot(p.x, p.z) > PLAYABLE_R - 30) continue;
      if (t.slopeAt(p.x, p.z) > 10) continue;
      if (!X._clearOf(p.x, p.z, cl)) continue;
      if (!best || p.x * p.x + p.z * p.z < best.x * best.x + best.z * best.z) best = p;
    }
    if (!best) return null;
    X.mark(name || 'clear', best.x, best.z);
    return { x: best.x, z: best.z, h: r6(t.heightAt(best.x, best.z)) };
  },

  /* ---- reference data (read-only, for fixture building) ---- */
  home() { return { x: HOME.x, z: HOME.z }; },
  codexIds() { return CODEX.map((c) => c.id).join(','); },
  missionIds() { return MISSIONS.map((m) => m.id).join(','); },
  sampleNames() { return Object.keys(SAMPLES).join(','); }
};

function A_state() { const A = app(); return A && typeof A.state === 'number' ? A.state : -1; }

window.__RGQ__ = snapshot;
window.__RGX__ = X;

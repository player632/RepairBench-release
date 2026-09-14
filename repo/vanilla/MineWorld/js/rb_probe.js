/**
 * rb_probe.js - read-only verification surface for this repair task.
 *
 * This module is added by the task harness. It changes no behaviour: it holds a
 * reference to the live game instance and exposes a single frozen, non-enumerable
 * global (`window.__rb_mw`) whose every member is a PURE READ of state the page
 * already owns. No handle writes, caches, schedules or mutates anything, no handle
 * has a setter, and nothing is stored between two calls: calling a handle twice
 * reads the live page twice. Removing this file and the two lines in js/game.js
 * that load it restores the page exactly as it shipped.
 *
 * Static elements in index.html additionally carry `data-testid` attributes so the
 * page can be addressed without depending on CSS or copy that a repair may move.
 */

import * as THREE from 'three';
import {
  World, BlockType, BlockNames, isSolid, getBlockColor,
  CHUNK_SIZE, CHUNK_HEIGHT, SEA_LEVEL, RENDER_DISTANCE, MOBILE_RENDER_DISTANCE,
} from './voxel.js';

const live = { game: null, bootDone: false, errors: [] };

/* ---------- read helpers: every one of them only reads ---------- */
const G = () => live.game;
const W = () => (live.game && live.game.world ? live.game.world : null);
const UI = () => (live.game && live.game.ui ? live.game.ui : null);
const AM = () => (live.game && live.game.animalManager ? live.game.animalManager : null);
const r6 = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : null);
const r4 = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : null);
const q = (s) => document.querySelector(s);
const qa = (s) => Array.from(document.querySelectorAll(s));
const cs = (el, p) => { try { return el ? String(getComputedStyle(el)[p]) : ''; } catch (e) { return ''; } };
const csi = (el, p) => { try { return el ? String(el.style[p] || '') : ''; } catch (e) { return ''; } };
const hex = (c) => { try { return c && typeof c.getHexString === 'function' ? String(c.getHexString()) : ''; } catch (e) { return ''; } };
const tryRead = (fn, fallback) => { try { const v = fn(); return v === undefined ? fallback : v; } catch (e) { return fallback; } };
/* handle factories: N/B/S build a nullary handle, NP/BP/SP build one that takes arguments */
const N = (fn) => () => tryRead(fn, null);
const B = (fn) => () => tryRead(fn, false) === true;
const S = (fn) => () => { const v = tryRead(fn, null); return typeof v === 'string' ? v : (v === null ? null : String(v)); };
const NP = (fn) => (...a) => tryRead(() => fn(...a), null);
const BP = (fn) => (...a) => tryRead(() => fn(...a), false) === true;
const SP = (fn) => (...a) => { const v = tryRead(() => fn(...a), null); return typeof v === 'string' ? v : (v === null ? null : String(v)); };

/* inline-style scale() reader and computed matrix() reader (two different shapes) */
const scaleOfInline = (t) => { const m = /scale\(\s*(-?[0-9.]+)\s*\)/.exec(String(t || '')); return m ? Number(m[1]) : null; };
const scaleOfMatrix = (t) => { const m = /^matrix\(\s*(-?[0-9.eE+]+)/.exec(String(t || '')); return m ? Number(m[1]) : null; };

/* CSSOM readers: the declared value of a rule, independent of layout and display */
const ruleOf = (sel) => {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules = null;
    try { rules = sheet.cssRules; } catch (e) { continue; }
    for (const r of Array.from(rules || [])) if (r.selectorText === sel) return r;
  }
  return null;
};
const ruleProp = (sel, prop) => { const r = ruleOf(sel); return r && r.style ? String(r.style.getPropertyValue(prop) || '') : null; };

/* wall geometry, re-derived from the seed's own static fields */
const WALL_STRIDE = () => World.LETTER_SIZE + World.GAP;
const WALL_X_MIN = () => World.TEXT_START_X;
const WALL_X_MAX = () => World.TEXT_START_X + World.TOTAL_W - 1;
const WALL_Y_MIN = () => World.TEXT_BASE_Y;
const WALL_Y_MAX = () => World.TEXT_BASE_Y + World.LETTER_SIZE - 1;

/**
 * Chunk-local storage read. This deliberately bypasses World.getBlock: it answers
 * "what is stored in this chunk column", which is the ground truth the world API is
 * supposed to hand back. A storage census taken through it stays independent of the
 * world-coordinate folding the API performs.
 */
const storedBlock = (wx, wy, wz) => {
  const w = W();
  if (!w || wy < 0 || wy >= CHUNK_HEIGHT) return -1;
  const cx = Math.floor(wx / CHUNK_SIZE);
  const cz = Math.floor(wz / CHUNK_SIZE);
  const c = w.chunks.get(w.chunkKey(cx, cz));
  if (!c) return -1;
  return c.getBlock(wx - cx * CHUNK_SIZE, wy, wz - cz * CHUNK_SIZE);
};

const wallRowCount = (y) => {
  let n = 0;
  for (let x = WALL_X_MIN(); x <= WALL_X_MAX(); x++) {
    for (let z = World.TEXT_WALL_Z - 1; z <= World.TEXT_WALL_Z + 1; z++) {
      if (storedBlock(x, y, z) === BlockType.COZE_CYAN) n++;
    }
  }
  return n;
};

const wallColumn = (x) => {
  let s = '';
  for (let y = WALL_Y_MIN(); y <= WALL_Y_MAX(); y++) s += String(storedBlock(x, y, World.TEXT_WALL_Z));
  return s;
};

const letterCell = (li, row, col) => (
  storedBlock(World.TEXT_START_X + li * WALL_STRIDE() + col, WALL_Y_MAX() - row, World.TEXT_WALL_Z) === BlockType.COZE_CYAN ? 1 : 0
);

const letterOnes = (li) => {
  let n = 0;
  for (let r = 0; r < World.LETTER_SIZE; r++) for (let c = 0; c < World.LETTER_SIZE; c++) n += letterCell(li, r, c);
  return n;
};

const slots = () => qa('#hotbar .hotbar-slot');
const selectedSlotEl = () => q('#hotbar .hotbar-slot.selected');
const previewOf = (i) => { const s = slots()[i]; return s ? s.querySelector('.block-preview') : null; };
const keyLabelOf = (i) => { const s = slots()[i]; const k = s ? s.querySelector('.slot-key') : null; return k ? k.textContent : ''; };
const originOf = (u) => { try { return new URL(u, document.baseURI).origin; } catch (e) { return ''; } };
const rgbOfHex = (h) => {
  const s = String(h || '').replace('#', '');
  if (s.length !== 6) return null;
  return `rgb(${parseInt(s.slice(0, 2), 16)}, ${parseInt(s.slice(2, 4), 16)}, ${parseInt(s.slice(4, 6), 16)})`;
};
const RES_SELECTOR = 'link[href], script[src], img[src], iframe[src], source[src], video[src], audio[src], a[href]';

const HANDLES = {
  /* ---------- boot and infrastructure ---------- */
  bootDone: B(() => live.bootDone === true),
  bootErrorCount: N(() => live.errors.length),
  bootErrorFirst: S(() => (live.errors.length ? String(live.errors[0]).slice(0, 200) : '')),
  rendererOk: B(() => { const g = G(); return !!(g && g.renderer && g.renderer.domElement === g.canvas); }),
  canvasIsRendererTarget: B(() => { const g = G(); return !!(g && g.renderer && g.renderer.domElement === q('#gameCanvas')); }),
  chunkCount: N(() => { const w = W(); return w ? w.chunks.size : null; }),
  pendingCount: N(() => { const w = W(); return w ? w.pendingChunks.length : null; }),
  isMobile: B(() => { const g = G(); return g ? g.isMobile === true : false; }),
  renderDistance: N(() => { const g = G(); return g ? g.renderDistance : null; }),
  isRunning: B(() => { const g = G(); return g ? g.isRunning === true : false; }),
  isPointerLocked: B(() => { const g = G(); return g ? g.isPointerLocked === true : false; }),
  worldSeed: N(() => { const w = W(); return w ? w.seed : null; }),
  canvasWidthAttr: N(() => { const c = q('#gameCanvas'); return c ? c.width : null; }),
  canvasHeightAttr: N(() => { const c = q('#gameCanvas'); return c ? c.height : null; }),
  rendererSizeCsv: S(() => { const g = G(); if (!g || !g.renderer) return null; const v = new THREE.Vector2(); g.renderer.getSize(v); return `${Math.round(v.x)},${Math.round(v.y)}`; }),

  /* ---------- overlay and screen visibility ---------- */
  loadingBarInlineDisplay: S(() => csi(UI() && UI().loadingBar, 'display')),
  loadingFillInlineWidth: S(() => csi(UI() && UI().loadingFill, 'width')),
  loadingBarComputedDisplay: S(() => cs(q('#loadingBar'), 'display')),
  startScreenDisplay: S(() => cs(q('#startScreen'), 'display')),
  startScreenVisible: B(() => cs(q('#startScreen'), 'display') !== 'none'),
  pauseScreenDisplay: S(() => cs(q('#pauseScreen'), 'display')),
  pauseScreenVisible: B(() => cs(q('#pauseScreen'), 'display') !== 'none'),
  crosshairDisplay: S(() => cs(q('#crosshair'), 'display')),
  debugInfoDisplay: S(() => cs(q('#debugInfo'), 'display')),
  blockHighlightDisplay: S(() => cs(q('#blockHighlight'), 'display')),
  controlsPanelDisplay: S(() => cs(q('#controlsPanel'), 'display')),
  selectedBlockNameDisplay: S(() => cs(q('#selectedBlockName'), 'display')),
  hotbarDisplay: S(() => cs(q('#hotbar'), 'display')),
  mobileControlsDisplay: S(() => csi(q('#mobileControls'), 'display')),

  /* ---------- three.js provenance and the offline load path ---------- */
  threeRevision: S(() => String(THREE.REVISION)),
  windowThreeRevision: S(() => (typeof window.__THREE__ === 'string' ? window.__THREE__ : '')),
  threeNamespaceHasFog: B(() => typeof THREE.Fog === 'function'),
  threeNamespaceHasWebGLRenderer: B(() => typeof THREE.WebGLRenderer === 'function'),
  threeNamespaceHasMeshLambertMaterial: B(() => typeof THREE.MeshLambertMaterial === 'function'),
  importmapThreeSpec: S(() => { const s = q('script[type="importmap"]'); return s ? String(JSON.parse(s.textContent).imports.three) : null; }),
  importmapThreeIsRelative: B(() => { const s = q('script[type="importmap"]'); if (!s) return false; const spec = JSON.parse(s.textContent).imports.three; return typeof spec === 'string' && spec.startsWith('./') && !/^[a-z][a-z0-9+.-]*:/i.test(spec); }),
  importmapEntryCount: N(() => { const s = q('script[type="importmap"]'); return s ? Object.keys(JSON.parse(s.textContent).imports).length : null; }),
  importmapHasNoAbsoluteEntry: B(() => { const s = q('script[type="importmap"]'); if (!s) return false; const im = JSON.parse(s.textContent).imports; return Object.keys(im).every((k) => !/^[a-z][a-z0-9+.-]*:/i.test(String(im[k])) && !/^\/\//.test(String(im[k]))); }),
  threeLoadedFromVendor: B(() => performance.getEntriesByType('resource').some((e) => /\/vendor\/three\/three\.module\.js$/.test(e.name))),
  offOriginResourceCount: N(() => performance.getEntriesByType('resource').filter((e) => originOf(e.name) !== location.origin).length),
  sameOriginResourceCount: N(() => performance.getEntriesByType('resource').filter((e) => originOf(e.name) === location.origin).length),
  resourceCountMinSix: B(() => performance.getEntriesByType('resource').length >= 6),
  offOriginLinkCount: N(() => qa(RES_SELECTOR).filter((el) => { const u = el.getAttribute('href') || el.getAttribute('src'); return !!u && originOf(u) !== location.origin; }).length),
  offOriginCssUrlCount: N(() => {
    let n = 0;
    for (const sheet of Array.from(document.styleSheets)) {
      let rules = null;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const r of Array.from(rules || [])) {
        const hits = String(r.cssText || '').match(/url\(\s*['"]?([^'")]+)/g) || [];
        for (const one of hits) if (originOf(one.replace(/^url\(\s*['"]?/, '')) !== location.origin) n++;
      }
    }
    return n;
  }),
  externalScriptCount: N(() => qa('script[src]').filter((el) => originOf(el.getAttribute('src')) !== location.origin).length),
  externalStylesheetCount: N(() => qa('link[rel="stylesheet"]').filter((el) => originOf(el.getAttribute('href')) !== location.origin).length),
  protocolIsHttp: B(() => location.protocol === 'http:' || location.protocol === 'https:'),

  /* ---------- facade discipline ---------- */
  facadeExists: B(() => !!window.__rb_mw && typeof window.__rb_mw === 'object'),
  facadeFrozen: B(() => Object.isFrozen(window.__rb_mw)),
  facadeNotExtensible: B(() => !Object.isExtensible(window.__rb_mw)),
  facadeSealed: B(() => Object.isSealed(window.__rb_mw)),
  facadeWritableMembers: N(() => Object.getOwnPropertyNames(window.__rb_mw || {}).filter((k) => { const d = Object.getOwnPropertyDescriptor(window.__rb_mw, k); return !d || d.writable === true || d.configurable === true || typeof d.set === 'function'; }).length),
  facadeHandleCount: N(() => Object.getOwnPropertyNames(window.__rb_mw || {}).length),
  facadeEveryMemberIsFunction: B(() => Object.getOwnPropertyNames(window.__rb_mw || {}).every((k) => typeof window.__rb_mw[k] === 'function')),
  facadeEnumerableOnWindow: B(() => Object.keys(window).includes('__rb_mw')),
  windowDescriptorIsLocked: B(() => { const d = Object.getOwnPropertyDescriptor(window, '__rb_mw'); return !!d && d.enumerable === false && d.writable === false && d.configurable === false; }),
  facadeIsIdempotent: B(() => !!window.__rb_mw && Object.getOwnPropertyNames(window.__rb_mw).length > 0),
  testidCount: N(() => qa('[data-testid]').length),

  /* ---------- state isolation ---------- */
  localStorageCount: N(() => window.localStorage.length),
  sessionStorageCount: N(() => window.sessionStorage.length),
  cookieCount: N(() => (document.cookie ? document.cookie.split(';').filter((x) => x.trim()).length : 0)),
  rbGlobalCount: N(() => Object.keys(window).filter((k) => k.startsWith('__rb')).length),
  locationHash: S(() => location.hash),
  locationSearch: S(() => location.search),
  locationPathnameIsIndexHtml: B(() => /\/index\.html$/.test(location.pathname)),
  serviceWorkerControlled: B(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller)),
  bodyChildCount: N(() => document.body.children.length),

  /* ---------- noise ---------- */
  noise2DAt: NP((x, y) => { const w = W(); return w ? r6(w.noise.noise2D(Number(x), Number(y))) : null; }),
  fbmAt: NP((x, z) => { const w = W(); return w ? r6(w.noise.fbm(Number(x) * 0.02, Number(z) * 0.02, 4, 2.0, 0.5)) : null; }),
  fbmOctaves1At: NP((x, y) => { const w = W(); return w ? r6(w.noise.fbm(Number(x), Number(y), 1)) : null; }),
  treeNoise2DAt: NP((x, y) => { const w = W(); return w ? r6(w.treeNoise.noise2D(Number(x), Number(y))) : null; }),
  fbmInBandAt: BP((x, z) => { const w = W(); if (!w) return false; return Math.abs(w.noise.fbm(Number(x) * 0.02, Number(z) * 0.02, 4, 2.0, 0.5)) <= 1; }),
  noise2DInBandAt: BP((x, y) => { const w = W(); if (!w) return false; return Math.abs(w.noise.noise2D(Number(x), Number(y))) <= 1; }),
  permLength: N(() => { const w = W(); return w ? w.noise.perm.length : null; }),
  permIsDoubled: B(() => { const w = W(); if (!w) return false; const p = w.noise.perm; for (let i = 0; i < 256; i++) if (p[i] !== p[i + 256]) return false; return true; }),

  /* ---------- world constants and block table ---------- */
  chunkSizeConst: N(() => CHUNK_SIZE),
  chunkHeightConst: N(() => CHUNK_HEIGHT),
  seaLevelConst: N(() => SEA_LEVEL),
  renderDistanceConst: N(() => RENDER_DISTANCE),
  mobileRenderDistanceConst: N(() => MOBILE_RENDER_DISTANCE),
  textBaseY: N(() => World.TEXT_BASE_Y),
  letterSize: N(() => World.LETTER_SIZE),
  letterGap: N(() => World.GAP),
  textWallZ: N(() => World.TEXT_WALL_Z),
  textGroundY: N(() => World.TEXT_GROUND_Y),
  textStartX: N(() => World.TEXT_START_X),
  textTotalW: N(() => World.TOTAL_W),
  textFlatRadiusX: N(() => World.TEXT_FLAT_RADIUS_X),
  textFlatRadiusZ: N(() => World.TEXT_FLAT_RADIUS_Z),
  textWallDepth: N(() => World.TEXT_WALL_DEPTH),
  textWordLength: N(() => World.WORD.length),
  textWordCsv: S(() => World.WORD.join('')),
  blockTypeCount: N(() => Object.keys(BlockType).length),
  blockNameCount: N(() => Object.keys(BlockNames).length),
  isSolidOf: BP((t) => isSolid(Number(t)) === true),
  blockColorOf: SP((t) => getBlockColor(Number(t))),
  blockNameLengthOf: NP((t) => { const n = BlockNames[Number(t)]; return typeof n === 'string' ? n.length : null; }),
  airIsNotSolid: B(() => isSolid(BlockType.AIR) === false),
  waterIsNotSolid: B(() => isSolid(BlockType.WATER) === false),
  grassTypeValue: N(() => BlockType.GRASS),
  leavesTypeValue: N(() => BlockType.LEAVES),
  cozeTypeValue: N(() => BlockType.COZE_CYAN),

  /* ---------- world reads ---------- */
  blockAt: NP((x, y, z) => { const w = W(); return w ? w.getBlock(Number(x), Number(y), Number(z)) : null; }),
  storedBlockAt: NP((x, y, z) => storedBlock(Number(x), Number(y), Number(z))),
  surfaceHeightAt: NP((x, z) => { const w = W(); return w ? w.getSurfaceHeight(Number(x), Number(z)) : null; }),
  storedSurfaceHeightAt: NP((x, z) => { for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) if (isSolid(storedBlock(Number(x), y, Number(z)))) return y + 1; return SEA_LEVEL; }),
  managerGroundY: NP((x, z) => { const a = AM(); return a ? a._getGroundY(Number(x), Number(z)) : null; }),
  textWallBlockCount: N(() => { let n = 0; for (let y = WALL_Y_MIN(); y <= WALL_Y_MAX(); y++) n += wallRowCount(y); return n; }),
  wallRowCountAt: NP((y) => wallRowCount(Number(y))),
  wallColumnAt: SP((x) => wallColumn(Number(x))),
  letterCellAt: NP((li, row, col) => letterCell(Number(li), Number(row), Number(col))),
  letterOnesOf: NP((li) => letterOnes(Number(li))),
  letterOnesTotal: N(() => { let n = 0; for (let li = 0; li < World.WORD.length; li++) n += letterOnes(li); return n; }),
  wallRowPairInvariant: B(() => {
    const pair = (a, b) => wallRowCount(a) + wallRowCount(b);
    return pair(WALL_Y_MIN(), WALL_Y_MAX()) === 231
      && pair(WALL_Y_MIN() + 1, WALL_Y_MAX() - 1) === 63
      && pair(WALL_Y_MIN() + 2, WALL_Y_MAX() - 2) === 63
      && pair(WALL_Y_MIN() + 3, WALL_Y_MAX() - 3) === 96;
  }),
  negXStoredWallCount: N(() => { let n = 0; for (let x = WALL_X_MIN(); x < 0; x++) for (let y = WALL_Y_MIN(); y <= WALL_Y_MAX(); y++) for (let z = World.TEXT_WALL_Z - 1; z <= World.TEXT_WALL_Z + 1; z++) if (storedBlock(x, y, z) === BlockType.COZE_CYAN) n++; return n; }),
  posXStoredWallCount: N(() => { let n = 0; for (let x = 0; x <= WALL_X_MAX(); x++) for (let y = WALL_Y_MIN(); y <= WALL_Y_MAX(); y++) for (let z = World.TEXT_WALL_Z - 1; z <= World.TEXT_WALL_Z + 1; z++) if (storedBlock(x, y, z) === BlockType.COZE_CYAN) n++; return n; }),
  chunkKeyOf: SP((cx, cz) => { const w = W(); return w ? w.chunkKey(Number(cx), Number(cz)) : null; }),
  chunkPresentCount: N(() => {
    const w = W(); if (!w) return null;
    let n = 0;
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        if (dx * dx + dz * dz > RENDER_DISTANCE * RENDER_DISTANCE) continue;
        if (w.chunks.has(w.chunkKey(dx, dz))) n++;
      }
    }
    return n;
  }),

  /* ---------- texture atlas and materials ---------- */
  atlasWidth: N(() => { const w = W(); return w && w.material && w.material.map && w.material.map.image ? w.material.map.image.width : null; }),
  atlasHeight: N(() => { const w = W(); return w && w.material && w.material.map && w.material.map.image ? w.material.map.image.height : null; }),
  materialExists: B(() => { const w = W(); return !!(w && w.material); }),
  materialMapExists: B(() => { const w = W(); return !!(w && w.material && w.material.map); }),
  materialSideIsFront: B(() => { const w = W(); return !!(w && w.material && w.material.side === THREE.FrontSide); }),
  waterMaterialExists: B(() => { const w = W(); return !!(w && w.waterMaterial); }),
  textureMinFilterIsNearest: B(() => { const w = W(); return !!(w && w.material && w.material.map && w.material.map.minFilter === THREE.NearestFilter); }),
  textureFlipYFalse: B(() => { const w = W(); return !!(w && w.material && w.material.map && w.material.map.flipY === false); }),
  textureColorSpaceIsSrgb: B(() => { const w = W(); return !!(w && w.material && w.material.map && w.material.map.colorSpace === THREE.SRGBColorSpace); }),

  /* ---------- scene, lights, fog, camera ---------- */
  sceneExists: B(() => { const g = G(); return !!(g && g.scene); }),
  sceneFogExists: B(() => { const g = G(); return !!(g && g.scene && g.scene.fog); }),
  fogIsFog: B(() => { const g = G(); return !!(g && g.scene && g.scene.fog && g.scene.fog.isFog === true); }),
  fogNear: N(() => { const g = G(); return g && g.scene && g.scene.fog ? r6(g.scene.fog.near) : null; }),
  fogFar: N(() => { const g = G(); return g && g.scene && g.scene.fog ? r6(g.scene.fog.far) : null; }),
  fogColorHex: S(() => { const g = G(); return g && g.scene && g.scene.fog ? hex(g.scene.fog.color) : null; }),
  fogNearLessThanFar: B(() => { const g = G(); if (!g || !g.scene || !g.scene.fog) return false; return g.scene.fog.near < g.scene.fog.far; }),
  fogFarMinusNear: N(() => { const g = G(); if (!g || !g.scene || !g.scene.fog) return null; return r6(g.scene.fog.far - g.scene.fog.near); }),
  fogColorMatchesClear: B(() => { const g = G(); if (!g || !g.scene || !g.scene.fog || !g.renderer) return false; return hex(g.scene.fog.color) === hex(g.renderer.getClearColor(new THREE.Color())); }),
  sceneLightCount: N(() => { const g = G(); return g && g.scene ? g.scene.children.filter((o) => o && o.isLight === true).length : null; }),
  ambientIntensity: N(() => { const g = G(); if (!g || !g.scene) return null; const l = g.scene.children.find((o) => o && o.isAmbientLight === true); return l ? r6(l.intensity) : null; }),
  ambientColorHex: S(() => { const g = G(); if (!g || !g.scene) return null; const l = g.scene.children.find((o) => o && o.isAmbientLight === true); return l ? hex(l.color) : null; }),
  dirIntensity: N(() => { const g = G(); if (!g || !g.scene) return null; const l = g.scene.children.find((o) => o && o.isDirectionalLight === true); return l ? r6(l.intensity) : null; }),
  dirColorHex: S(() => { const g = G(); if (!g || !g.scene) return null; const l = g.scene.children.find((o) => o && o.isDirectionalLight === true); return l ? hex(l.color) : null; }),
  dirPositionCsv: S(() => { const g = G(); if (!g || !g.scene) return null; const l = g.scene.children.find((o) => o && o.isDirectionalLight === true); return l ? `${r6(l.position.x)},${r6(l.position.y)},${r6(l.position.z)}` : null; }),
  hemiIntensity: N(() => { const g = G(); if (!g || !g.scene) return null; const l = g.scene.children.find((o) => o && o.isHemisphereLight === true); return l ? r6(l.intensity) : null; }),
  hemiSkyHex: S(() => { const g = G(); if (!g || !g.scene) return null; const l = g.scene.children.find((o) => o && o.isHemisphereLight === true); return l ? hex(l.color) : null; }),
  hemiGroundHex: S(() => { const g = G(); if (!g || !g.scene) return null; const l = g.scene.children.find((o) => o && o.isHemisphereLight === true); return l ? hex(l.groundColor) : null; }),
  clearColorHex: S(() => { const g = G(); return g && g.renderer ? hex(g.renderer.getClearColor(new THREE.Color())) : null; }),
  cameraNear: N(() => { const g = G(); return g && g.camera ? r6(g.camera.near) : null; }),
  cameraFar: N(() => { const g = G(); return g && g.camera ? r6(g.camera.far) : null; }),
  cameraAspect: N(() => { const g = G(); return g && g.camera ? r6(g.camera.aspect) : null; }),
  defaultFov: N(() => { const g = G(); return g ? r6(g.defaultFov) : null; }),
  fovMin: N(() => { const g = G(); return g ? r6(g.fovMin) : null; }),
  fovMax: N(() => { const g = G(); return g ? r6(g.fovMax) : null; }),
  cameraFov: N(() => { const g = G(); return g && g.camera ? r6(g.camera.fov) : null; }),
  gameFovField: N(() => { const g = G(); return g ? r6(g.fov) : null; }),
  cameraFovIsAtMax: B(() => { const g = G(); return !!(g && g.camera && g.fovMax !== undefined && g.camera.fov === g.fovMax); }),
  cameraFovIsAtMin: B(() => { const g = G(); return !!(g && g.camera && g.fovMin !== undefined && g.camera.fov === g.fovMin); }),
  cameraFovMatchesGameField: B(() => { const g = G(); return !!(g && g.camera && g.camera.fov === g.fov); }),
  cameraProjectionYY: N(() => { const g = G(); return g && g.camera ? r4(g.camera.projectionMatrix.elements[5]) : null; }),
  cameraPositionCsv: S(() => { const g = G(); return g && g.camera ? `${r4(g.camera.position.x)},${r4(g.camera.position.y)},${r4(g.camera.position.z)}` : null; }),
  fovHintExists: B(() => !!q('#fovHint')),
  fovHintNumber: N(() => { const h = q('#fovHint'); if (!h) return null; const m = /(-?[0-9]+)/.exec(h.textContent || ''); return m ? Number(m[1]) : null; }),

  /* ---------- hotbar and block readout ---------- */
  hotbarSlotCount: N(() => slots().length),
  keyLabelCount: N(() => qa('#hotbar .hotbar-slot .slot-key').length),
  previewCount: N(() => qa('#hotbar .hotbar-slot .block-preview').length),
  hotbarKeyLabels: S(() => slots().map((s) => { const k = s.querySelector('.slot-key'); return k ? k.textContent : ''; }).join(',')),
  keyLabelOfSlot: SP((i) => keyLabelOf(Number(i))),
  keyLabelOfSelectedSlot: S(() => { const g = G(); return g ? keyLabelOf(g.selectedSlot) : null; }),
  firstKeyLabelIsOne: B(() => keyLabelOf(0) === '1'),
  lastKeyLabelMatchesSlotCount: B(() => { const n = slots().length; return n > 0 && keyLabelOf(n - 1) === String(n); }),
  slotIndexAttrCsv: S(() => slots().map((s) => String(s.dataset.index)).join(',')),
  blockTypesCsv: S(() => { const g = G(); return g ? g.blockTypes.join(',') : null; }),
  blockTypeCountOfGame: N(() => { const g = G(); return g ? g.blockTypes.length : null; }),
  selectedSlot: N(() => { const g = G(); return g ? g.selectedSlot : null; }),
  selectedSlotCount: N(() => slots().filter((s) => s.classList.contains('selected')).length),
  selectedSlotIsLast: B(() => { const g = G(); return !!(g && g.selectedSlot === g.blockTypes.length - 1); }),
  selectedSlotIsFirst: B(() => { const g = G(); return !!(g && g.selectedSlot === 0); }),
  selectedSlotElementIndex: N(() => { const el = selectedSlotEl(); return el ? Number(el.dataset.index) : null; }),
  blockTypeOfSelectedSlot: N(() => { const g = G(); return g ? g.blockTypes[g.selectedSlot] : null; }),
  playerSelectedBlock: N(() => { const g = G(); return g && g.player ? g.player.selectedBlock : null; }),
  nameTextMatchesSelectedSlot: B(() => { const g = G(); const el = UI() && UI().selectedBlockName; if (!g || !el) return false; return el.textContent === (BlockNames[g.blockTypes[g.selectedSlot]] || ''); }),
  nameTextLength: N(() => { const el = UI() && UI().selectedBlockName; return el ? el.textContent.length : null; }),
  nameTransformText: S(() => csi(UI() && UI().selectedBlockName, 'transform')),
  nameTransformScale: N(() => scaleOfInline(csi(UI() && UI().selectedBlockName, 'transform'))),
  nameInlineOpacity: S(() => csi(UI() && UI().selectedBlockName, 'opacity')),
  nameRuleTransition: S(() => ruleProp('#selectedBlockName', 'transition')),
  previewBackgroundColorOfSlot: SP((i) => cs(previewOf(Number(i)), 'backgroundColor')),
  previewInlineBackgroundOfSlot: SP((i) => csi(previewOf(Number(i)), 'backgroundColor')),
  previewColorMatchesBlockColor: BP((i) => {
    const g = G(); const el = previewOf(Number(i));
    if (!g || !el) return false;
    const want = rgbOfHex(getBlockColor(g.blockTypes[Number(i)]));
    return want !== null && cs(el, 'backgroundColor') === want;
  }),
  previewBoxShadowIsInset: B(() => /inset/.test(cs(previewOf(0), 'boxShadow'))),
  selectedSlotBorderTopColor: S(() => cs(selectedSlotEl(), 'borderTopColor')),
  selectedSlotBorderIsWhite: B(() => cs(selectedSlotEl(), 'borderTopColor') === 'rgb(255, 255, 255)'),
  selectedSlotBorderTopWidth: S(() => cs(selectedSlotEl(), 'borderTopWidth')),
  selectedSlotBorderTopStyle: S(() => cs(selectedSlotEl(), 'borderTopStyle')),
  selectedSlotBackgroundColor: S(() => cs(selectedSlotEl(), 'backgroundColor')),
  selectedSlotOutlineColor: S(() => cs(selectedSlotEl(), 'outlineColor')),
  selectedSlotOutlineOffset: S(() => cs(selectedSlotEl(), 'outlineOffset')),
  selectedSlotBoxShadowHasWhite: B(() => /255,\s*255,\s*255/.test(cs(selectedSlotEl(), 'boxShadow'))),
  unselectedSlotBorderTopColor: S(() => cs(slots().find((s) => !s.classList.contains('selected')), 'borderTopColor')),
  selectedRuleBorderColor: S(() => ruleProp('.hotbar-slot.selected', 'border-color')),
  selectedRuleBorderIsWhite: B(() => ruleProp('.hotbar-slot.selected', 'border-color') === 'rgb(255, 255, 255)'),
  selectedRuleBackgroundColor: S(() => ruleProp('.hotbar-slot.selected', 'background-color')),
  selectedRuleTransform: S(() => ruleProp('.hotbar-slot.selected', 'transform')),
  selectedRuleBoxShadowHasWhite: B(() => /255,\s*255,\s*255/.test(String(ruleProp('.hotbar-slot.selected', 'box-shadow') || ''))),
  slotRuleBorderTopColor: S(() => ruleProp('.hotbar-slot', 'border-top-color')),
  slotRuleWidth: S(() => ruleProp('.hotbar-slot', 'width')),
  slotRuleHeight: S(() => ruleProp('.hotbar-slot', 'height')),
  hotbarSlotWidth: S(() => cs(q('#hotbar .hotbar-slot'), 'width')),
  hotbarSlotHeight: S(() => cs(q('#hotbar .hotbar-slot'), 'height')),
  hotbarGap: S(() => cs(q('#hotbar'), 'gap')),
  hotbarPadding: S(() => cs(q('#hotbar'), 'padding')),
  hotbarBorderRadius: S(() => cs(q('#hotbar'), 'borderRadius')),
  blockPreviewWidth: S(() => cs(previewOf(0), 'width')),
  blockPreviewHeight: S(() => cs(previewOf(0), 'height')),
  slotKeyFontSize: S(() => cs(q('#hotbar .hotbar-slot .slot-key'), 'fontSize')),
  slotKeyColor: S(() => cs(q('#hotbar .hotbar-slot .slot-key'), 'color')),
  hotbarSlotTransitionIsSet: B(() => /0\.12s/.test(cs(q('#hotbar .hotbar-slot'), 'transition'))),

  /* ---------- player ---------- */
  spawnX: N(() => { const g = G(); return g ? r6(g._spawnX) : null; }),
  spawnY: N(() => { const g = G(); return g ? r6(g._spawnY) : null; }),
  spawnZ: N(() => { const g = G(); return g ? r6(g._spawnZ) : null; }),
  playerYaw: N(() => { const g = G(); return g && g.player ? r6(g.player.yaw) : null; }),
  playerPitch: N(() => { const g = G(); return g && g.player ? r6(g.player.pitch) : null; }),
  playerEyeHeight: N(() => { const g = G(); return g && g.player ? r6(g.player.eyeHeight) : null; }),
  playerWidth: N(() => { const g = G(); return g && g.player ? r6(g.player.width) : null; }),
  playerHeight: N(() => { const g = G(); return g && g.player ? r6(g.player.height) : null; }),
  playerGravity: N(() => { const g = G(); return g && g.player ? r6(g.player.gravity) : null; }),
  playerJumpSpeed: N(() => { const g = G(); return g && g.player ? r6(g.player.jumpSpeed) : null; }),
  playerMoveSpeed: N(() => { const g = G(); return g && g.player ? r6(g.player.moveSpeed) : null; }),
  playerOnGround: B(() => { const g = G(); return !!(g && g.player && g.player.onGround === true); }),
  playerPositionCsv: S(() => { const g = G(); return g && g.player ? `${r4(g.player.position.x)},${r4(g.player.position.y)},${r4(g.player.position.z)}` : null; }),

  /* ---------- robots ---------- */
  animalManagerExists: B(() => !!AM()),
  robotArrayIsArray: B(() => { const a = AM(); return !!(a && Array.isArray(a.animals)); }),
  robotCountIsNonNegative: B(() => { const a = AM(); return !!(a && a.animals.length >= 0); }),
  robotCountAtMostEight: B(() => { const a = AM(); return !!(a && a.animals.length <= 8); }),
  spawnCenterCsv: S(() => { const a = AM(); return a ? `${r6(a.spawnCenter.x)},${r6(a.spawnCenter.y)},${r6(a.spawnCenter.z)}` : null; }),
  managerSpawnedFlag: B(() => { const a = AM(); return !!(a && a._spawned === true); }),
  managerIsNotMobile: B(() => { const a = AM(); return !!(a && a.isMobile === false); }),
  managerGroundYAllPositive: B(() => {
    const a = AM(); if (!a) return false;
    const cols = [[5, 5], [20, 8], [47, 0], [40, 0], [15, -5], [30, 5], [6, -55], [10, -53], [9, 55], [53, 36]];
    return cols.every((c) => { const v = a._getGroundY(c[0], c[1]); return typeof v === 'number' && v >= 1; });
  }),

  /* ---------- document inventory ---------- */
  canvasId: S(() => { const c = q('canvas'); return c ? c.id : null; }),
  scriptModuleCount: N(() => qa('script[type="module"]').length),
  importmapScriptCount: N(() => qa('script[type="importmap"]').length),
  stylesheetLinkCount: N(() => qa('link[rel="stylesheet"]').length),
  inlineStyleElementCount: N(() => qa('style').length),
  iframeCount: N(() => qa('iframe').length),
  langAttribute: S(() => document.documentElement.getAttribute('lang')),
  charsetIsUtf8: B(() => /utf-8/i.test(String(document.characterSet || ''))),
  titleIsNonEmpty: B(() => String(document.title || '').trim().length > 0),
  startTitleExists: B(() => !!q('#startScreen .start-title')),
  startSubtitleText: S(() => { const e = q('#startScreen .start-subtitle'); return e ? e.textContent.trim() : null; }),
  startHintExists: B(() => !!q('#startScreen .start-hint')),
  startControlRowCount: N(() => qa('#startScreen .controls-info .control-row').length),
  controlsPanelRowCount: N(() => qa('#controlsPanel .controls-body .control-row').length),
  mobileActionButtonCount: N(() => qa('#actionButtons .action-btn').length),
  joystickThumbExists: B(() => !!q('#joystickThumb')),
  mobileHotbarChildCount: N(() => { const e = q('#mobileHotbar'); return e ? e.children.length : null; }),
  cssRuleCount: N(() => { const s = document.styleSheets[0]; if (!s) return null; try { return s.cssRules.length; } catch (e) { return null; } }),
  stylesheetHrefIsRelative: B(() => { const l = q('link[rel="stylesheet"]'); if (!l) return false; const h = String(l.getAttribute('href') || ''); return h.startsWith('./') && originOf(h) === location.origin; }),
};

function buildFacade() {
  const facade = {};
  for (const name of Object.keys(HANDLES)) {
    Object.defineProperty(facade, name, {
      value: HANDLES[name], enumerable: true, writable: false, configurable: false,
    });
  }
  Object.freeze(facade);
  Object.defineProperty(window, '__rb_mw', {
    value: facade, enumerable: false, writable: false, configurable: false,
  });
}

/** Register the live game instance and hang the read-only facade on window. */
export function __rbInstall(game) {
  live.game = game;
  live.bootDone = false;
  if (!window.__rb_mw) buildFacade();
  window.addEventListener('error', (e) => {
    if (live.errors.length < 8) live.errors.push(String((e && e.message) || 'error').slice(0, 200));
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (live.errors.length < 8) live.errors.push(String((e && e.reason && e.reason.message) || (e && e.reason) || 'rejection').slice(0, 200));
  });
}

/** Record that Game#init() has returned. Read-only consumers poll bootDone(). */
export function __rbMarkBoot() {
  live.bootDone = true;
}

/**
 * RepairBench instrumentation probe.
 *
 * Read-only observation bridge over the live DOM plus a deterministic save-file
 * harness, published as `window.__CKSE__`. It never throws: every accessor is
 * wrapped so that a partially rendered page yields a neutral value instead of an
 * exception (a throwing accessor would turn a behaviour failure into an
 * unattributable runner error).
 *
 * Two extra jobs:
 *  - stamp stable `data-testid` / `data-rb-oid` hooks that the seed does not have
 *    (idempotent, driven by a MutationObserver plus a safety tick);
 *  - capture the exported save payload by wrapping `URL.createObjectURL` and the
 *    anchor `click()` the exporter uses, so the download itself is never needed.
 */
// The item catalogue is already part of the application bundle, so re-using it
// here costs nothing and keeps the fixture harness compact.
import ItemDataJson from './app/data/item-data.json';

const ITEMS: { [objectId: string]: any } = (ItemDataJson as any).items || {};

interface RbSpec {
  [key: string]: string;
}

interface RbState {
  exportText: string | null;
  exportName: string | null;
  bootGlobals: Set<string> | null;
  latches: { [key: string]: string };
  noticeLog: string[];
}

const state: RbState = {
  exportText: null,
  exportName: null,
  bootGlobals: null,
  latches: {},
  noticeLog: []
};

const IGNORED_GLOBAL = (name: string): boolean =>
  name === '__CKSE__' ||
  name.startsWith('__zone_symbol__') ||
  name.startsWith('__playwright') ||
  name.startsWith('__pw') ||
  name.startsWith('__zone');

const snapshotGlobals = (): void => {
  if (state.bootGlobals) {
    return;
  }
  const set = new Set<string>();
  const names = Object.getOwnPropertyNames(window);
  for (let i = 0; i < names.length; i++) {
    if (!IGNORED_GLOBAL(names[i])) {
      set.add(names[i]);
    }
  }
  state.bootGlobals = set;
};

setTimeout(snapshotGlobals, 1200);
window.addEventListener('load', () => setTimeout(snapshotGlobals, 300));

/* ------------------------------------------------------------------ *
 * export capture (installed once, before the application bootstraps)
 * ------------------------------------------------------------------ */
const origCreateObjectURL = (URL as any).createObjectURL;
(URL as any).createObjectURL = function (obj: any): string {
  try {
    if (obj && typeof obj.text === 'function') {
      obj.text().then(
        (text: string) => {
          state.exportText = text;
        },
        () => {
          /* unreadable blob: leave the previous capture in place */
        }
      );
    }
  } catch (e) {
    /* capture is best effort only */
  }
  return origCreateObjectURL.call(URL, obj);
};

const origAnchorClick = HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click = function (): void {
  try {
    if (this.download) {
      state.exportName = this.download;
    }
  } catch (e) {
    /* best effort */
  }
  origAnchorClick.call(this);
};

/* ------------------------------------------------------------------ *
 * small DOM helpers
 * ------------------------------------------------------------------ */
const txt = (el: Element | null): string =>
  el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '';

const q = (sel: string): Element | null => {
  try {
    return document.querySelector(sel);
  } catch (e) {
    return null;
  }
};

const qa = (sel: string): Element[] => {
  try {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  } catch (e) {
    return [];
  }
};

const num = (raw: string | null, fallback: number): number => {
  if (raw === null || raw === undefined) {
    return fallback;
  }
  const m = String(raw).match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : fallback;
};

const COLOR_TOKENS: { [rgb: string]: string } = {
  '183,182,182': 'grey',
  '147,147,147': 'tooltipgrey',
  '253,251,44': 'yellow',
  '172,161,1': 'olive',
  '114,107,0': 'tooltipolive',
  '0,255,0': 'green',
  '255,255,255': 'white'
};

const colorToken = (raw: string): string => {
  if (!raw) {
    return 'none';
  }
  let triple = '';
  const rgb = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    triple = rgb[1] + ',' + rgb[2] + ',' + rgb[3];
  } else {
    const hex = raw.match(/#([0-9a-fA-F]{6})/);
    if (hex) {
      const v = hex[1];
      triple =
        parseInt(v.slice(0, 2), 16) +
        ',' +
        parseInt(v.slice(2, 4), 16) +
        ',' +
        parseInt(v.slice(4, 6), 16);
    }
  }
  if (!triple) {
    return 'other:' + raw;
  }
  return COLOR_TOKENS[triple] || 'other:' + raw;
};

const styleColor = (el: Element | null): string => {
  if (!el) {
    return 'missing';
  }
  return colorToken((el as HTMLElement).style.color || '');
};

const slotEl = (index: number): HTMLElement | null =>
  q('#inventory-' + index) as HTMLElement | null;

const idMatches = (re: RegExp): number =>
  qa('[id]').filter((el) => re.test((el as HTMLElement).id)).length;

const slotIcon = (index: number): number => {
  const el = slotEl(index);
  const icon = el ? (el.querySelector('.icon') as HTMLElement | null) : null;
  return icon ? num(icon.style.getPropertyValue('--index'), -1) : -1;
};

const NAV_SLUGS: { [label: string]: string } = {
  Items: 'items',
  Skills: 'skills',
  Character: 'character',
  About: 'about',
  Help: 'help',
  debug: 'debug',
  Import: 'import',
  Export: 'export'
};

const TAB_SLUGS = ['items', 'skills', 'character', 'about', 'help', 'debug'];

const navEls = (): HTMLElement[] =>
  qa('app-tab-group > div:first-child > div.nav-item') as HTMLElement[];

const navSlug = (index: number): string => {
  const label = txt(navEls()[index] || null);
  return NAV_SLUGS[label] || String(index);
};

const activeTabIndex = (): number => {
  const navs = navEls();
  for (let i = 0; i < navs.length; i++) {
    if (navs[i].classList.contains('active')) {
      return i;
    }
  }
  return -1;
};

const detailRoot = (): Element | null => q('app-item-detail');
const tooltipRoot = (): Element | null => q('.cdk-overlay-pane app-item-tooltip');
const browserItems = (): HTMLElement[] => qa('app-item-browser app-item') as HTMLElement[];

const detailPs = (): Element[] => (detailRoot() ? qa('app-item-detail app-card > p') : []);
const tooltipPs = (): Element[] =>
  tooltipRoot() ? qa('.cdk-overlay-pane app-item-tooltip p') : [];

/* ------------------------------------------------------------------ *
 * stored save accessors (localStorage is the seed's own persistence)
 * ------------------------------------------------------------------ */
const CHAR_KEY = 'core-keeper-save-editor.character';
const INDEX_KEY = 'core-keeper-save-editor.index';
const DISCLAIMER_KEY = 'core-keeper-save-editor.disclaimer';

const storedCharacter = (): any => {
  try {
    const raw = window.localStorage.getItem(CHAR_KEY);
    return raw === null ? null : JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const decodeStoredName = (): string => {
  const ch = storedCharacter();
  if (!ch || !ch.characterCustomization || !ch.characterCustomization.name) {
    return 'missing';
  }
  try {
    const offset = ch.characterCustomization.name.bytes.offset0000;
    const bytes: number[] = [];
    for (let i = 0; i < 16; i++) {
      const value = offset['byte00' + String(i).padStart(2, '0')];
      if (value !== 0) {
        bytes.push(value);
      }
    }
    return new TextDecoder('utf-8').decode(Uint8Array.from(bytes));
  } catch (e) {
    return 'undecodable';
  }
};

/* ------------------------------------------------------------------ *
 * fixture harness
 * ------------------------------------------------------------------ */
const buildSpec = (raw: string): RbSpec => {
  const spec: RbSpec = {};
  const parts = String(raw || '').split(';');
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) {
      continue;
    }
    const eq = part.indexOf('=');
    if (eq < 0) {
      spec[part] = '1';
    } else {
      spec[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
    }
  }
  return spec;
};

const blankSlot = (): any => ({ objectID: 0, amount: 0, variation: 0, variationUpdateCount: 0 });

const baseCharacter = (): any => {
  const inventory: any[] = [];
  for (let i = 0; i < 66; i++) {
    inventory.push(blankSlot());
  }
  const skills: any[] = [];
  const trees: any[] = [];
  for (let i = 0; i < 12; i++) {
    skills.push({ skillID: i, value: 0 });
    trees.push({ skillTreeID: i, points: [0, 0, 0, 0, 0, 0, 0] });
  }
  const offset0000: any = {};
  const extraBytes: any = {};
  for (let i = 0; i < 16; i++) {
    offset0000['byte00' + String(i).padStart(2, '0')] = 0;
  }
  for (let i = 16; i < 30; i++) {
    extraBytes['byte00' + i] = 0;
  }
  return {
    version: 12,
    characterGuid: 'rbrbrbrbrbrbrbrbrbrbrbrbrbrbrbrb',
    characterCustomization: {
      name: { utf8LengthInBytes: 0, bytes: Object.assign({ offset0000 }, extraBytes) },
      gender: 0,
      skinColor: 0,
      hair: 0,
      hairColor: 0,
      eyes: 0,
      eyesColor: 0,
      shirtColor: 0,
      shirtSkin: 0,
      pantsColor: 0,
      pantsSkin: 0,
      helm: 0,
      breastArmor: 0,
      pantsArmor: 0,
      role: 0
    },
    discoveredObjects: [],
    servers: [],
    skills,
    activatedCrystals: [],
    inventory,
    conditionsList: [],
    hasUnlockedSouls: false,
    coinAmount: 0,
    collectedSouls: [],
    maxHealth: 100,
    serverConnectCount: 0,
    skillTalentTreeDatas: trees,
    characterType: 0,
    completedTutorials: [],
    discoveredBiomes: [],
    discoveredObjects2: [],
    disabledSoulPowers: []
  };
};

const csvNumbers = (raw: string): number[] =>
  String(raw || '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map((part) => Number(part));

const applyName = (ch: any, name: string): void => {
  const encoded = new TextEncoder().encode(name.slice(0, 16));
  ch.characterCustomization.name.utf8LengthInBytes = encoded.length;
  const offset = ch.characterCustomization.name.bytes.offset0000;
  for (let i = 0; i < 16; i++) {
    offset['byte00' + String(i).padStart(2, '0')] = i < encoded.length ? encoded[i] : 0;
  }
};

/**
 * Build a save-file payload from a compact `key=value;key=value` spec.
 * Supported keys: name, guid, slot<N>[=<objectID>], amount<N>, skill<N>[=<xp>],
 * omitSkill=<id>, points<N>[=<csv of 7>], souls=<csv>, hasSouls, hardcore,
 * index (unused: the slot index comes from the file name), condInf.
 */
const makeSave = (rawSpec: string): string => {
  const spec = buildSpec(rawSpec);
  const ch = baseCharacter();

  if (spec['name'] !== undefined) {
    applyName(ch, spec['name']);
  }
  if (spec['guid'] !== undefined) {
    ch.characterGuid = spec['guid'];
  }
  if (spec['hardcore'] !== undefined) {
    ch.characterType = Number(spec['hardcore']) ? 1 : 0;
  }
  if (spec['hasSouls'] !== undefined) {
    ch.hasUnlockedSouls = Number(spec['hasSouls']) === 1;
  }
  if (spec['souls'] !== undefined) {
    ch.collectedSouls = csvNumbers(spec['souls']).sort();
  }

  const keys = Object.keys(spec);
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    const slotMatch = key.match(/^slot(\d+)$/);
    if (slotMatch) {
      const index = Number(slotMatch[1]);
      const objectID = Number(spec[key]);
      if (index >= 0 && index < ch.inventory.length && objectID > 0) {
        const data = ITEMS[String(objectID)];
        ch.inventory[index].objectID = objectID;
        ch.inventory[index].amount =
          spec['amount' + index] !== undefined
            ? Number(spec['amount' + index])
            : data
            ? Number(data.initialAmount)
            : 1;
      }
      continue;
    }
    const skillMatch = key.match(/^skill(\d+)$/);
    if (skillMatch) {
      const id = Number(skillMatch[1]);
      const entry = ch.skills.find((s: any) => s.skillID === id);
      if (entry) {
        entry.value = Number(spec[key]);
      }
      continue;
    }
    const pointsMatch = key.match(/^points(\d+)$/);
    if (pointsMatch) {
      const id = Number(pointsMatch[1]);
      const tree = ch.skillTalentTreeDatas.find((t: any) => t.skillTreeID === id);
      if (tree) {
        tree.points = csvNumbers(spec[key]);
      }
      continue;
    }
  }

  if (spec['omitSkill'] !== undefined) {
    const drop = csvNumbers(spec['omitSkill']);
    ch.skills = ch.skills.filter((s: any) => drop.indexOf(s.skillID) < 0);
    ch.skillTalentTreeDatas = ch.skillTalentTreeDatas.filter(
      (t: any) => drop.indexOf(t.skillTreeID) < 0
    );
  }

  let text = JSON.stringify(ch);
  if (spec['condInf'] !== undefined) {
    // A real corrupted save carries the bare `Infinity` token, which is not valid
    // JSON - that is exactly the case the importer's placeholder dance exists for.
    text = text.replace('"conditionsList":[]', '"conditionsList":[{"id":999,"duration":Infinity}]');
  }
  return text;
};

const fileInput = (): HTMLInputElement | null => q('input[type="file"]') as HTMLInputElement | null;

/** Build a save file from the spec and feed it to the importer exactly like a user picking it. */
const loadSave = (rawSpec: string, filename: string): boolean => {
  try {
    const input = fileInput();
    if (!input) {
      return false;
    }
    const text = makeSave(rawSpec);
    const transfer = new DataTransfer();
    transfer.items.add(new File([text], filename, { type: 'application/json' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  } catch (e) {
    return false;
  }
};

/* ------------------------------------------------------------------ *
 * guarded interaction helpers (used by F2P setups so that a missing
 * element can never degrade a red into an unattributable setup error)
 * ------------------------------------------------------------------ */
const clickEl = (el: Element | null): boolean => {
  if (!el) {
    return false;
  }
  try {
    (el as HTMLElement).click();
    return true;
  } catch (e) {
    return false;
  }
};

const byTid = (tid: string): HTMLElement | null => q('[data-testid="' + tid + '"]') as HTMLElement | null;

const clickTestid = (tid: string): boolean => clickEl(byTid(tid));

const clickNav = (slug: string): boolean => clickTestid('rb-nav-' + slug);

const clickSlot = (index: number): boolean => clickEl(slotEl(index));

const setTestidValue = (tid: string, value: string, eventName: string): boolean => {
  const el = byTid(tid) as HTMLInputElement | null;
  if (!el) {
    return false;
  }
  try {
    el.value = value;
    el.dispatchEvent(new Event(eventName, { bubbles: true }));
    return true;
  } catch (e) {
    return false;
  }
};

const setTestidChecked = (tid: string, checked: boolean): boolean => {
  const el = byTid(tid) as HTMLInputElement | null;
  if (!el) {
    return false;
  }
  try {
    el.checked = checked;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  } catch (e) {
    return false;
  }
};

const focusTestid = (tid: string): boolean => {
  const el = byTid(tid);
  if (!el) {
    return false;
  }
  try {
    el.focus();
    return true;
  } catch (e) {
    return false;
  }
};

/** Dispatch a key event on the focused element so document-level listeners see it. */
const pressKeyOnFocus = (key: string): string => {
  try {
    const target = (document.activeElement || document.body) as HTMLElement;
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    return target.tagName.toLowerCase();
  } catch (e) {
    return 'error';
  }
};

/**
 * Close the first-visit notice if it is up. Conditional and side-effect-light:
 * it clicks the seed's own acknowledgement button and, when a backdrop survives
 * the close animation, only demotes its pointer-events (the DOM is never
 * removed). This keeps the notice from being a single point of failure for the
 * whole checkpoint set while P02 still asserts the notice's real lifecycle.
 */
const dismissNotice = (): boolean => {
  try {
    clickEl(q('app-first-visit-disclaimer button'));
  } catch (e) {
    /* nothing to dismiss */
  }
  try {
    const backdrops = qa('.cdk-overlay-backdrop');
    for (let i = 0; i < backdrops.length; i++) {
      const parent = backdrops[i].parentElement;
      const liveDialog = parent ? parent.querySelector('app-inaccessible-items') : null;
      if (!liveDialog) {
        (backdrops[i] as HTMLElement).style.pointerEvents = 'none';
      }
    }
  } catch (e) {
    /* best effort */
  }
  return true;
};

/* ------------------------------------------------------------------ *
 * testid stamping
 * ------------------------------------------------------------------ */
const setTid = (el: Element | null, tid: string): void => {
  if (el && el.getAttribute('data-testid') !== tid) {
    el.setAttribute('data-testid', tid);
  }
};

const stamp = (): void => {
  try {
    const navs = navEls();
    for (let i = 0; i < navs.length; i++) {
      setTid(navs[i], 'rb-nav-' + navSlug(i));
    }
    setTid(fileInput(), 'rb-file-input');

    const tabs = qa('app-tab');
    for (let i = 0; i < tabs.length; i++) {
      setTid(tabs[i], 'rb-tab-' + (TAB_SLUGS[i] || i));
    }

    setTid(q('app-first-visit-disclaimer'), 'rb-notice');
    setTid(q('app-first-visit-disclaimer button'), 'rb-notice-ok');
    setTid(q('app-inaccessible-items'), 'rb-warn');
    const warnButtons = qa('app-inaccessible-items button');
    setTid(warnButtons[0], 'rb-warn-cancel');
    setTid(warnButtons[1], 'rb-warn-ok');

    setTid(q('app-item-browser input[type="text"]'), 'rb-item-search');
    setTid(q('app-item-browser select'), 'rb-item-category');
    setTid(detailRoot(), 'rb-detail');
    setTid(q('app-item-detail button'), 'rb-detail-remove');
    setTid(q('app-item-detail input[type="number"]'), 'rb-detail-amount');

    setTid(q('#name'), 'rb-char-name');
    setTid(q('#hardcore'), 'rb-char-hardcore');
    setTid(q('#saveslot'), 'rb-char-index');
    setTid(q('#souls'), 'rb-char-souls');
    setTid(q('#azeos-soul'), 'rb-soul-1');
    setTid(q('#omoroth-soul'), 'rb-soul-2');
    setTid(q('#scarab-soul'), 'rb-soul-3');
    setTid(q('app-character button'), 'rb-char-reset');

    const skills = qa('app-skill-list app-skill');
    for (let i = 0; i < skills.length; i++) {
      setTid(skills[i], 'rb-skill-' + i);
    }
    const levelButtons = qa('app-skill-list button.level-button');
    setTid(levelButtons[0], 'rb-skill-dec');
    setTid(levelButtons[1], 'rb-skill-inc');
    setTid(q('app-skill-list input.current-level'), 'rb-skill-level');

    const talents = qa('app-talent-tree app-talent');
    for (let i = 0; i < talents.length; i++) {
      setTid(talents[i], 'rb-talent-' + i);
    }
    setTid(q('app-talent-tree button'), 'rb-talent-reset');

    stampBrowserOids();
  } catch (e) {
    /* stamping is best effort */
  }
};

/**
 * The catalogue id of a browser tile is not in the DOM (the tile only carries the
 * sprite index), so map sprite index -> objectID once from the bundled catalogue.
 */
const SPRITE_TO_OID: { [iconIndex: string]: number } = (() => {
  const map: { [iconIndex: string]: number } = {};
  const keys = Object.keys(ITEMS);
  for (let i = 0; i < keys.length; i++) {
    const item = ITEMS[keys[i]];
    if (item && item.iconIndex !== undefined && map[String(item.iconIndex)] === undefined) {
      map[String(item.iconIndex)] = Number(item.objectID);
    }
  }
  return map;
})();

const stampBrowserOids = (): void => {
  try {
    const items = browserItems();
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      if (el.hasAttribute('data-rb-oid')) {
        continue;
      }
      const icon = el.querySelector('.icon');
      const index = icon ? num((icon as HTMLElement).style.getPropertyValue('--index'), -1) : -1;
      const oid = SPRITE_TO_OID[String(index)];
      el.setAttribute('data-rb-oid', oid === undefined ? 'sprite-' + index : String(oid));
    }
  } catch (e) {
    /* best effort */
  }
};

const scheduleStamp = (() => {
  let pending = false;
  return () => {
    if (pending) {
      return;
    }
    pending = true;
    setTimeout(() => {
      pending = false;
      stamp();
      stampBrowserOids();
    }, 60);
  };
})();

try {
  const observer = new MutationObserver(scheduleStamp);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id']
  });
} catch (e) {
  /* the safety tick below still keeps the hooks fresh */
}
setInterval(scheduleStamp, 400);
stamp();

/* ------------------------------------------------------------------ *
 * latches + first-visit notice lifecycle log
 *
 * `remember`/`recall` freeze a scalar read taken mid-setup so an assertion
 * compares against a constant instead of re-reading a value that may already
 * have moved on (the runner re-evaluates assertions for several seconds).
 * `recordNotice` appends one entry to an ordered log, which lets the
 * disclaimer's real open -> closed -> still-closed-after-reload lifecycle be
 * asserted as a single scalar string.
 * ------------------------------------------------------------------ */
const remember = (key: string, value: any): string => {
  const frozen = typeof value === 'function' ? 'fn' : String(value);
  state.latches[String(key)] = frozen;
  return frozen;
};

const recall = (key: string): string => {
  const held = state.latches[String(key)];
  return held === undefined ? 'unset' : held;
};

const noticeStateToken = (): string => {
  const open = q('app-first-visit-disclaimer') ? 'open' : 'closed';
  let keyed = 'nokey';
  try {
    keyed = window.localStorage.getItem(DISCLAIMER_KEY) !== null ? 'key' : 'nokey';
  } catch (e) {
    keyed = 'unreadable';
  }
  return open + '/' + keyed;
};

const recordNotice = (tag: string): string => {
  const entry = String(tag) + '=' + noticeStateToken();
  state.noticeLog.push(entry);
  return entry;
};

const noticeLog = (): string => state.noticeLog.join('|');

const clearNoticeLog = (): boolean => {
  state.noticeLog = [];
  return true;
};

/* ------------------------------------------------------------------ *
 * the published bridge
 * ------------------------------------------------------------------ */
const probe = {
  /* ---- harness ---- */
  makeSave,
  loadSave,
  dismissNotice,
  remember,
  recall,
  recordNotice,
  noticeLog,
  clearNoticeLog,
  clearExport: (): boolean => {
    state.exportText = null;
    state.exportName = null;
    return true;
  },
  stamp,
  clickNav,
  clickTestid,
  clickSlot,
  clickSkill: (index: number): boolean => clickTestid('rb-skill-' + index),
  clickTalent: (index: number): boolean => clickTestid('rb-talent-' + index),
  setTestidValue,
  setTestidChecked,
  focusTestid,
  pressKeyOnFocus,
  setSearch: (value: string): boolean => setTestidValue('rb-item-search', value, 'input'),
  setCategory: (value: string): boolean => setTestidValue('rb-item-category', value, 'change'),
  setDetailAmount: (value: string): boolean => setTestidValue('rb-detail-amount', value, 'change'),
  setCharName: (value: string): boolean => setTestidValue('rb-char-name', value, 'change'),
  setCharIndex: (value: string): boolean => setTestidValue('rb-char-index', value, 'change'),
  setSkillLevel: (value: string): boolean => setTestidValue('rb-skill-level', value, 'change'),

  /* ---- shell / navigation ---- */
  ready: (): boolean => !!q('app-tab-group') && navEls().length > 0 && !!q('app-items-page'),
  pageTitle: (): string => document.title,
  navCount: (): number => navEls().length,
  navLabel: (index: number): string => txt(navEls()[index] || null),
  navHasLabel: (label: string): boolean =>
    navEls().some((el) => txt(el) === label),
  activeTabSlug: (): string => {
    const index = activeTabIndex();
    return index < 0 ? 'none' : navSlug(index);
  },
  activeTabIndex: activeTabIndex,
  tabCount: (): number => qa('app-tab').length,
  tabVisible: (slug: string): boolean => {
    const index = TAB_SLUGS.indexOf(slug);
    if (index < 0) {
      return false;
    }
    const host = qa('app-tab')[index] as HTMLElement | undefined;
    return !!host && host.classList.contains('block') && host.offsetParent !== null;
  },
  tabHostClass: (slug: string): string => {
    const index = TAB_SLUGS.indexOf(slug);
    const host = qa('app-tab')[index] as HTMLElement | undefined;
    return host ? String(host.className) : 'missing';
  },
  urlState: (): string =>
    window.location.pathname + '|' + window.location.search + '|' + window.location.hash,

  /* ---- dialogs ---- */
  noticeOpen: (): boolean => !!q('app-first-visit-disclaimer'),
  noticeText: (): string => txt(q('app-first-visit-disclaimer')),
  noticeHas: (needle: string): boolean => txt(q('app-first-visit-disclaimer')).indexOf(needle) >= 0,
  warnOpen: (): boolean => !!q('app-inaccessible-items'),
  warnHas: (needle: string): boolean => txt(q('app-inaccessible-items')).indexOf(needle) >= 0,
  overlayPaneCount: (): number => qa('.cdk-overlay-pane').length,
  blockingBackdrops: (): number =>
    qa('.cdk-overlay-backdrop').filter(
      (el) => window.getComputedStyle(el as HTMLElement).pointerEvents !== 'none'
    ).length,

  /* ---- persistence ---- */
  lsKeyCount: (): number => {
    try {
      return window.localStorage.length;
    } catch (e) {
      return -1;
    }
  },
  lsKeyList: (): string => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        keys.push(window.localStorage.key(i) || '');
      }
      return keys.sort().join('|');
    } catch (e) {
      return 'unreadable';
    }
  },
  hasDisclaimerKey: (): boolean => {
    try {
      return window.localStorage.getItem(DISCLAIMER_KEY) !== null;
    } catch (e) {
      return false;
    }
  },
  storedPresent: (): boolean => storedCharacter() !== null,
  storedName: decodeStoredName,
  storedIndex: (): string => {
    try {
      const raw = window.localStorage.getItem(INDEX_KEY);
      return raw === null ? 'missing' : raw;
    } catch (e) {
      return 'unreadable';
    }
  },
  storedSlotObjectID: (index: number): number => {
    const ch = storedCharacter();
    if (!ch || !ch.inventory || !ch.inventory[index]) {
      return -1;
    }
    return Number(ch.inventory[index].objectID);
  },
  storedSlotAmount: (index: number): number => {
    const ch = storedCharacter();
    if (!ch || !ch.inventory || !ch.inventory[index]) {
      return -1;
    }
    return Number(ch.inventory[index].amount);
  },
  storedSkillCount: (): number => {
    const ch = storedCharacter();
    return ch && ch.skills ? Number(ch.skills.length) : -1;
  },
  storedSkillXp: (skillID: number): number => {
    const ch = storedCharacter();
    if (!ch || !ch.skills) {
      return -1;
    }
    const entry = ch.skills.find((s: any) => s.skillID === skillID);
    return entry ? Number(entry.value) : -1;
  },
  storedSoulsCount: (): number => {
    const ch = storedCharacter();
    return ch && ch.collectedSouls ? Number(ch.collectedSouls.length) : -1;
  },
  storedSoulsList: (): string => {
    const ch = storedCharacter();
    return ch && ch.collectedSouls ? ch.collectedSouls.join(',') : 'missing';
  },
  storedHasSouls: (): boolean => {
    const ch = storedCharacter();
    return !!ch && ch.hasUnlockedSouls === true;
  },
  storedCharacterType: (): number => {
    const ch = storedCharacter();
    return ch ? Number(ch.characterType) : -1;
  },
  storedGuid: (): string => {
    const ch = storedCharacter();
    return ch ? String(ch.characterGuid) : 'missing';
  },
  storedHas: (needle: string): boolean => {
    try {
      const raw = window.localStorage.getItem(CHAR_KEY);
      return raw !== null && raw.indexOf(needle) >= 0;
    } catch (e) {
      return false;
    }
  },

  /* ---- state isolation ---- */
  sessionKeyCount: (): number => {
    try {
      return window.sessionStorage.length;
    } catch (e) {
      return -1;
    }
  },
  cookieLength: (): number => String(document.cookie || '').length,
  strayGlobals: (): number => {
    if (!state.bootGlobals) {
      return -1;
    }
    const names = Object.getOwnPropertyNames(window);
    let extra = 0;
    for (let i = 0; i < names.length; i++) {
      if (!IGNORED_GLOBAL(names[i]) && !state.bootGlobals.has(names[i])) {
        extra++;
      }
    }
    return extra;
  },
  globalsSnapshotted: (): boolean => state.bootGlobals !== null,

  /* ---- inventory / equipment geometry ---- */
  toolbarSlots: (): number => idMatches(/^inventory-[0-9]$/),
  gridSlots: (): number => idMatches(/^inventory-[1-4][0-9]$/),
  equipmentSlots: (): number => idMatches(/^inventory-5[1-8]$/),
  slotExists: (index: number): boolean => !!slotEl(index),
  slotFilled: (index: number): boolean => {
    const el = slotEl(index);
    return !!el && !!el.querySelector('.icon');
  },
  slotIcon: slotIcon,
  slotObjectID: (index: number): number => {
    const icon = slotIcon(index);
    if (icon < 0) {
      return -1;
    }
    const oid = SPRITE_TO_OID[String(icon)];
    return oid === undefined ? -1 : oid;
  },
  slotBorder: (index: number): number => {
    const el = slotEl(index);
    if (!el) {
      return -99;
    }
    const style = String(el.getAttribute('style') || '');
    const m = style.match(/border\/item\/(-?\d+)\.png/);
    return m ? Number(m[1]) : -99;
  },
  slotSelected: (index: number): boolean => {
    const el = slotEl(index);
    return !!el && /border\/item\/-1\.png/.test(String(el.getAttribute('style') || ''));
  },
  slotPlaceholder: (index: number): number => {
    const el = slotEl(index);
    const img = el ? (el.querySelector('img') as HTMLImageElement | null) : null;
    if (!img) {
      return -1;
    }
    const m = String(img.getAttribute('src') || '').match(/equipment-placeholder\/(\d+)\.png/);
    return m ? Number(m[1]) : -1;
  },
  slotAmount: (index: number): number => {
    const el = slotEl(index);
    const amount = el ? el.querySelector('.item-amount') : null;
    return amount ? num(txt(amount), -1) : -1;
  },
  slotDurability: (index: number): number => {
    const el = slotEl(index);
    const bar = el ? (el.querySelector('.durability-progress > div') as HTMLElement | null) : null;
    return bar ? num(bar.style.width, -1) : -1;
  },
  slotReinforced: (index: number): boolean => {
    const el = slotEl(index);
    return !!el && !!el.querySelector('.reinforcement-progress');
  },
  slotHidden: (index: number): boolean => {
    const el = slotEl(index);
    const icon = el ? (el.querySelector('.icon') as HTMLElement | null) : null;
    return !!icon && icon.classList.contains('hidden');
  },
  slotTestId: (index: number): string => {
    const el = slotEl(index);
    return el ? String(el.getAttribute('data-testid') || 'none') : 'missing';
  },
  inventoryHostCount: (): number => qa('app-inventory app-item').length,
  equipmentHostCount: (): number => qa('app-equipment app-item').length,

  /* ---- item catalogue ---- */
  browserTotal: (): number => browserItems().length,
  browserVisible: (): number =>
    browserItems().filter((el) => !el.classList.contains('!hidden')).length,
  browserOidPresent: (objectID: number): boolean =>
    !!q('app-item-browser app-item[data-rb-oid="' + objectID + '"]'),
  browserOidVisible: (objectID: number): boolean => {
    const el = q('app-item-browser app-item[data-rb-oid="' + objectID + '"]') as HTMLElement | null;
    return !!el && !el.classList.contains('!hidden');
  },
  searchValue: (): string => {
    const el = byTid('rb-item-search') as HTMLInputElement | null;
    return el ? el.value : 'missing';
  },
  categoryValue: (): string => {
    const el = byTid('rb-item-category') as HTMLSelectElement | null;
    return el ? String(el.value) : 'missing';
  },
  categoryOptionCount: (): number => qa('app-item-browser select option').length,

  /* ---- item detail card ---- */
  detailOpen: (): boolean => !!q('app-item-detail app-card'),
  detailName: (): string => txt(q('app-item-detail h3')),
  detailId: (): string => txt(q('app-item-detail span.text-gray-300')),
  detailRarity: (): string => txt(q('app-item-detail h4')),
  detailNameColor: (): string => styleColor(q('app-item-detail h3')),
  detailPCount: (): number => detailPs().length,
  detailPText: (index: number): string => txt(detailPs()[index] || null),
  detailPColor: (index: number): string => styleColor(detailPs()[index] || null),
  detailHasText: (needle: string): boolean =>
    detailPs().some((el) => txt(el).indexOf(needle) >= 0),
  detailAmountVisible: (): boolean => !!q('app-item-detail input[type="number"]'),
  detailAmountValue: (): string => {
    const el = q('app-item-detail input[type="number"]') as HTMLInputElement | null;
    return el ? el.value : 'missing';
  },
  detailAmountMax: (): string => txt(detailRoot()).replace(/^.*\/\s*/, ''),
  detailRemoveVisible: (): boolean => !!q('app-item-detail button'),

  /* ---- tooltip ---- */
  tooltipOpen: (): boolean => !!tooltipRoot(),
  tooltipName: (): string => txt(tooltipRoot() ? q('.cdk-overlay-pane app-item-tooltip h3') : null),
  tooltipId: (): string => txt(q('.cdk-overlay-pane app-item-tooltip span.text-base')),
  tooltipPCount: (): number => tooltipPs().length,
  tooltipPText: (index: number): string => txt(tooltipPs()[index] || null),
  tooltipDesc: (): string => txt(q('.cdk-overlay-pane app-item-tooltip p.text-gray-500')),

  /* ---- skills ---- */
  skillCount: (): number => qa('app-skill-list app-skill').length,
  skillTile: (index: number): Element | null => qa('app-skill-list app-skill')[index] || null,
  skillLevelText: (index: number): string => {
    const tile = qa('app-skill-list app-skill')[index];
    if (!tile) {
      return 'missing';
    }
    const number = tile.querySelector('.skill-number');
    return number ? txt(number) : '';
  },
  skillMaxed: (index: number): boolean => {
    const tile = qa('app-skill-list app-skill')[index];
    return !!tile && !!tile.querySelector('.skill-maxed-icon');
  },
  skillSelected: (index: number): boolean => {
    const tile = qa('app-skill-list app-skill')[index] as HTMLElement | undefined;
    return !!tile && tile.classList.contains('selected');
  },
  skillIconSrc: (index: number): string => {
    const tile = qa('app-skill-list app-skill')[index];
    const img = tile ? (tile.querySelector('img') as HTMLImageElement | null) : null;
    if (!img) {
      return 'missing';
    }
    const m = String(img.getAttribute('src') || '').match(/skill_icons\/(.+)$/);
    return m ? m[1] : String(img.getAttribute('src') || '');
  },
  skillEditorOpen: (): boolean => !!q('app-skill-list .skill-title'),
  skillEditorTitle: (): string => txt(q('app-skill-list .skill-title')),
  skillEditorVisible: (): boolean => {
    const el = q('app-skill-list .skill-title') as HTMLElement | null;
    return !!el && el.offsetParent !== null;
  },
  skillLevelInput: (): string => {
    const el = q('app-skill-list input.current-level') as HTMLInputElement | null;
    return el ? el.value : 'missing';
  },

  /* ---- talents ---- */
  talentTreeOpen: (): boolean => !!q('app-talent-tree app-card'),
  talentPointsText: (): string => txt(q('app-talent-tree p.text-center')),
  talentCount: (): number => qa('app-talent-tree app-talent').length,
  talentBlocked: (index: number): boolean => {
    const tile = qa('app-talent-tree app-talent')[index];
    if (!tile) {
      return false;
    }
    const img = tile.querySelector('img');
    return !!img && img.classList.contains('opacity-50');
  },
  talentPoints: (index: number): string => {
    const tile = qa('app-talent-tree app-talent')[index];
    if (!tile) {
      return 'missing';
    }
    const span = tile.querySelector('.points');
    return span ? txt(span) : '';
  },
  talentBorder: (index: number): string => {
    const tile = qa('app-talent-tree app-talent')[index] as HTMLElement | undefined;
    if (!tile) {
      return 'missing';
    }
    const m = String(tile.getAttribute('style') || '').match(/talent_border_([a-z0-9]+)\.png/);
    return m ? m[1] : 'none';
  },
  talentResetVisible: (): boolean => !!q('app-talent-tree button'),

  /* ---- character page ---- */
  charNameValue: (): string => {
    const el = q('#name') as HTMLInputElement | null;
    return el ? el.value : 'missing';
  },
  charIndexValue: (): string => {
    const el = q('#saveslot') as HTMLInputElement | null;
    return el ? el.value : 'missing';
  },
  charHardcore: (): boolean => {
    const el = q('#hardcore') as HTMLInputElement | null;
    return !!el && el.checked === true;
  },
  charSoulsEnabled: (): boolean => {
    const el = q('#souls') as HTMLInputElement | null;
    return !!el && el.checked === true;
  },
  soulVisible: (): number => qa('app-character .soul-label').length,
  soulChecked: (soul: number): boolean => {
    const ids: { [k: string]: string } = { '1': '#azeos-soul', '2': '#omoroth-soul', '3': '#scarab-soul' };
    const el = q(ids[String(soul)]) as HTMLInputElement | null;
    return !!el && el.checked === true;
  },
  soulPresent: (soul: number): boolean => {
    const ids: { [k: string]: string } = { '1': '#azeos-soul', '2': '#omoroth-soul', '3': '#scarab-soul' };
    return !!q(ids[String(soul)]);
  },
  soulImg: (soul: number): number => {
    const labels = qa('app-character .soul-label');
    const img = labels[soul - 1] ? (labels[soul - 1].querySelector('img') as HTMLImageElement | null) : null;
    if (!img) {
      return -1;
    }
    const m = String(img.getAttribute('src') || '').match(/_(\d)\.png$/);
    return m ? Number(m[1]) : -1;
  },
  charLabelCount: (): number => qa('app-character label').length,
  charResetVisible: (): boolean => !!q('app-character button'),

  /* ---- export ---- */
  exportCaptured: (): boolean => state.exportText !== null,
  exportLen: (): number => (state.exportText === null ? -1 : state.exportText.length),
  exportHas: (needle: string): boolean =>
    state.exportText !== null && state.exportText.indexOf(needle) >= 0,
  exportName: (): string => (state.exportName === null ? 'none' : state.exportName),

  /* ---- static pages ---- */
  aboutPCount: (): number => qa('app-about p').length,
  aboutPText: (index: number): string => txt(qa('app-about p')[index] || null),
  aboutVersion: (): string => {
    const m = txt(qa('app-about p')[0] || null).match(/([\d.]+)/);
    return m ? m[1] : 'missing';
  },
  aboutLinkHref: (): string => {
    const el = q('app-about a') as HTMLAnchorElement | null;
    return el ? String(el.getAttribute('href') || '') : 'missing';
  },
  helpH1: (): string => txt(q('app-help h1')),
  helpH3Count: (): number => qa('app-help h3').length,
  helpPCount: (): number => qa('app-help p').length,
  helpHas: (needle: string): boolean => txt(q('app-help')).indexOf(needle) >= 0
};

(window as any).__CKSE__ = probe;

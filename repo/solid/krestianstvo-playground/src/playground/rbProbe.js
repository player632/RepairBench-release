/*
INSTRUMENTATION (repair-bench, environment/instrumentation.patch) - the measurement bridge.

WHY THIS EXISTS. The graded observables of this task are what the seed's own worlds render and what its own
reflector transport does. Nothing in the shipped bundle exposes either to a page context, so this file
publishes `window.__KP__`: a flat table of READERS that hand back scalars. It re-implements nothing - every
reading below is taken from the live DOM the seed's own components produced, or from the census the
adaptation's loopback reflector keeps, or from the browser's own performance resource timing. A candidate
fix (or a remaining defect) therefore moves a number rather than having to be inferred.

CONTRACTS THIS FILE HOLDS
 - every reader returns a SCALAR (string | number | boolean | null); `undefined` is converted to `null` at
   the boundary, because an `undefined` result cannot be compared by the runner.
 - no reader mutates application state, writes storage, navigates, or performs I/O. Reading
   `performance.getEntriesByType('resource')` is a read of a buffer the browser already keeps.
 - error / unhandledrejection / console.error are trapped FROM INSTALL TIME, so a boot failure is a number
   and never a silent blank page. A zero below means "nothing failed", never "nothing was listening yet".
 - text readers are whitespace-normalised and length-capped, so a reading is a stable scalar rather than a
   layout-dependent blob.
*/

// The seed's own pure helpers, IMPORTED (never reimplemented) so that a reading below travels through the
// application's real code rather than a copy of it. Objects/Utils.js is the colour/parse module the seed's
// Avatar (Avatar.jsx:148) and CodeMirror cursor decoration (CodeMirror.jsx:125-126) use; Web/Styles.js is
// the class-string factory every button in Objects/Counter.jsx uses; Objects/Fiber/Utils.js picks a geometry
// name for the fiber world. All three are side-effect free at import time.
import { hex2rgb, rgbaString, randomColor, clientRandomColor } from './Objects/Utils';
import Styles from './Web/Styles';
import { randomCostume } from './Objects/Fiber/Utils';

const pageErrors = [];
const pageRejections = [];
const consoleErrors = [];
let trapsInstalled = false;

function installTraps() {
    if (trapsInstalled) return;
    trapsInstalled = true;
    window.addEventListener('error', (event) => {
        pageErrors.push(String((event && (event.message || (event.error && event.error.message))) || 'error'));
    });
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event && event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        pageRejections.push(message || 'rejection');
    });
    const realError = console.error.bind(console);
    console.error = (...args) => {
        consoleErrors.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '));
        realError(...args);
    };
}

const nul = (value) => (value === undefined ? null : value);
const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const cap = (s, n = 400) => (String(s == null ? '' : s).length > n ? String(s).slice(0, n) : String(s == null ? '' : s));
const countOf = (selector) => document.querySelectorAll(selector).length;
const textOf = (selector) => {
    const el = document.querySelector(selector);
    return el ? cap(norm(el.textContent)) : null;
};

// ---------------------------------------------------------------- error surface
const errorCount = () => pageErrors.length;
const errorDetail = (index) => nul(cap(pageErrors[index], 300));
const rejectionCount = () => pageRejections.length;
const rejectionDetail = (index) => nul(cap(pageRejections[index], 300));
const consoleErrorCount = () => consoleErrors.length;
const consoleErrorDetail = (index) => nul(cap(consoleErrors[index], 300));

// ---------------------------------------------------------------- transport census (the adaptation's loopback reflector)
// Read, never driven: rbReflector.js keeps these counters itself. `realSockets` is the one that matters for
// the zero-egress claim - it counts sockets the shim handed to the NATIVE WebSocket constructor, which the
// shim never does, so a non-zero value here would mean the adaptation is leaking.
const loopbackInstalled = () => !!(globalThis.__rbLoopback && globalThis.__rbLoopback.installed);
const lbStat = (key) => {
    const s = globalThis.__rbLoopback && globalThis.__rbLoopback.stats;
    return s && typeof s[key] === 'number' ? s[key] : null;
};
const lbSockets = () => lbStat('sockets');
const lbOpens = () => lbStat('opens');
const lbCloses = () => lbStat('closes');
const lbTicks = () => lbStat('ticks');
const lbBootstrap = () => lbStat('bootstrap');
const lbClientSends = () => lbStat('clientSends');
const lbEchoes = () => lbStat('echoes');
const lbRealSockets = () => lbStat('realSockets');
const lbTickMs = () => (globalThis.__rbLoopback ? nul(globalThis.__rbLoopback.TICK_MS) : null);
const lbTickStep = () => (globalThis.__rbLoopback ? nul(globalThis.__rbLoopback.TICK_STEP) : null);
const lbTransport = () => (globalThis.__rbLoopback ? nul(norm(globalThis.__rbLoopback.transport)) : null);
const lbSocketUrls = (index) => {
    const list = (globalThis.__rbLoopback && globalThis.__rbLoopback.sockets) || [];
    return nul(cap(list[index] && list[index].url, 300));
};

// ---------------------------------------------------------------- zero-egress surface
// The browser's own resource timing buffer: it records EVERY subresource the document fetched, including
// iframe navigations, scripts, stylesheets, fonts, images and media, so it is the honest census for "did
// this face reach the network". Same-origin entries are the site's own chunks.
const resourceEntries = () => performance.getEntriesByType('resource') || [];
const isExternal = (name) => {
    try { return new URL(name).origin !== window.location.origin; } catch (e) { return true; }
};
const resourceEntryCount = () => resourceEntries().length;
const externalRequestCount = () => resourceEntries().filter((e) => isExternal(e.name)).length;
const requestCountFor = (fragment) => resourceEntries().filter((e) => String(e.name).includes(fragment)).length;
const externalRequestNames = () => {
    const names = resourceEntries().filter((e) => isExternal(e.name)).map((e) => e.name);
    return names.length ? cap([...new Set(names)].sort().join(' | '), 400) : null;
};
const resourceName = (index) => nul(cap(resourceEntries()[index] && resourceEntries()[index].name, 300));
const insecureSchemeCount = () => resourceEntries().filter((e) => /^(https?|wss?):/.test(String(e.name))).length;

// ---------------------------------------------------------------- document / DOM inventory
const titleText = () => nul(cap(norm(document.title)));
const documentLang = () => nul(document.documentElement.getAttribute('lang'));
const rootPresent = () => document.getElementById('root') !== null;
const rootChildCount = () => {
    const el = document.getElementById('root');
    return el ? el.children.length : null;
};
const bodyTextLen = () => (document.body ? document.body.innerText.length : null);
const bodyTextHead = () => (document.body ? cap(norm(document.body.innerText), 400) : null);
const preCount = () => countOf('pre');
const preText = (index) => {
    const list = document.querySelectorAll('pre');
    return nul(cap(norm(list[index] && list[index].textContent)));
};
const preAllText = () => cap([...document.querySelectorAll('pre')].map((e) => norm(e.textContent)).join(' | '), 400);
// The first <pre> whose normalised text starts with `label` - how Worlds/Simple.jsx renders Tick:/Count:/Color:
// and how Objects/Info.jsx renders Virtual Time:. Returns null when the label is absent, which is itself a
// reading (the panel never mounted) rather than an error.
const labeledText = (label) => {
    const hit = [...document.querySelectorAll('pre')].find((e) => norm(e.textContent).startsWith(label));
    return hit ? cap(norm(hit.textContent)) : null;
};
const labeledValue = (label) => {
    const t = labeledText(label);
    if (t === null) return null;
    const rest = norm(t.slice(label.length)).trim();
    return cap(rest, 120);
};
const labeledNumber = (label) => {
    const v = labeledValue(label);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};
const hasLabeled = (label) => labeledText(label) !== null;
const iframeCount = () => countOf('iframe');
const iframeSrc = (index) => {
    const list = document.querySelectorAll('iframe');
    return nul(cap(list[index] && list[index].getAttribute('src'), 300));
};
const iframeExternalCount = () => [...document.querySelectorAll('iframe')].filter((e) => {
    const src = e.getAttribute('src') || '';
    return /^https?:/.test(src) && isExternal(src);
}).length;
const sameOriginIframeCount = () => [...document.querySelectorAll('iframe')].filter((e) => {
    const src = e.getAttribute('src') || '';
    return src.startsWith('/');
}).length;
const externalScriptCount = () => [...document.querySelectorAll('script[src]')].filter((e) => /^https?:/.test(e.getAttribute('src') || '')).length;
const linkCount = () => countOf('a');
const buttonCount = () => countOf('button');
const inputCount = () => countOf('input');
const canvasCount = () => countOf('canvas');
const videoCount = () => countOf('video');
const imgCount = () => countOf('img');
const strongCount = () => countOf('strong');
const strongText = (index) => {
    const list = document.querySelectorAll('strong');
    return nul(cap(norm(list[index] && list[index].textContent)));
};
const buttonText = (index) => {
    const list = document.querySelectorAll('button');
    return nul(cap(norm(list[index] && list[index].textContent)));
};
const buttonLabels = () => cap([...document.querySelectorAll('button')].map((e) => norm(e.textContent)).filter(Boolean).join(' | '), 400);
const inputValue = (index) => {
    const list = document.querySelectorAll('input');
    const el = list[index];
    return el ? nul(cap(String(el.value == null ? '' : el.value), 200)) : null;
};
const inputChecked = (index) => {
    const list = document.querySelectorAll('input');
    return list[index] ? !!list[index].checked : null;
};
const inputPlaceholder = (index) => {
    const list = document.querySelectorAll('input');
    return nul(list[index] && list[index].getAttribute('placeholder'));
};

// ---------------------------------------------------------------- route face
const locationPathname = () => nul(norm(window.location.pathname));
const locationSearch = () => nul(norm(window.location.search));
const searchParam = (key) => nul(cap(new URLSearchParams(window.location.search).get(key), 200));
// Web/World.jsx:24 only calls generateURL() - which does a history.replaceState with a cuid2 inside a
// setTimeout, so the URL would not be reproducible - when neither props.seloID nor ?k= is present. Pinning
// this is what makes "every navigation carried an explicit ?k=" provable rather than assumed.
const urlHasExplicitK = () => new URLSearchParams(window.location.search).has('k');
const urlKeyIsReproducible = () => {
    const k = new URLSearchParams(window.location.search).get('k');
    return k ? /^[A-Za-z0-9_-]+$/.test(k) : false;
};

// ---------------------------------------------------------------- world faces
// /simple - Worlds/Simple.jsx renders exactly three <pre> lines and inc() renews itself through the
// reflector, so these are the §1.8.6 state-evolution readings.
const simpleTickText = () => labeledValue('Tick:');
const simpleTickNumber = () => labeledNumber('Tick:');
const simpleCountText = () => labeledValue('Count:');
const simpleCountNumber = () => labeledNumber('Count:');
const simpleColorText = () => labeledValue('Color:');
// The colour is derived from the per-selo Alea PRNG, which krestianstvo seeds with `+new Date` INSIDE the
// library, so its value is not pinnable from this side of the module boundary. Its SHAPE is: assert the
// format, never the value.
const simpleColorIsHex = () => {
    const v = simpleColorText();
    return v === null ? null : /^#[0-9a-fA-F]{6}$/.test(v);
};
const simpleBackgroundStyle = () => {
    const el = document.querySelector('div[style*="background"]');
    return nul(cap(el && el.getAttribute('style'), 200));
};
// Objects/Info.jsx (rendered as <SeloInfo> by the worlds that opt into props.info)
const seloInfoWorld = () => {
    const hit = [...document.querySelectorAll('pre')].map((e) => norm(e.textContent)).find((t) => /World:/.test(t));
    if (!hit) return null;
    const m = /World:\s*(.*?)(?:ID:|$)/.exec(hit);
    return nul(cap(m ? m[1].trim() : '', 120));
};
const seloInfoId = () => {
    const hit = [...document.querySelectorAll('pre')].map((e) => norm(e.textContent)).find((t) => /ID:/.test(t));
    if (!hit) return null;
    const m = /ID:\s*(.*?)(?:Reflector:|$)/.exec(hit);
    return nul(cap(m ? m[1].trim() : '', 120));
};
const seloInfoReflector = () => {
    const hit = [...document.querySelectorAll('pre')].map((e) => norm(e.textContent)).find((t) => /Reflector:/.test(t));
    if (!hit) return null;
    const m = /Reflector:\s*(\S*)/.exec(hit);
    return nul(cap(m ? m[1] : '', 200));
};
const seloInfoVirtualTime = () => labeledValue('Virtual Time:');
const seloInfoVirtualTimeNumber = () => labeledNumber('Virtual Time:');
const seloInfoHasVirtualTime = () => hasLabeled('Virtual Time:');
const seloInfoHasClients = () => hasLabeled('Clients:');
const seloInfoDebugDeep = () => labeledValue('Deep:');
// Objects/Info.jsx:45-48 renders <pre><strong>Debug</strong><br>Deep: {props.deep} </pre>, so the normalised
// text STARTS with "Debug" and labeledValue('Deep:') can never match it (KP1 measured null). Bound at the
// label instead.
const debugDeepValue = () => {
    const hit = [...document.querySelectorAll('pre')].map((e) => norm(e.textContent)).find((t) => /Deep:/.test(t));
    if (!hit) return null;
    const m = /Deep:\s*(\S*)/.exec(hit);
    return nul(cap(m ? m[1] : '', 60));
};
const debugBlockPresent = () => [...document.querySelectorAll('pre')].some((e) => /Debug/.test(norm(e.textContent)));
// Worlds/Simple.jsx inc() writes tick from the selo's virtual time and count as its own +1 accumulator on the
// SAME self-renewing future(), so the two lines advance in lockstep: |count - tick| stays within one step.
// This is a RELATION, not a clock value, which is what makes it assertable at all - the absolute tick is
// whatever the reflector's virtual time reached (KP1 measured 115.0 / 115 after a 14 s sample).
const simpleCountTracksTick = () => {
    const c = simpleCountNumber();
    const t = simpleTickNumber();
    if (c === null || t === null) return null;
    return Math.abs(c - t) <= 1;
};
const simpleCountIsPositive = () => {
    const c = simpleCountNumber();
    return c === null ? null : c > 0;
};
// Objects/Counter.jsx:104 <Switch fallback={<div>Not Found</div>}> - the fallback text is the direct reading
// of "neither Match arm fired".
const switchFallbackTextPresent = () => [...document.querySelectorAll('div')].some((e) => norm(e.textContent) === 'Not Found');
// /settings - Web/Settings.jsx has NO <Selo>: it is purely local, which makes it the control face for
// "does this reading need the reflector at all".
const settingsHeading = () => textOf('p[text-7]');
const settingsReflectorLabel = () => {
    const hit = [...document.querySelectorAll('div')].map((e) => norm(e.textContent)).find((t) => t === 'Default reflector host:');
    return hit ? cap(hit) : null;
};
const settingsInputCount = () => countOf('input');
const settingsUpdateButtonPresent = () => [...document.querySelectorAll('button')].some((e) => norm(e.textContent) === 'Update');

// ---------------------------------------------------------------- seed-own pure helpers
// Read THROUGH the seed's own exported functions. `hex2rgb` + `rgbaString` are exactly what
// Objects/CodeMirror.jsx:125-126 composes for a remote-cursor decoration, and `randomColor` is exactly what
// Objects/Avatar.jsx:148 calls. The argument supplied here is deterministic test input (a constant PRNG),
// which is what turns a coin flip into a stable scalar; the logic under test stays the seed's own.
const hex2rgbChannel = (hex, channel) => {
    const c = hex2rgb(hex);
    return c && c[channel] !== undefined ? nul(Number(c[channel])) : null;
};
const hex2rgbTriple = (hex) => {
    const c = hex2rgb(hex);
    return c ? cap([c.r, c.g, c.b].join(',')) : null;
};
const rgbaStringProbe = (r, g, b, a) => nul(cap(rgbaString({ r, g, b, a }), 200));
// The composition CodeMirror.jsx:125-126 performs: parse the hex, attach the alpha the CALLER supplies, then
// format. One reading therefore crosses both helpers and the caller's override, which is what lets a
// callee-default defect and a caller-override defect be told apart on the same assert index.
const cursorCssProbe = (hex, a) => nul(cap(rgbaString(Object.assign(hex2rgb(hex), { a })), 200));
const prngOf = (p) => ({ random: () => p });
const randomColorProbe = (p) => nul(cap(randomColor(prngOf(p)), 40));
const randomColorLengthProbe = (p) => {
    const c = randomColor(prngOf(p));
    return typeof c === 'string' ? c.length : null;
};
const randomColorIsHexProbe = (p) => {
    const c = randomColor(prngOf(p));
    return typeof c === 'string' ? /^#[0-9A-Fa-f]{6}$/.test(c) : null;
};
const clientRandomColorLength = () => {
    const c = clientRandomColor();
    return typeof c === 'string' ? c.length : null;
};
const clientRandomColorIsHex = () => {
    const c = clientRandomColor();
    return typeof c === 'string' ? /^#[0-9A-Fa-f]{6}$/.test(c) : null;
};
const styleClassProbe = (name) => (typeof Styles[name] === 'function' ? nul(cap(Styles[name](), 300)) : null);
const styleFactoryCount = () => Object.keys(Styles).length;
// Objects/Fiber/Utils.js randomCostume(props, setLocal) chooses a geometry NAME from a fixed list with the
// selo PRNG and writes it through setLocal. Both arguments are supplied as test doubles so the choice the
// seed's own code makes becomes readable; the list itself is never copied into this file.
const fiberCostumeProbe = (p) => {
    let captured = null;
    randomCostume({ selo: { random: () => p } }, (...args) => { captured = args[args.length - 1]; });
    return nul(cap(captured, 120));
};

// ---------------------------------------------------------------- Counter face (/counter, and the <Counter> the demo worlds embed)
// Objects/Counter.jsx renders the name in <div class="text-3xl fw400"> and the count in
// <div class="p-4 text-3xl fw200 flex">, styles -/+ with Web/Styles.js buttonGrey(), and picks Start vs Stop
// with a <Switch> on properties.ticking.
const counterNameText = () => textOf('div.text-3xl.fw400');
const counterCountText = () => textOf('div.fw200');
const counterCountNumber = () => {
    const t = counterCountText();
    if (t === null) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
};
const buttonClassByLabel = (label) => {
    const hit = [...document.querySelectorAll('button')].find((e) => norm(e.textContent) === label);
    return hit ? nul(cap(hit.getAttribute('class'), 300)) : null;
};
const counterMinusClass = () => buttonClassByLabel('-');
const counterPlusClass = () => buttonClassByLabel('+');
const counterTickingLabel = () => {
    const hit = [...document.querySelectorAll('button')].map((e) => norm(e.textContent)).find((t) => t === 'Start' || t === 'Stop');
    return hit ? cap(hit) : null;
};
const counterHasTickingButton = () => counterTickingLabel() !== null;
const counterNameIsFallbackShape = () => {
    const t = counterNameText();
    return t === null ? null : /^[A-Za-z][A-Za-z0-9_-]*$/.test(t);
};

// ---------------------------------------------------------------- persisted config (/settings observable)
// krestianstvo's initGlobalConfig() keeps the whole config in localStorage under "krestianstvo" and
// rehydrates from it on boot, so the settings form has a durable, purely local observable that needs no
// reflector at all. READ ONLY - nothing here writes storage, and the runner clears it between faces.
const CONFIG_KEY = 'krestianstvo';
const storedConfigRaw = () => nul(cap(localStorage.getItem(CONFIG_KEY), 400));
const storedConfigParsed = () => {
    try {
        const raw = localStorage.getItem(CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
};
const storedConfigValue = (key) => {
    const c = storedConfigParsed();
    if (!c || !(key in c)) return null;
    const v = c[key];
    return v !== null && typeof v === 'object' ? nul(cap(JSON.stringify(v), 200)) : nul(v);
};
const storedConfigHasKey = (key) => {
    const c = storedConfigParsed();
    return c ? key in c : null;
};
const storedConfigKeyCount = () => {
    const c = storedConfigParsed();
    return c ? Object.keys(c).length : null;
};
// §1.8.7 state-isolation residue: the WHOLE localStorage surface, not just the config key. A fix that
// smuggles state through storage (or a hardcoded flag parked in a global) shows up here as a key nobody
// asked for. Read only - this bridge never writes storage.
const localStorageKeyCount = () => localStorage.length;
const localStorageKeyAt = (index) => nul(cap(localStorage.key(index), 200));
const localStorageAllKeys = () => cap([...Array(localStorage.length).keys()].map((i) => localStorage.key(i)).sort().join(' | '), 300) || null;
const localStorageHasOnlyConfigKey = () => {
    const keys = [...Array(localStorage.length).keys()].map((i) => localStorage.key(i));
    return keys.every((k) => k === CONFIG_KEY);
};
const sessionStorageKeyCount = () => sessionStorage.length;
const globalResidueCount = () => Object.keys(window).filter((k) => /^__rb|^__KP__/.test(k)).length;
const globalResidueNames = () => cap(Object.keys(window).filter((k) => /^__rb|^__KP__/.test(k)).sort().join(' | '), 200) || null;
const settingsInputValueNow = () => {
    const el = document.querySelector('input[size]');
    return el ? nul(cap(String(el.value == null ? '' : el.value), 200)) : null;
};
const settingsInputSize = () => {
    const el = document.querySelector('input[size]');
    return el ? nul(Number(el.getAttribute('size'))) : null;
};
const settingsDevModeChecked = () => {
    const el = document.querySelector('input[type="checkbox"]');
    return el ? !!el.checked : null;
};

// ---------------------------------------------------------------- Selo link (Objects/Info.jsx:14 createLinkForSelo)
const linkHref = (index) => {
    const list = document.querySelectorAll('a');
    return nul(cap(list[index] && list[index].getAttribute('href'), 300));
};
const linkHrefContaining = (fragment) => {
    const hit = [...document.querySelectorAll('a')].map((e) => e.getAttribute('href') || '').find((h) => h.includes(fragment));
    return hit ? nul(cap(hit, 300)) : null;
};
const countLinkHrefContaining = (fragment) =>
    [...document.querySelectorAll('a')].filter((e) => String(e.getAttribute('href') || '').includes(fragment)).length;
const seloLinkHref = () => linkHrefContaining('?k=');
const seloLinkHasFlag = (flag) => {
    const h = seloLinkHref();
    return h === null ? null : h.includes(flag);
};
const seloLinkHasR = () => seloLinkHasFlag('&r=');
const seloLinkHasD = () => seloLinkHasFlag('&d=');
const seloLinkHasP = () => seloLinkHasFlag('&p=');
const seloLinkPathname = () => {
    const h = seloLinkHref();
    if (h === null) return null;
    try { return nul(cap(new URL(h).pathname, 120)); } catch (e) { return nul(cap(h, 120)); }
};

// ---------------------------------------------------------------- generic DOM reading
const textBySelector = (selector) => textOf(selector);
const countBySelector = (selector) => countOf(selector);
const attrBySelector = (selector, attr) => {
    const el = document.querySelector(selector);
    return el ? nul(cap(el.getAttribute(attr), 300)) : null;
};
const textOfNth = (selector, index) => {
    const list = document.querySelectorAll(selector);
    return list[index] ? nul(cap(norm(list[index].textContent))) : null;
};

const bridge = {
    // error surface
    errorCount, errorDetail, rejectionCount, rejectionDetail, consoleErrorCount, consoleErrorDetail,
    // transport census
    loopbackInstalled, lbSockets, lbOpens, lbCloses, lbTicks, lbBootstrap, lbClientSends, lbEchoes,
    lbRealSockets, lbTickMs, lbTickStep, lbTransport, lbSocketUrls, lbStat,
    // zero egress
    resourceEntryCount, externalRequestCount, requestCountFor, externalRequestNames, resourceName,
    insecureSchemeCount,
    // document / DOM inventory
    titleText, documentLang, rootPresent, rootChildCount, bodyTextLen, bodyTextHead,
    preCount, preText, preAllText, labeledText, labeledValue, labeledNumber, hasLabeled,
    iframeCount, iframeSrc, iframeExternalCount, sameOriginIframeCount, externalScriptCount,
    linkCount, buttonCount, inputCount, canvasCount, videoCount, imgCount,
    strongCount, strongText, buttonText, buttonLabels, inputValue, inputChecked, inputPlaceholder,
    // route face
    locationPathname, locationSearch, searchParam, urlHasExplicitK, urlKeyIsReproducible,
    // world faces
    simpleTickText, simpleTickNumber, simpleCountText, simpleCountNumber, simpleColorText,
    simpleColorIsHex, simpleBackgroundStyle,
    seloInfoWorld, seloInfoId, seloInfoReflector, seloInfoVirtualTime, seloInfoVirtualTimeNumber,
    seloInfoHasVirtualTime, seloInfoHasClients, seloInfoDebugDeep, debugDeepValue, debugBlockPresent,
    simpleCountTracksTick, simpleCountIsPositive, switchFallbackTextPresent,
    settingsHeading, settingsReflectorLabel, settingsInputCount, settingsUpdateButtonPresent,
    settingsInputValueNow, settingsInputSize, settingsDevModeChecked,
    // persisted config (localStorage "krestianstvo", written by initGlobalConfig)
    storedConfigRaw, storedConfigValue, storedConfigHasKey, storedConfigKeyCount,
    localStorageKeyCount, localStorageKeyAt, localStorageAllKeys, localStorageHasOnlyConfigKey,
    sessionStorageKeyCount, globalResidueCount, globalResidueNames,
    // seed-own pure helpers, imported not reimplemented
    hex2rgbChannel, hex2rgbTriple, rgbaStringProbe, cursorCssProbe,
    randomColorProbe, randomColorLengthProbe, randomColorIsHexProbe,
    clientRandomColorLength, clientRandomColorIsHex,
    styleClassProbe, styleFactoryCount, fiberCostumeProbe,
    // Counter face
    counterNameText, counterCountText, counterCountNumber, counterMinusClass, counterPlusClass,
    counterTickingLabel, counterHasTickingButton, counterNameIsFallbackShape, buttonClassByLabel,
    // Selo link (createLinkForSelo)
    linkHref, linkHrefContaining, countLinkHrefContaining, seloLinkHref,
    seloLinkHasR, seloLinkHasD, seloLinkHasP, seloLinkPathname,
    // generic DOM reading
    textBySelector, countBySelector, attrBySelector, textOfNth,
    // harness self-report
    probeInstalled: () => true,
    readerCount: () => Object.keys(bridge).length,
};

let probeInstalled = false;

/** Publishes `window.__KP__`. Idempotent, and a no-op outside a browser context. */
export function installRbProbe() {
    if (probeInstalled) return true;
    if (typeof window === 'undefined') return false;
    probeInstalled = true;
    installTraps();
    window.__KP__ = bridge;
    return true;
}

export function rbProbeInstalled() {
    return probeInstalled;
}

export default installRbProbe;

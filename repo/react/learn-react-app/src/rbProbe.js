// Strictly READ-ONLY observation bridge for the WLB repair-bench verifier.
//
// Contract this file obeys, line by line:
//   * it never writes to localStorage / sessionStorage / cookies / indexedDB,
//   * it never mutates a DOM node (no classList / style / innerText / attribute write, no event
//     dispatch, no focus(), no scroll),
//   * it never calls into application code and never imports an application module,
//   * it publishes EXACTLY ONE global, `window.__rb`, and it publishes it at most once,
//   * every reader is FAIL-CLOSED: a missing host yields a sentinel STRING ('__NOEL__', '__NONE__',
//     '__EMPTY__') and a throw is converted into '__ERR__:<message>' by the caller's wrapper, so a red
//     checkpoint always reads as a difference of scalar VALUES and never as an exception.
//
//
// media quantity. The one checkpoint in this package whose observable is a scroll offset (F05) does NOT
// read it through this bridge: the R22-2 latch sampler lives in that checkpoint's `setup` and the assert
// reads only the latched booleans `window.__L['F05'].armed` / `.hit`.
//
// This file is plain .js on purpose: tsconfig.json sets allowJs:true with NO checkJs, so .js/.jsx are
// outside fork-ts-checker's scope, and `strict:true` therefore cannot reject a probe reader.
var NOEL = '__NOEL__';
var NONE = '__NONE__';
var EMPTY = '__EMPTY__';

function q(sel) { return document.querySelector(sel); }
function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
function byId(id) { return document.getElementById(id); }
function testid(id) { return q('[data-testid="' + id + '"]'); }
function norm(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : NOEL; }
function inHost(hostId, sel) {
    var h = testid(hostId);
    if (!h) { return []; }
    return Array.prototype.slice.call(h.querySelectorAll(sel));
}
function hostText(hostId, sel) {
    var h = testid(hostId);
    if (!h) { return NOEL; }
    var el = sel ? h.querySelector(sel) : h;
    return norm(el);
}
function attrOf(el, name) { return el ? String(el.getAttribute(name) || EMPTY) : NOEL; }

var build = function () {
    return {
        boot: {
            // The app is up when #root has a React child AND one of the two page-family anchors exists:
            // AppShell's title cell (every /tutorial/* route) or Home's title cell (every other route).
            ready: function () {
                var root = byId('root');
                if (!root || root.childElementCount < 1) { return false; }
                return !!(testid('appbar-title') || testid('home-title'));
            },
            rootKids: function () { var r = byId('root'); return r ? r.childElementCount : -1; },
            docTitle: function () { return String(document.title || EMPTY); },
            rev: function () { return 'lra-rbprobe-1'; },
            // package.json carries NO "homepage" key, so CRA 3 emits ABSOLUTE asset URLs (/static/...).
            // This reader is the static-package shape sentinel (P17).
            staticPrefixOk: function () {
                var els = qa('script[src]').concat(qa('link[href]'));
                if (!els.length) { return false; }
                for (var i = 0; i < els.length; i++) {
                    var u = String(els[i].getAttribute('src') || els[i].getAttribute('href') || EMPTY);
                    if (u.indexOf('/static/') !== 0) { return false; }
                }
                return true;
            },
            scriptCount: function () { return qa('script[src]').length; },
            // public/Learn_React_App.gif is 14.6 MB and is referenced by README.md ONLY, so it is copied
            // into build/ by CRA but must never be fetched by a page load.
            gifFetched: function () {
                var es = [];
                try { es = performance.getEntriesByType('resource') || []; } catch (e) { es = []; }
                for (var i = 0; i < es.length; i++) {
                    if (String(es[i].name || '').indexOf('Learn_React_App.gif') >= 0) { return true; }
                }
                return false;
            }
        },
        globals: {
            rbKeys: function () {
                var out = [];
                for (var k in window) {
                    if (Object.prototype.hasOwnProperty.call(window, k) && k.indexOf('__rb') === 0) { out.push(k); }
                }
                out.sort();
                return out.length ? out.join('|') : NONE;
            },
            storageKeys: function () {
                var out = [];
                var ls = null;
                var ss = null;
                try { ls = localStorage; } catch (e) { ls = null; }
                try { ss = sessionStorage; } catch (e) { ss = null; }
                if (ls) { for (var i = 0; i < ls.length; i++) { out.push('L:' + ls.key(i)); } }
                if (ss) { for (var j = 0; j < ss.length; j++) { out.push('S:' + ss.key(j)); } }
                out.sort();
                return out.length ? out.join('|') : EMPTY;
            }
        },
        net: {
            resourceCount: function () {
                var es = [];
                try { es = performance.getEntriesByType('resource') || []; } catch (e) { es = []; }
                return es.length;
            },
            externalCount: function () {
                var es = [];
                try { es = performance.getEntriesByType('resource') || []; } catch (e) { es = []; }
                var origin = String(window.location.origin || '');
                var n = 0;
                for (var i = 0; i < es.length; i++) {
                    if (String(es[i].name || '').indexOf(origin) !== 0) { n++; }
                }
                return n;
            }
        },
        loc: {
            path: function () { return String(window.location.pathname || EMPTY); },
            search: function () { return String(window.location.search || EMPTY); }
        },
        // AppShell layer: MUI v3 AppBar + a temporary Drawer rendered through a portal into document.body.
        shell: {
            title: function () { return hostText('appbar-title'); },
            menuLabel: function () { return attrOf(testid('appbar-menu'), 'aria-label'); },
            menuExists: function () { return !!testid('appbar-menu'); },
            homeHref: function () { return attrOf(testid('appbar-home-link'), 'href'); },
            // MUI v3 Drawer defaults to variant="temporary" with keepMounted unset, so a CLOSED drawer has
            // no paper in the DOM at all: the reader returns 0 rather than a sentinel, which keeps the
            // "drawer never opens" defect (D03) a scalar difference and not a missing element.
            drawerItems: function () { return inHost('drawer-list', 'a').length; },
            drawerLabels: function () {
                var as = inHost('drawer-list', 'a');
                if (!as.length) { return NONE; }
                return as.map(function (a) { return norm(a); }).join('|');
            },
            drawerHrefs: function () {
                var as = inHost('drawer-list', 'a');
                if (!as.length) { return NONE; }
                return as.map(function (a) { return attrOf(a, 'href'); }).join('|');
            }
        },
        // Bottom navigation (TutorialNavigation.jsx): three 33% cells, prev/home/next.
        nav: {
            linkCount: function () { return inHost('nav-root', 'a').length; },
            prevHref: function () { return attrOf(testid('nav-prev-link'), 'href'); },
            prevText: function () { return norm(testid('nav-prev-link')); },
            homeHref: function () { return attrOf(testid('nav-home-link'), 'href'); },
            homeText: function () { return norm(testid('nav-home-link')); },
            nextHref: function () { return attrOf(testid('nav-next-link'), 'href'); },
            nextText: function () { return norm(testid('nav-next-link')); }
        },
        home: {
            title: function () { return hostText('home-title'); },
            linkCount: function () { return inHost('home-list', 'a').length; },
            labels: function () {
                var as = inHost('home-list', 'a');
                if (!as.length) { return NONE; }
                return as.map(function (a) { return norm(a); }).join('|');
            },
            firstLabel: function () {
                var as = inHost('home-list', 'a');
                return as.length ? norm(as[0]) : NONE;
            },
            hrefs: function () {
                var as = inHost('home-list', 'a');
                if (!as.length) { return NONE; }
                return as.map(function (a) { return attrOf(a, 'href'); }).join('|');
            },
            allHrefsAreTutorial: function () {
                var as = inHost('home-list', 'a');
                if (!as.length) { return false; }
                for (var i = 0; i < as.length; i++) {
                    if (attrOf(as[i], 'href').indexOf('/tutorial/') !== 0) { return false; }
                }
                return true;
            },
            hasLinkTo: function (route) {
                var as = inHost('home-list', 'a');
                for (var i = 0; i < as.length; i++) {
                    if (attrOf(as[i], 'href') === String(route)) { return true; }
                }
                return false;
            }
        },
        // Markdown layer (Markdown.jsx renders into [data-testid="md-root"]; the dynamically imported
        // src/tutorial/build/*.js modules are what make this layer non-empty at all - BLOCKER-2).
        md: {
            rootExists: function () { return !!testid('md-root'); },
            paragraphs: function () { return inHost('md-root', 'p').length; },
            paragraphsGte: function (n) { return inHost('md-root', 'p').length >= Number(n); },
            headings: function () { return inHost('md-root', 'h1,h2,h3,h4,h5,h6').length; },
            codeCount: function () { return inHost('md-root', 'code').length; },
            linkCount: function () { return inHost('md-root', 'a').length; },
            bodyHasText: function (s) { return hostText('md-root').indexOf(String(s)) >= 0; },
            internalLinkTargets: function () {
                var as = inHost('md-root', 'a[href^="/tutorial/"]');
                if (!as.length) { return NONE; }
                return as.map(function (a) { return attrOf(a, 'target'); }).join('|');
            },
            internalLinkHrefs: function () {
                var as = inHost('md-root', 'a[href^="/tutorial/"]');
                if (!as.length) { return NONE; }
                return as.map(function (a) { return attrOf(a, 'href'); }).join('|');
            },
            externalLinkTargets: function () {
                var as = inHost('md-root', 'a[href^="http"]');
                if (!as.length) { return NONE; }
                return as.map(function (a) { return attrOf(a, 'target'); }).join('|');
            },
            codeFound: function (marker) {
                var codes = inHost('md-root', 'code');
                for (var i = 0; i < codes.length; i++) {
                    if (String(codes[i].textContent || '').indexOf(String(marker)) >= 0) { return true; }
                }
                return false;
            },
            codeCountWithText: function (marker) {
                var codes = inHost('md-root', 'code');
                var n = 0;
                for (var i = 0; i < codes.length; i++) {
                    if (String(codes[i].textContent || '').indexOf(String(marker)) >= 0) { n++; }
                }
                return n;
            },
            // D07's observable. CodeBlock.js registers js/xml/html; 'jsx' was NEVER registered, so the
            // only fences whose highlighting can be lost are the ```html ones. -1 means "the fence's code
            // element was not found at all", which is a different reading from 0 highlighted descendants.
            hljsInCode: function (marker) {
                var codes = inHost('md-root', 'code');
                var host = null;
                for (var i = 0; i < codes.length; i++) {
                    if (String(codes[i].textContent || '').indexOf(String(marker)) >= 0) { host = codes[i]; break; }
                }
                if (!host) { return -1; }
                var all = Array.prototype.slice.call(host.querySelectorAll('*'));
                var n = 0;
                for (var j = 0; j < all.length; j++) {
                    var c = String(all[j].getAttribute('class') || '');
                    if (/(^|\s)hljs-/.test(c)) { n++; }
                }
                return n;
            }
        },
        // Exercise layer: two 50% panes per exercise, left = the student's stub, right = the worked
        // solution. Both panes are on the page at once, so EVERY reader here is pane-scoped.
        ex: {
            paneCount: function () { return qa('[data-testid^="exercise-pane-"]').length; },
            paneExists: function (hostId) { return !!testid(hostId); },
            titleYours: function () { return hostText('exercise-title-yours'); },
            titleTarget: function () { return hostText('exercise-title-target'); },
            paneText: function (hostId) { return hostText(hostId); },
            paneHasText: function (hostId, s) { return hostText(hostId).indexOf(String(s)) >= 0; },
            paneTextLength: function (hostId) { var t = hostText(hostId); return t === NOEL ? -1 : t.length; },
            testidTextIn: function (hostId, id) {
                var h = testid(hostId);
                if (!h) { return NOEL; }
                return norm(h.querySelector('[data-testid="' + id + '"]'));
            },
            testidCountIn: function (hostId, id) {
                var h = testid(hostId);
                if (!h) { return -1; }
                return h.querySelectorAll('[data-testid="' + id + '"]').length;
            },
            // The Counter (exercise 05) is three sibling divs: '-', the value, '+'. Read structurally so
            // the LEFT pane - which instrumentation deliberately does not touch, because the student stub
            // is decoy territory - is readable with the same reader as the right pane.
            counterIn: function (hostId) {
                var h = testid(hostId);
                if (!h) { return NOEL; }
                var all = Array.prototype.slice.call(h.querySelectorAll('div'));
                for (var i = 0; i < all.length; i++) {
                    var kids = all[i].children;
                    if (kids.length !== 3) { continue; }
                    if (norm(kids[0]) === '-' && norm(kids[2]) === '+') { return norm(kids[1]); }
                }
                return NONE;
            },
            // The Card (exercise 08) is three render-prop slots, tagged cc-block-1..3 by instrumentation
            // so the reading is by DOM identity and never by the text that is under test.
            ccBlocksIn: function (hostId) {
                var h = testid(hostId);
                if (!h) { return NOEL; }
                var out = [];
                for (var i = 1; i <= 3; i++) {
                    var el = h.querySelector('[data-testid="cc-block-' + i + '"]');
                    if (!el) { return NONE; }
                    out.push(norm(el));
                }
                return out.join('|');
            }
        },
        // Capstone layer: the same Search/CompanyProfile/CompanyFinancial triple exists on BOTH panes
        // (student stubs on the left, worked solution on the right), so every reader takes a pane host.
        cap: {
            inputValueIn: function (hostId) {
                var h = testid(hostId);
                if (!h) { return NOEL; }
                var el = h.querySelector('[data-testid="cap-search-input"]');
                return el ? String(el.value || EMPTY) : NONE;
            },
            searchBtnIn: function (hostId) {
                var h = testid(hostId);
                if (!h) { return NOEL; }
                return norm(h.querySelector('[data-testid="cap-search-btn"]'));
            },
            finRowsIn: function (hostId) {
                var h = testid(hostId);
                return h ? h.querySelectorAll('[data-testid="cap-fin-row"]').length : -1;
            },
            finKeysIn: function (hostId) {
                var rows = inHost(hostId, '[data-testid="cap-fin-row"]');
                if (!rows.length) { return NONE; }
                return rows.map(function (r) { return norm(r.children[0]); }).join('|');
            },
            finErrIn: function (hostId) {
                var h = testid(hostId);
                return h ? h.querySelectorAll('[data-testid="cap-fin-err"]').length : -1;
            },
            finErrTextIn: function (hostId) {
                var h = testid(hostId);
                if (!h) { return NOEL; }
                var el = h.querySelector('[data-testid="cap-fin-err"]');
                return el ? norm(el) : EMPTY;
            },
            profAttrsIn: function (hostId) {
                var h = testid(hostId);
                return h ? h.querySelectorAll('[data-testid="cap-prof-attr"]').length : -1;
            },
            profErrIn: function (hostId) {
                var h = testid(hostId);
                return h ? h.querySelectorAll('[data-testid="cap-prof-err"]').length : -1;
            },
            emptyMsgIn: function (hostId) {
                var h = testid(hostId);
                if (!h) { return NOEL; }
                var el = h.querySelector('[data-testid="cap-empty-msg"]');
                return el ? norm(el) : EMPTY;
            },
            // F11's single scalar: one string carries BOTH halves of the error path (did the message
            // appear, and were the stale rows cleared), which is what makes the conditional pair's
            // reason-change measurable as a VALUE difference instead of a wording difference.
            snapshotIn: function (hostId) {
                var h = testid(hostId);
                if (!h) { return NOEL; }
                var err = h.querySelectorAll('[data-testid="cap-fin-err"]').length;
                var rows = h.querySelectorAll('[data-testid="cap-fin-row"]').length;
                return 'err=' + (err > 0 ? 1 : 0) + ';rows=' + rows;
            },
            // P14's single scalar for the student pane: financial rows, financial error, profile attrs,
            // profile error and the empty-ticker message, all of which are 0 by design in the stubs.
            stubSnapshotIn: function (hostId) {
                var h = testid(hostId);
                if (!h) { return NOEL; }
                var fin = h.querySelectorAll('[data-testid="cap-fin-row"]').length;
                var finErr = h.querySelectorAll('[data-testid="cap-fin-err"]').length;
                var prof = h.querySelectorAll('[data-testid="cap-prof-attr"]').length;
                var profErr = h.querySelectorAll('[data-testid="cap-prof-err"]').length;
                var empty = h.querySelectorAll('[data-testid="cap-empty-msg"]').length;
                return 'fin=' + fin + ';finErr=' + finErr + ';prof=' + prof + ';profErr=' + profErr + ';empty=' + empty;
            }
        },
        dom: {
            count: function (sel) { return qa(String(sel)).length; },
            text: function (sel) { return norm(q(String(sel))); },
            attr: function (sel, name) { return attrOf(q(String(sel)), String(name)); },
            testidCount: function (id) { return qa('[data-testid="' + String(id) + '"]').length; }
        }
    };
};

export function publishRbProbe() {
    if (window.__rb) { return false; }
    window.__rb = build();
    return true;
}

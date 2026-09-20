/**
 * RepairBench adaptation face - deterministic entropy source + same-origin network accounting.
 *
 *
 * runtime network; and the determinism requirement behind 2.1.4 / 3.9.3 "flaky zero tolerance"):
 *
 * 1) ENTROPY. The pristine seed has NO seedable RNG and no seed knob of any kind. A tree-wide census
 *    of the four classic scripts this tree ships found exactly ONE nondeterministic input:
 *    stuff/scripts/index.js:8  `const getNumber = (Math.floor(Math.random() * amount) + 1);`
 *    inside getRandomNumber(amount), called from stuff/scripts/index.js:3 as getRandomNumber(36) to
 *    pick which of the 36 files stuff/images/random_cats/1.jpg .. 36.jpg is loaded into #cat_image.
 *    There are 0 clock reads (no Date.now, no new Date, no performance.now), 0 storage reads and 0
 *    network calls in application code. Without a reproducible stream the "random cat" button shows a
 *    different picture on every load, so no checkpoint could ever state an expected value for it.
 *    This file installs ONE reproducible stream underneath that single consumer. It changes no
 *    application logic, no data, no control flow and no call site: it replaces the entropy source and
 *    nothing else. mulberry32 is used (32-bit state, full period, no library, no dependency).
 *
 *    The stream is deliberately global and never reset: one state variable in this closure, advanced
 *    once per draw, not re-seeded per click and per checkpoint. Consecutive clicks on the button
 *    therefore still produce different pictures exactly as they did in the pristine seed - they are
 *    just the same pictures on every run. Every checkpoint in tests/dsl.json runs in its own fresh
 *    browser context (evaluation/dsl_runner.mjs runCheckpointOnce), which reloads the document and so
 *    restarts the stream from the same constant; that is what makes each checkpoint's expected value
 *    reproducible without any cross-checkpoint coordination.
 *
 *    There is NO seed knob: no query parameter, no hash, no global setter, no reset function. The seed
 *    is the constant below and nothing on the page can change it, so it cannot be used as a cheat knob
 *    by an answering model and it cannot be perturbed by a repair.
 *
 * 2) OFFLINE ACCOUNTING. The pristine entry documents pulled one third-party stylesheet from
 *    cdnjs.cloudflare.com (font-awesome 5.15.3, one <link> in each of the seven HTML documents) and
 *    eleven remote assets from two CSS url() families (seven background-image targets on
 *    ximmanuel.github.io and four cursor targets on immanuelm.de). All eighteen are neutralised by
 *    this same adaptation face: the seven <link>s are repointed at the local inert stand-in
 *    fontawesome-inert.css, and the eleven url()s are repointed at stuff/images/background.png and
 *    stuff/images/cursor-raw.png, which are ALREADY IN THE TREE (578960 B and 527 B). Application
 *    code contains no fetch / XMLHttpRequest / WebSocket / sendBeacon / navigation call at all, so the
 *    transports hooked here are hooked defensively: they COUNT same-origin traffic and REFUSE
 *    cross-origin traffic, which turns "the delivered face makes zero external requests" from a claim
 *    into a reading (window.__RB_SEED_FACE__.blocked must stay empty and .same_origin_only must stay
 *    true). CSS-initiated fetches do not travel through any JS transport, so they are accounted
 *    separately and statically: the adaptation face leaves 0 `url(http` occurrences in the nine own
 *    stylesheets, and checkpoint P18 reads getComputedStyle(#top).backgroundImage at runtime and
 *    requires it to resolve against the loopback origin.
 *
 * This file is loaded from all seven HTML documents BEFORE the seed's own scripts (stuff/scripts/
 * main.js, index.js, questions.js, quiz.js), so the override is in place before any application script
 * is evaluated.
 *
 * 0 defect knowledge. 0 expected values. 0 writes to application state. 0 dispatched events.
 * 0 reimplementation of any application logic.
 */
(function () {
    'use strict';

    var DEFAULT_SEED = 20260910;

    /* mulberry32: 32-bit state, full period, no library, no globals besides this closure */
    var state = DEFAULT_SEED >>> 0;
    function next() {
        state = (state + 0x6D2B79F5) >>> 0;
        var t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    var rec = { seed: DEFAULT_SEED, draws: 0, same_origin: 0, blocked: [], same_origin_only: true };
    var nativeRandom = Math.random;
    Math.random = function () { rec.draws++; return next(); };
    rec.native_random_replaced = Math.random !== nativeRandom;

    function sameOrigin(url) {
        try { return new URL(url, location.href).origin === location.origin; }
        catch (e) { return false; }
    }

    function account(kind, url) {
        if (sameOrigin(url)) { rec.same_origin++; return true; }
        rec.blocked.push(kind + ':' + url);
        rec.same_origin_only = false;
        return false;
    }

    var xo = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
    if (xo) {
        window.XMLHttpRequest.prototype.open = function (method, url) {
            if (account('xhr', url)) return xo.apply(this, arguments);
            throw new Error('[rb-seed] refused cross-origin XHR: ' + url);
        };
    }

    var nf = window.fetch;
    if (nf) {
        window.fetch = function (input) {
            var url = typeof input === 'string' ? input : (input && input.url) || String(input);
            if (account('fetch', url)) return nf.apply(this, arguments);
            return Promise.reject(new Error('[rb-seed] refused cross-origin fetch: ' + url));
        };
    }

    var d = window.HTMLImageElement && Object.getOwnPropertyDescriptor(window.HTMLImageElement.prototype, 'src');
    if (d && d.set) {
        Object.defineProperty(window.HTMLImageElement.prototype, 'src', {
            configurable: true,
            enumerable: d.enumerable,
            get: d.get,
            set: function (v) {
                if (account('img', v)) return d.set.call(this, v);
            }
        });
    }

    window.__RB_SEED_FACE__ = rec;
})();

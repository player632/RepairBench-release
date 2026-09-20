/* RepairBench instrumentation probe (minimal-notes).
 *
 * Added by environment/instrumentation.patch. It touches NO application logic and
 * writes NO application state. It does exactly two things:
 *
 *   (a) installs passive global listeners so an uncaught exception anywhere in the
 *       page (including the boot statement that runs before the Vue instance is
 *       constructed) is recorded as a readable count instead of vanishing; and
 *   (b) publishes window.__MN__ as a READ-ONLY getter object, recomputed on every
 *       call, over facts that are already in the DOM / in the browser's own APIs:
 *       whether the Vue instance mounted, whether uncompiled mustaches are still on
 *       screen, which Vue build actually loaded, how many requests left this origin,
 *       what the page wrote to storage / URL / cookies / globals, and how many
 *       instrumented note cards are on screen.
 *
 * Discipline: every getter is safe-wrapped and returns the ERR sentinel instead of
 * throwing, so a broken page state surfaces as a failed assertion (behaviour
 * evidence) and never as a second crash inside the probe. Nothing is cached between
 * calls, no expectation lives in this file, and the probe never mutates the
 * application's data, its localStorage, its DOM or its event wiring.
 */
(function () {
    "use strict";

    var ERR = "__mn_probe_error__";
    var captured = [];

    try {
        // capture phase so the listener also sees errors thrown by scripts that run
        // before the probe's own body finishes (there are none today, but the
        // contract must not depend on insertion order inside <body>).
        window.addEventListener("error", function (e) {
            try {
                captured.push({
                    kind: "error",
                    message: String((e && e.message) || ""),
                    source: String((e && e.filename) || "").split("/").pop(),
                    line: Number((e && e.lineno) || 0)
                });
            } catch (ignore) { /* the probe must never become the second failure */ }
        }, true);
        window.addEventListener("unhandledrejection", function (e) {
            try {
                captured.push({
                    kind: "rejection",
                    message: String((e && e.reason && e.reason.message) || (e && e.reason) || "")
                });
            } catch (ignore) { /* ditto */ }
        });
    } catch (ignore) { /* ditto */ }

    function safe(fn) {
        try { return fn(); } catch (e) { return ERR; }
    }

    function appEl() { return document.getElementById("app"); }

    // Vue 2 stamps the mounted root element with __vue__; reading it is a pure
    // observation of the framework's own bookkeeping and works identically whether
    // the instance was constructed or the boot script died before `new Vue(...)`.
    function vueMounted() {
        return safe(function () {
            var e = appEl();
            return !!(e && e.__vue__);
        });
    }

    // An uncompiled in-DOM template is the visible signature of "Vue never mounted":
    // the mustache delimiters are still literal text inside #app.
    function mustacheOnScreen() {
        return safe(function () {
            var e = appEl();
            if (!e) return false;
            return /\{\{|\}\}/.test(String(e.textContent || ""));
        });
    }

    // Requests that left this origin. Same-origin fetches, data: and blob: URLs do
    // not count, so a fully vendored tree reports 0 without any allow-listing.
    function externalRequests() {
        return safe(function () {
            var n = 0;
            var entries = (window.performance && performance.getEntriesByType)
                ? (performance.getEntriesByType("resource") || []) : [];
            for (var i = 0; i < entries.length; i++) {
                var name = String(entries[i].name || "");
                if (!name) continue;
                if (name.indexOf(location.origin) === 0) continue;
                if (name.indexOf("data:") === 0 || name.indexOf("blob:") === 0) continue;
                n++;
            }
            return n;
        });
    }

    function externalHosts() {
        return safe(function () {
            var seen = [];
            var entries = (window.performance && performance.getEntriesByType)
                ? (performance.getEntriesByType("resource") || []) : [];
            for (var i = 0; i < entries.length; i++) {
                var name = String(entries[i].name || "");
                if (!name || name.indexOf(location.origin) === 0) continue;
                if (name.indexOf("data:") === 0 || name.indexOf("blob:") === 0) continue;
                var host = name.replace(/^[a-z]+:\/\//i, "").split("/")[0];
                if (seen.indexOf(host) < 0) seen.push(host);
            }
            return seen.join("|");
        });
    }

    function storageKeys(which) {
        return safe(function () {
            var s = window[which];
            if (!s) return "";
            var out = [];
            for (var i = 0; i < s.length; i++) out.push(s.key(i));
            return out.sort().join("|");
        });
    }

    function residueGlobals() {
        return safe(function () {
            var hits = [];
            var keys = Object.keys(window);
            for (var i = 0; i < keys.length; i++) {
                if (/^__(rb|wlb|repair|bench|hint|answer|gold|oracle)/i.test(keys[i])) hits.push(keys[i]);
            }
            return hits.sort().join("|");
        });
    }

    function cardCount() {
        return safe(function () {
            return document.querySelectorAll('[data-testid$="-card"]').length;
        });
    }

    function headBackground(testid) {
        return safe(function () {
            var e = document.querySelector('[data-testid="' + testid + '"]');
            if (!e) return ERR;
            return String(window.getComputedStyle(e).backgroundColor || "");
        });
    }

    window.__MN__ = function () {
        return {
            // ---- boot / framework lifecycle ----
            ready: safe(function () { return typeof window.Vue === "function" && document.readyState !== "loading"; }),
            vueMounted: vueMounted(),
            mustache: mustacheOnScreen(),
            vueVersion: safe(function () { return String((window.Vue && window.Vue.version) || ""); }),
            vueCdnScripts: safe(function () {
                var n = 0, s = document.getElementsByTagName("script");
                for (var i = 0; i < s.length; i++) {
                    var src = String(s[i].getAttribute("src") || "");
                    if (/^https?:|^\/\//.test(src)) n++;
                }
                return n;
            }),
            errors: captured.length,
            errorMessages: captured.map(function (c) { return c.kind + ":" + c.message; }).join("|"),

            // ---- network self-sufficiency ----
            extRequests: externalRequests(),
            extHosts: externalHosts(),
            resourceCount: safe(function () {
                return (window.performance && performance.getEntriesByType)
                    ? (performance.getEntriesByType("resource") || []).length : -1;
            }),

            // ---- storage / URL / global residue (state-isolation asserts) ----
            ls: safe(function () { return window.localStorage.length; }),
            ss: safe(function () { return window.sessionStorage.length; }),
            lsKeys: storageKeys("localStorage"),
            ssKeys: storageKeys("sessionStorage"),
            notesRaw: safe(function () {
                var v = window.localStorage.getItem("notes");
                return v === null ? "<null>" : String(v);
            }),
            notesLen: safe(function () {
                var v = window.localStorage.getItem("notes");
                if (v === null) return -1;
                var p = JSON.parse(v);
                return Array.isArray(p) ? p.length : -2;
            }),
            cookie: safe(function () { return String(document.cookie || ""); }),
            hash: safe(function () { return String(location.hash || ""); }),
            search: safe(function () { return String(location.search || ""); }),
            pathname: safe(function () { return String(location.pathname || ""); }),
            residue: residueGlobals(),

            // ---- instrumented DOM facts ----
            cards: cardCount(),
            title: safe(function () { return String(document.title || ""); }),
            headingText: safe(function () {
                var e = document.querySelector('[data-testid$="-title"]');
                return e ? String(e.textContent || "") : ERR;
            }),
            composerValue: safe(function () {
                var e = document.querySelector('[data-testid$="-composer"]');
                return e ? String(e.value === undefined || e.value === null ? "" : e.value) : ERR;
            }),
            appInlineHeight: safe(function () {
                var e = appEl();
                return e ? String(e.style.height || "") : ERR;
            }),
            clientHeight: safe(function () { return Number(document.documentElement.clientHeight); }),
            scrollY: safe(function () { return Number(window.scrollY || 0); }),

            // ---- one-off computed-style reader (used by the colour-page guards) ----
            bgOf: headBackground
        };
    };
})();

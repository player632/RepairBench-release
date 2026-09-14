/* RepairBench instrumentation probe (painter).
 *
 * Added by environment/instrumentation.patch. It touches NO application logic:
 * it only (a) exposes read-only, recomputed-on-every-call getters over the seed's
 * own state (window.GlobalStatus, window.svgDoc and the live SVG DOM) and (b)
 * exposes a gesture surface that drives the seed's OWN handlers by dispatching
 * real DOM MouseEvents on real nodes, with pointer positions derived from the
 * live screen CTM so no checkpoint depends on a hard-coded page coordinate.
 *
 * Discipline: every getter is wrapped and returns the ERR sentinel instead of
 * throwing, so a broken state is reported as a failed assertion (behaviour
 * evidence) and never as a page crash. Nothing here writes application state,
 * nothing is cached between calls, and no expectation lives in this file.
 */
(function () {
    "use strict";

    var ERR = "__pt_probe_error__";
    var SHAPE_TAGS = ["rect", "circle", "ellipse", "line", "path", "polyline", "polygon", "text", "image", "use"];
    var HANDLE_PREFIX = "rb-handle-";
    var capturedErrors = [];

    try {
        window.addEventListener("error", function (e) {
            try { capturedErrors.push(String((e && e.message) || "error")); } catch (_) { /* ignore */ }
        });
        window.addEventListener("unhandledrejection", function (e) {
            try { capturedErrors.push("rejection:" + String((e && e.reason) || "?")); } catch (_) { /* ignore */ }
        });
    } catch (_) { /* ignore */ }

    function svgRoot() { return document.getElementById("svgPanel"); }
    function safe(fn, dflt) {
        try { var v = fn(); return (v === undefined || v === null) ? (dflt === undefined ? null : dflt) : v; }
        catch (e) { return ERR; }
    }
    function num(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }

    function shapeNodes() {
        var root = svgRoot();
        if (!root) return [];
        var out = [];
        for (var i = 0; i < root.childNodes.length; i++) {
            var n = root.childNodes[i];
            if (!n || n.nodeType !== 1) continue;
            var tag = String(n.nodeName || n.tagName || "").toLowerCase();
            if (SHAPE_TAGS.indexOf(tag) >= 0) out.push(n);
        }
        return out;
    }
    function handleNodes() {
        var list = document.querySelectorAll('[data-testid^="' + HANDLE_PREFIX + '"]');
        var out = [];
        for (var i = 0; i < list.length; i++) out.push(list[i]);
        return out;
    }
    function visible(node) {
        if (!node) return false;
        var r = node.getBoundingClientRect();
        var cs = window.getComputedStyle(node);
        if (cs && (cs.display === "none" || cs.visibility === "hidden")) return false;
        return r.width > 0 && r.height > 0;
    }
    // The seed stores picked entries as svg.js wrappers (SVG.Element), not as DOM
    // nodes, so unwrap before naming: a wrapper has no nodeName and no getBBox of
    // its own. Unwrapping is identity for real DOM nodes, so shape keys read from
    // the live SVG tree are unchanged.
    function domOf(node) {
        if (!node) return null;
        if (node.nodeType === 1) return node;
        var inner = node.node;
        return (inner && inner.nodeType === 1) ? inner : null;
    }
    function keyOf(node) {
        var el = domOf(node) || node;
        var tag = String((el && el.nodeName) || "").toLowerCase();
        var b = null;
        try { b = el.getBBox(); } catch (e) { b = null; }
        if (b) return tag + "@" + Math.round(b.x) + "," + Math.round(b.y) + "," + Math.round(b.width) + "," + Math.round(b.height);
        return tag + "?";
    }
    function ctm() { var root = svgRoot(); return root && root.getScreenCTM ? root.getScreenCTM() : null; }

    function shapeView(node) {
        if (!node) return null;
        var a = function (n) { return node.getAttribute(n); };
        var b = null;
        try { b = node.getBBox(); } catch (e) { b = null; }
        var d = a("d") || "";
        var pts = a("points") || "";
        var vertices = pts ? pts.trim().split(/\s+/).filter(function (x) { return x.length; }) : [];
        return {
            tag: String(node.nodeName || "").toLowerCase(),
            key: keyOf(node),
            x: num(a("x")), y: num(a("y")),
            width: num(a("width")), height: num(a("height")),
            r: num(a("r")), rx: num(a("rx")), ry: num(a("ry")),
            cx: num(a("cx")), cy: num(a("cy")),
            x1: num(a("x1")), y1: num(a("y1")), x2: num(a("x2")), y2: num(a("y2")),
            bboxX: b ? Math.round(b.x * 100) / 100 : null,
            bboxY: b ? Math.round(b.y * 100) / 100 : null,
            bboxW: b ? Math.round(b.width * 100) / 100 : null,
            bboxH: b ? Math.round(b.height * 100) / 100 : null,
            fill: a("fill"), stroke: a("stroke"), strokeWidth: a("stroke-width"),
            dasharray: a("stroke-dasharray"), picked: a("picked"),
            points: pts, vertexCount: vertices.length,
            firstVertex: vertices.length ? vertices[0] : null,
            lastVertex: vertices.length ? vertices[vertices.length - 1] : null,
            d: d,
            segmentsM: d ? d.split("M").length - 1 : 0,
            segmentsL: d ? d.split("L").length - 1 : 0,
            segmentsT: d ? d.split("T").length - 1 : 0,
            styleFill: node.style ? (node.style.fill || null) : null,
            styleFillOpacity: node.style && node.style.fillOpacity !== "" ? num(node.style.fillOpacity) : null,
            styleStroke: node.style ? (node.style.stroke || null) : null,
            inlineStyle: node.getAttribute("style") || ""
        };
    }

    function read() {
        var root = svgRoot();
        var gs = window.GlobalStatus || null;
        var shapes = safe(shapeNodes, []);
        var picked = safe(function () { return (gs && gs.getPickeds) ? gs.getPickeds() : []; }, []);
        var elements = safe(function () { return (gs && gs.getAllElements) ? gs.getAllElements() : []; }, []);
        var activeTools = [];
        try {
            var t = document.querySelectorAll(".handle_btn.active");
            for (var i = 0; i < t.length; i++) activeTools.push(t[i].id || "(noid)");
        } catch (e) { activeTools = [ERR]; }
        var colorActive = [];
        try {
            var c = document.querySelectorAll(".color-left li.active");
            for (var j = 0; j < c.length; j++) colorActive.push(c[j].id || "(noid)");
        } catch (e) { colorActive = [ERR]; }
        var menus = document.querySelectorAll("ul.contextMenuPlugin");
        var labels = [];
        try {
            if (menus.length) {
                var spans = menus[0].querySelectorAll("li a span");
                for (var k = 0; k < spans.length; k++) labels.push(String(spans[k].textContent || "").replace(/\s+/g, ""));
            }
        } catch (e) { labels = [ERR]; }
        var hs = safe(handleNodes, []);
        var handlesVisible = 0;
        for (var h = 0; h < hs.length; h++) if (visible(hs[h])) handlesVisible++;

        return {
            ready: !!(root && gs && window.svgDoc && window.__PT_CMD__),
            shapes: Array.isArray(shapes) ? shapes.length : ERR,
            tags: Array.isArray(shapes) ? shapes.map(function (n) { return String(n.nodeName || "").toLowerCase(); }).join("|") : ERR,
            orderKey: Array.isArray(shapes) ? shapes.map(keyOf).join(" # ") : ERR,
            groups: safe(function () { return root ? root.querySelectorAll(":scope > g").length : 0; }, ERR),
            svgChildren: safe(function () { return root ? root.childNodes.length : 0; }, ERR),
            picked: Array.isArray(picked) ? picked.length : ERR,
            pickedKey: Array.isArray(picked) ? picked.map(function (n) { return keyOf(n); }).join(" # ") : ERR,
            elements: Array.isArray(elements) ? elements.length : ERR,
            activeTools: activeTools.join("|"),
            colorActive: colorActive.join("|"),
            lineSize: safe(function () { return gs.getLineSize(); }, ERR),
            lineSizeActiveCount: safe(function () { return document.querySelectorAll("#lineSize dd.active").length; }, ERR),
            lineSizeDropdownOpen: safe(function () {
                var dl = document.querySelector("#lineSize");
                return dl ? (window.getComputedStyle(dl).display !== "none") : false;
            }, ERR),
            lineStyleActive: safe(function () {
                var li = document.querySelector(".js-lineStyle");
                return li ? li.className.indexOf("active") >= 0 : false;
            }, ERR),
            fontColor: safe(function () { return gs.getFontColor(); }, ERR),
            fillColor: safe(function () { return gs.getFillColor(); }, ERR),
            fillOpacitySetting: safe(function () { return gs.getFillOpacity(); }, ERR),
            defaultFontColor: safe(function () { return gs.defaultFontColor; }, ERR),
            defaultFillColor: safe(function () { return gs.defaultFillColor; }, ERR),
            defaultLineSize: safe(function () { return gs.defaultLineSize; }, ERR),
            isPicked: safe(function () { return gs.isPicked(); }, ERR),
            isPreFilled: safe(function () { return gs.isPreFilled(); }, ERR),
            isRecycle: safe(function () { return gs.isRecycle(); }, ERR),
            handles: Array.isArray(hs) ? hs.length : ERR,
            handlesVisible: handlesVisible,
            cursor: safe(function () { return root ? window.getComputedStyle(root).cursor : null; }, ERR),
            menus: menus.length,
            menuLabels: labels.join("|"),
            contextMenuBlocked: safe(function () {
                return (typeof document.oncontextmenu === "function") ? String(document.oncontextmenu()) : "none";
            }, ERR),
            errors: capturedErrors.length,
            errorText: capturedErrors.join(" ;; ").slice(0, 600),
            ls: safe(function () { return window.localStorage.length; }, ERR),
            ss: safe(function () { return window.sessionStorage.length; }, ERR),
            cookie: safe(function () { return String(document.cookie || ""); }, ERR),
            pathname: safe(function () { return window.location.pathname; }, ERR),
            hash: safe(function () { return String(window.location.hash || ""); }, ERR),
            search: safe(function () { return String(window.location.search || ""); }, ERR),
            scrollY: safe(function () { return window.scrollY; }, ERR),
            docHeight: safe(function () { return document.documentElement.scrollHeight; }, ERR),
            residue: safe(function () { return typeof window.__rb_residue; }, ERR),
            paletteThumbs: safe(function () { return document.querySelectorAll(".sp-thumb-el").length; }, ERR),
            title: safe(function () { return document.title; }, ERR),
            h1: safe(function () { var e = document.querySelector(".title h1"); return e ? String(e.textContent || "").trim() : null; }, ERR),
            panels: safe(function () { return document.querySelectorAll(".board-panel").length; }, ERR),
            toolIcons: safe(function () { return document.querySelectorAll(".board-icon li").length; }, ERR),
            cornerHref: safe(function () {
                var a = document.querySelector("a.github-corner");
                return a ? a.getAttribute("href") : null;
            }, ERR),
            analyticsScripts: safe(function () {
                var s = document.getElementsByTagName("script"), n = 0;
                for (var i = 0; i < s.length; i++) if (/hm\.baidu\.com/.test(s[i].src || "")) n++;
                return n;
            }, ERR),
            shape: function (i) { var s = safe(shapeNodes, []); return Array.isArray(s) ? safe(function () { return shapeView(s[i]); }, ERR) : ERR; },
            shapeByKey: function (key) {
                var s = safe(shapeNodes, []);
                if (!Array.isArray(s)) return ERR;
                for (var i = 0; i < s.length; i++) if (keyOf(s[i]) === key) return safe(function () { return shapeView(s[i]); }, ERR);
                return null;
            },
            handle: function (name) {
                var node = document.querySelector('[data-testid="' + HANDLE_PREFIX + name + '"]');
                if (!node) return null;
                var r = node.getBoundingClientRect();
                return {
                    visible: visible(node),
                    x: num(node.getAttribute("x")), y: num(node.getAttribute("y")),
                    width: num(node.getAttribute("width")), height: num(node.getAttribute("height")),
                    clientX: Math.round(r.left), clientY: Math.round(r.top)
                };
            },
            swatch: function (id) {
                var li = document.getElementById(id);
                if (!li) return null;
                var span = li.querySelector("span");
                return {
                    dataColor: li.getAttribute("data-color") || null,
                    active: li.className.indexOf("active") >= 0,
                    background: span ? window.getComputedStyle(span).backgroundColor : null
                };
            },
            paletteHex: function (i) {
                var t = document.querySelectorAll(".sp-thumb-el");
                if (!t[i]) return null;
                var inner = t[i].querySelector(".sp-thumb-inner");
                return inner ? window.getComputedStyle(inner).backgroundColor : null;
            }
        };
    }

    // ---------------- gesture surface (drives the seed's own handlers) ----------------
    function userToClient(ux, uy) {
        var m = ctm();
        var root = svgRoot();
        if (!m || !root || !root.createSVGPoint) return null;
        var pt = root.createSVGPoint();
        pt.x = ux; pt.y = uy;
        var c = pt.matrixTransform(m);
        return { x: c.x, y: c.y };
    }
    function ctmScale() { var m = ctm(); return (m && m.a) ? m.a : 1; }
    function mkEvent(type, cx, cy, opts) {
        var o = opts || {};
        var init = {
            view: window, bubbles: true, cancelable: true, composed: true,
            clientX: cx, clientY: cy, screenX: cx, screenY: cy,
            button: (o.button === undefined ? 0 : o.button),
            buttons: (o.buttons === undefined ? 1 : o.buttons),
            ctrlKey: !!o.ctrlKey, shiftKey: !!o.shiftKey, altKey: !!o.altKey, metaKey: !!o.metaKey
        };
        try { return new MouseEvent(type, init); }
        catch (e) {
            var ev = document.createEvent("MouseEvents");
            ev.initMouseEvent(type, true, true, window, 1, cx, cy, cx, cy, !!o.ctrlKey, !!o.altKey, !!o.shiftKey, !!o.metaKey, init.button, null);
            return ev;
        }
    }
    function nodeOf(spec) {
        if (!spec || spec === "canvas") return svgRoot();
        if (spec === "window") return window;
        if (spec === "document") return document;
        if (spec === "body") return document.body;
        var m = /^shape:(\d+)$/.exec(spec);
        if (m) { var s = shapeNodes(); return s[Number(m[1])] || null; }
        var h = /^handle:([a-z-]+)$/.exec(spec);
        if (h) return document.querySelector('[data-testid="' + HANDLE_PREFIX + h[1] + '"]');
        var i = /^id:(.+)$/.exec(spec);
        if (i) return document.getElementById(i[1]);
        var q = /^css:(.+)$/.exec(spec);
        if (q) return document.querySelector(q[1]);
        return null;
    }
    function dispatch(spec, type, at, opts) {
        var node = nodeOf(spec);
        if (!node) return { ok: false, why: "no node for " + String(spec) };
        var c = at ? userToClient(at[0], at[1]) : null;
        var ev = mkEvent(type, c ? c.x : 0, c ? c.y : 0, opts);
        node.dispatchEvent(ev);
        return { ok: true, node: spec, type: type, clientX: c ? Math.round(c.x * 100) / 100 : null, clientY: c ? Math.round(c.y * 100) / 100 : null };
    }

    var CMD = {
        userToClient: function (ux, uy) { return safe(function () { return userToClient(ux, uy); }, ERR); },
        scale: function () { return safe(ctmScale, ERR); },
        // steps: [{op:"down"|"move"|"up"|"contextmenu"|"click"|"over"|"out", at:[ux,uy], node:"canvas"|"shape:i"|"handle:x"|"window", button:0|2}]
        gesture: function (steps) {
            return safe(function () {
                var out = { ok: true, n: 0, failed: [], shapesBefore: shapeNodes().length, errorsBefore: capturedErrors.length };
                var TYPE = { down: "mousedown", move: "mousemove", up: "mouseup", contextmenu: "contextmenu", click: "click", over: "mouseover", out: "mouseout" };
                for (var i = 0; i < (steps || []).length; i++) {
                    var st = steps[i] || {};
                    var type = TYPE[st.op];
                    if (!type) { out.failed.push("step" + i + ":unknown op " + String(st.op)); continue; }
                    var opts = { button: st.button === undefined ? 0 : st.button };
                    opts.buttons = st.op === "up" ? 0 : (opts.button === 2 ? 2 : 1);
                    if (st.op === "click" && st.button === 2) opts.buttons = 2;
                    var r = dispatch(st.node || "canvas", type, st.at, opts);
                    if (!r.ok) out.failed.push("step" + i + ":" + r.why);
                    out.n++;
                }
                out.shapesAfter = shapeNodes().length;
                out.errors = capturedErrors.length - out.errorsBefore;
                out.errorText = capturedErrors.slice(out.errorsBefore).join(" ;; ").slice(0, 400);
                out.failedText = out.failed.join(" ;; ");
                out.failedCount = out.failed.length;
                return out;
            }, ERR);
        },
        clickNode: function (spec) {
            return safe(function () {
                var node = nodeOf(spec);
                if (!node) return { ok: false, why: "no node for " + String(spec) };
                if (typeof node.click === "function") { node.click(); return { ok: true, spec: spec, via: "click()" }; }
                node.dispatchEvent(mkEvent("click", 0, 0, {}));
                return { ok: true, spec: spec, via: "dispatch" };
            }, ERR);
        },
        // drag a resize/move handle by a delta expressed in SVG USER units
        dragHandle: function (name, dx, dy, steps) {
            return safe(function () {
                var node = document.querySelector('[data-testid="' + HANDLE_PREFIX + name + '"]');
                if (!node) return { found: false, handles: handleNodes().length, visible: 0 };
                var r = node.getBoundingClientRect();
                var sx = r.left + r.width / 2, sy = r.top + r.height / 2;
                var k = ctmScale();
                var cdx = dx * k, cdy = dy * k;
                var n = Math.max(1, steps || 1);
                var errsBefore = capturedErrors.length;
                node.dispatchEvent(mkEvent("mousedown", sx, sy, { button: 0, buttons: 1 }));
                for (var i = 1; i <= n; i++) {
                    window.dispatchEvent(mkEvent("mousemove", sx + cdx * i / n, sy + cdy * i / n, { button: 0, buttons: i === n ? 0 : 1 }));
                }
                window.dispatchEvent(mkEvent("mouseup", sx + cdx, sy + cdy, { button: 0, buttons: 0 }));
                return { found: true, steps: n, dxUser: dx, dyUser: dy, scale: k, errors: capturedErrors.length - errsBefore, errorText: capturedErrors.slice(errsBefore).join(" ;; ").slice(0, 300) };
            }, ERR);
        },
        // drag a SHAPE (not a handle) by a delta in user units: needs the pick tool + hover first
        dragShape: function (index, dx, dy, steps) {
            return safe(function () {
                var node = shapeNodes()[index];
                if (!node) return { found: false };
                var b = node.getBBox();
                var c = userToClient(b.x + b.width / 2, b.y + b.height / 2);
                var k = ctmScale();
                var n = Math.max(1, steps || 1);
                var errsBefore = capturedErrors.length;
                node.dispatchEvent(mkEvent("mousedown", c.x, c.y, { button: 0, buttons: 1 }));
                for (var i = 1; i <= n; i++) {
                    window.dispatchEvent(mkEvent("mousemove", c.x + dx * k * i / n, c.y + dy * k * i / n, { button: 0, buttons: 1 }));
                }
                window.dispatchEvent(mkEvent("mouseup", c.x + dx * k, c.y + dy * k, { button: 0, buttons: 0 }));
                return { found: true, steps: n, errors: capturedErrors.length - errsBefore };
            }, ERR);
        },
        choosePalette: function (i) {
            return safe(function () {
                var t = document.querySelectorAll(".sp-thumb-el");
                if (!t[i]) return { ok: false, thumbs: t.length };
                t[i].click();
                return { ok: true, thumbs: t.length, index: i };
            }, ERR);
        },
        clearErrors: function () { return safe(function () { var n = capturedErrors.length; capturedErrors.length = 0; return n; }, ERR); },
        errorCount: function () { return capturedErrors.length; },
        errorText: function () { return capturedErrors.join(" ;; ").slice(0, 600); }
    };

    Object.defineProperty(window, "__PT__", { get: function () { return read; }, configurable: true });
    Object.defineProperty(window, "__PT_CMD__", { get: function () { return CMD; }, configurable: true });
})();

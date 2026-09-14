/* RepairBench instrumentation probe (stampadia-generals / Print Shop).
 *
 * Added by environment/instrumentation.patch as js/rb-probe.js. It touches NO application logic:
 *  (a) it exposes read-only, recomputed-on-every-call getters over the seed's own state. The Print
 *      Shop keeps everything it knows (tab, busy, hideCardId, database, selectedIds, selectedData,
 *      selectedCards, selectedStats, deckPainter, cardTools) in the closure of PrintShop(), so the
 *      instrumentation hands this file ONE getter function (window.__RB_PUBLISH_APP__) from inside
 *      that closure; nothing is copied, cached or mutated here.
 *  (b) it exposes a gesture surface that drives the seed's OWN handlers by dispatching real DOM
 *      events on real nodes addressed by the data-testid handles the same patch installs, so no
 *      checkpoint depends on a hard-coded page coordinate or on a synthetic call into app code.
 *  (c) it reads the painted sheets. DeckPainter.paintCards() is synchronous and stores one SVG
 *      wrapper per sheet in deckPainter.pages; SVG.finalize() detaches the wrapper's <div> from
 *      document.body but leaves its subtree intact, so the sheet geometry (viewBox, per-card
 *      translate/rotate transforms, symbol fills, printed card codes) is still readable after the
 *      Download click returns. Ids are duplicated across cloned cards, so every sheet query is
 *      scoped inside one sheet node and uses [id="..."] rather than #....
 *
 * Discipline: every getter is wrapped and returns the ERR sentinel instead of throwing, and every
 * command returns {found:false,...} instead of throwing, so a broken state surfaces as a failed
 * assertion (behaviour evidence) and never as a page crash or a runner crash. Nothing here writes
 * application state, nothing is cached between calls, and no expectation lives in this file.
 */
(function () {
    "use strict";

    var ERR = "__rb_probe_error__";
    var capturedErrors = [];
    var appGetter = null;

    try {
        window.addEventListener("error", function (e) {
            try { capturedErrors.push(String((e && e.message) || "error").slice(0, 300)); } catch (_) { /* ignore */ }
        });
        window.addEventListener("unhandledrejection", function (e) {
            try { capturedErrors.push("rejection:" + String((e && e.reason) || "?").slice(0, 300)); } catch (_) { /* ignore */ }
        });
    } catch (_) { /* ignore */ }

    function safe(fn) {
        try { var v = fn(); return (v === undefined) ? null : v; }
        catch (e) { return ERR; }
    }
    function num(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }
    function txt(n) { return n ? String(n.textContent === undefined || n.textContent === null ? "" : n.textContent).trim() : ""; }
    function attr(n, a) { return (n && n.getAttribute) ? n.getAttribute(a) : null; }
    function list(sel, root) {
        var out = [];
        try {
            var q = (root || document).querySelectorAll(sel);
            for (var i = 0; i < q.length; i++) out.push(q[i]);
        } catch (_) { /* ignore */ }
        return out;
    }
    function app() {
        if (!appGetter) return null;
        return safe(appGetter);
    }

    // ---------- DOM census ----------
    function tabbarFacts() {
        return list(".tabbar .item").map(function (n, i) {
            return { i: i, text: txt(n), cls: String(n.className || ""), selected: /\bselected\b/.test(String(n.className || "")), testid: attr(n, "data-testid") };
        });
    }
    function deckRowFacts() {
        return list(".list.decks .row").map(function (n, i) {
            var icon = n.querySelector(".icon");
            var title = n.querySelector(".title");
            var bullets = list(".bullet", title).map(function (b) { return { cls: String(b.className || ""), text: txt(b) }; });
            return {
                i: i, cls: String(n.className || ""), testid: attr(n, "data-testid"),
                selected: /\bselected\b/.test(String(n.className || "")),
                icon: icon ? String(icon.className || "") : null,
                outlined: txt(n.querySelector(".bullet.outlined")),
                name: txt(n.querySelector(".title .name")),
                code: txt(n.querySelector(".title .code")),
                description: txt(n.querySelector(".description")),
                bullets: bullets
            };
        });
    }
    function tableFacts(scope) {
        var out = [];
        var rows = list(".table .tablerow", scope);
        for (var i = 0; i < rows.length; i++) {
            var lab = rows[i].querySelector(".tablelabel");
            var val = rows[i].querySelector(".tablevalue");
            out.push({ i: i, label: txt(lab), value: txt(val), valueHtml: val ? String(val.innerHTML || "").slice(0, 300) : null,
                       hasLink: !!(val && val.querySelector("a")), linkHref: val && val.querySelector("a") ? attr(val.querySelector("a"), "href") : null });
        }
        return out;
    }
    function recapFacts() {
        var head = document.querySelector(".list.prints .recapheader");
        if (!head) return { found: false };
        var textRows = list(".tabletextrow", head).map(function (n) { return txt(n); });
        return { found: true, rows: tableFacts(head), textRows: textRows };
    }
    function moduleRowFacts() {
        var prints = document.querySelector(".list.prints");
        if (!prints) return [];
        var out = [];
        var rows = list(".list.prints .row");
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            if (/\bselectable\b/.test(String(r.className || ""))) continue;      // cards-tab set container
            if (!r.querySelector(".header")) continue;                            // modules-tab rows have a .header
            out.push({
                i: out.length, cls: String(r.className || ""), testid: attr(r, "data-testid"),
                icon: r.querySelector(".icon") ? String(r.querySelector(".icon").className || "") : null,
                name: txt(r.querySelector(".header .title .name")),
                code: txt(r.querySelector(".header .title .code")),
                headerDescription: txt(r.querySelector(".header .description")),
                flavor: txt(r.querySelector(".tabletextrow")),
                table: tableFacts(r)
            });
        }
        return out;
    }
    function setRowFacts() {
        return list(".list.prints .row.selectable").map(function (n, i) {
            return { i: i, cls: String(n.className || ""), testid: attr(n, "data-testid"),
                     icon: n.querySelector(".icon") ? String(n.querySelector(".icon").className || "") : null,
                     name: txt(n.querySelector(".title .name")), code: txt(n.querySelector(".title .code")),
                     description: txt(n.querySelector(".description")) };
        });
    }
    function cardRowFacts() {
        return list(".list.prints .card").map(function (n, i) {
            return { i: i, cls: String(n.className || ""), testid: attr(n, "data-testid"),
                     selected: /\bselected\b/.test(String(n.className || "")),
                     icon: n.querySelector(".icon") ? String(n.querySelector(".icon").className || "") : null,
                     name: txt(n.querySelector(".title .name")), code: txt(n.querySelector(".title .code")),
                     nameRaw: n.querySelector(".title .name") ? String(n.querySelector(".title .name").innerHTML || "") : null };
        });
    }
    function actionFacts() {
        return list(".actionbutton").map(function (n, i) { return { i: i, text: txt(n), cls: String(n.className || ""), testid: attr(n, "data-testid") }; });
    }
    function selectFacts() {
        return list(".list.prints select").map(function (n, i) {
            return { i: i, value: String(n.value), options: list("option", n).map(function (o) { return { value: String(o.value), text: txt(o) }; }),
                     selectedText: n.selectedIndex >= 0 && n.options[n.selectedIndex] ? txt(n.options[n.selectedIndex]) : null,
                     description: n.parentNode && n.parentNode.nextSibling ? txt(n.parentNode.nextSibling) : null };
        });
    }
    function welcomeFacts() {
        var body = document.querySelector(".list.prints .body");
        if (!body) return { present: false };
        return { present: true, header: txt(body.querySelector(".header")), hasLogo: !!body.querySelector(".logo"),
                 tips: list(".tips", body).map(function (n) { return txt(n).slice(0, 200); }),
                 tipsCount: list(".tips", body).length };
    }
    function checkboxFacts() {
        return list(".list.prints input[type=checkbox]").map(function (n, i) {
            return { i: i, checked: !!n.checked, label: n.closest && n.closest(".tablerow") ? txt(n.closest(".tablerow").querySelector(".tablelabel")) : null };
        });
    }

    // ---------- painted sheet census ----------
    function pages() {
        var a = app();
        if (!a || !a.deckPainter || !a.deckPainter.pages) return null;
        return a.deckPainter.pages;
    }
    function sheetNode(i) {
        var ps = pages();
        if (!ps || !ps[i] || !ps[i].node) return null;
        var svgs = ps[i].node.getElementsByTagName("svg");
        return svgs && svgs.length ? svgs[0] : null;
    }
    var TR_RE = /^translate\((-?[0-9.]+),(-?[0-9.]+)\)(?:\s+rotate\((-?[0-9.]+),(-?[0-9.]+),(-?[0-9.]+)\))?$/;
    function transformed(i) {
        var svg = sheetNode(i);
        if (!svg) return null;
        var out = [];
        var all = svg.getElementsByTagName("*");
        for (var k = 0; k < all.length; k++) {
            var n = all[k];
            var tr = n.getAttribute ? n.getAttribute("transform") : null;
            if (!tr) continue;
            var m = TR_RE.exec(String(tr).trim());
            out.push({
                k: out.length, tag: String(n.nodeName || n.tagName || "").toLowerCase(), id: attr(n, "id"),
                transform: String(tr), exact: !!m,
                dx: m ? num(m[1]) : null, dy: m ? num(m[2]) : null,
                angle: (m && m[3] !== undefined) ? num(m[3]) : null,
                cx: (m && m[4] !== undefined) ? num(m[4]) : null, cy: (m && m[5] !== undefined) ? num(m[5]) : null,
                depth: (function (e) { var d = 0, p = e.parentNode; while (p && p !== svg) { d++; p = p.parentNode; } return d; })(n),
                children: n.childNodes ? n.childNodes.length : 0,
                n: n
            });
        }
        return out;
    }
    // Card sides are the clones that CardPrinter.cloneNodeBy positions on the sheet grid.
    // `depth` below counts the ancestors STRICTLY BETWEEN the node and the sheet <svg>, so depth 1 is a
    // direct child of the template's single top-level group. Why depth is pinned to 1 (measured
    // 2026-09-09, calib c20_side_census on the clean A4 nine-card sheet, and read off the seed source):
    //   · svg/model.svg keeps every reusable original inside the group labelled "stencils"
    //     (js/svg.js: `stencilNodes = node.querySelectorAll('[inkscape\:label="stencils"]')[0].childNodes`),
    //     and SVG.finalize() removes each of them, so a PAINTED sheet holds clones only: no template
    //     original can be mistaken for a card.
    //   · cloneNodeBy(into=0,...) inserts a side with `svg.insertBefore(org,copy)`, i.e. as a sibling of
    //     its own original => every card side is at depth 1. renderCard paints THREE clones per card:
    //     the blankCardContainer frame (startUpperSide, unrotated), the unitCardContainer face
    //     (startUpperSide, unrotated) and the unitCardContainer reverse (startLowerSide,
    //     `translate(dx,dy) rotate(180,cx,cy)`), so a nine-card sheet measures 18 unrotated + 9 rotated.
    //   · symbol/sticker clones are made with cloneNodeBy(side,...) => appended INTO a side => depth 2.
    //     The old `depth <= 2` therefore also caught 32 of them and reported 50 upper / 59 sides for the
    //     same sheet, which made every grid fact a mix of card slots and card-internal offsets.
    //   · `children` is childNodes.length, which counts the template's inter-element whitespace: it keeps
    //     the three cached text-model clones CardPrinter parks at depth 1 with `translate(0,0)` and a
    //     single tspan out of the side set, while a card frame (whose outline rects renderCard deletes
    //     per profile) still counts 3+.
    // `angle === null` separates an unrotated clone from a rotated one, and the angle value itself is the
    // reverse side's rotation, which is what D08 corrupts.
    function cardSides(i) {
        var tr = transformed(i);
        if (!tr) return null;
        return tr.filter(function (g) { return g.exact && g.depth === 1 && g.children >= 3; });
    }
    function containers(i) {
        var cs = cardSides(i);
        return cs ? cs.filter(function (g) { return g.angle === null; }) : null;
    }
    function sideFacts(i) {
        var cs = cardSides(i);
        if (!cs) return { found: false, page: i };
        var lower = cs.filter(function (g) { return g.angle !== null; });
        var upper = cs.filter(function (g) { return g.angle === null; });
        var uniq = function (arr) { var o = []; for (var k = 0; k < arr.length; k++) if (o.indexOf(arr[k]) < 0) o.push(arr[k]); return o.sort(function (a, b) { return a - b; }); };
        return {
            found: true, page: i, sides: cs.length, upper: upper.length, lower: lower.length,
            lowerAngles: lower.map(function (g) { return g.angle; }),
            lowerAngleUniq: uniq(lower.map(function (g) { return g.angle; })),
            firstLowerAngle: lower.length ? lower[0].angle : null,
            firstLower: lower.length ? { dx: lower[0].dx, dy: lower[0].dy, angle: lower[0].angle, children: lower[0].children } : null,
            dxs: uniq(cs.map(function (g) { return g.dx; })),
            dys: uniq(cs.map(function (g) { return g.dy; })),
            upperDxs: uniq(upper.map(function (g) { return g.dx; })),
            upperDys: uniq(upper.map(function (g) { return g.dy; })),
            positions: cs.map(function (g) { return g.dx + "," + g.dy; })
        };
    }
    function sheetFacts(i) {
        var svg = sheetNode(i);
        if (!svg) return { found: false, page: i };
        var tr = transformed(i) || [];
        var cont = containers(i) || [];
        var rot = tr.filter(function (g) { return g.exact && g.angle !== null; });
        var styles = list("[style]", svg);
        var fillCount = {};
        for (var s = 0; s < styles.length; s++) {
            var st = String(styles[s].getAttribute("style") || "");
            var mm = /fill:\s*(#[0-9a-fA-F]{3,8})/.exec(st);
            if (mm) { var h = mm[1].toLowerCase(); fillCount[h] = (fillCount[h] || 0) + 1; }
        }
        return {
            found: true, page: i,
            viewBox: attr(svg, "viewBox"), width: attr(svg, "width"), height: attr(svg, "height"),
            nodeCount: tr.length, containerCount: cont.length, rotateCount: rot.length,
            sides: sideFacts(i),
            positions: cont.map(function (g) { return g.dx + "," + g.dy; }),
            rotations: rot.map(function (g) { return { dx: g.dx, dy: g.dy, angle: g.angle, tag: g.tag, depth: g.depth, children: g.children }; }),
            fills: fillCount,
            byteLen: safe(function () { return pages()[i].getSVG().length; })
        };
    }
    function fillOfId(i, id) {
        var svg = sheetNode(i);
        if (!svg) return { found: false, page: i, id: id };
        var nodes = svg.querySelectorAll('[id="' + id + '"]');
        var out = [];
        for (var k = 0; k < nodes.length; k++) {
            var st = String(nodes[k].getAttribute("style") || "");
            var m = /fill:\s*([^;]+)/.exec(st);
            out.push(m ? m[1].trim().toLowerCase() : null);
        }
        return { found: nodes.length > 0, page: i, id: id, count: nodes.length, fills: out, first: out.length ? out[0] : null };
    }
    function codeTexts(i) {
        // The per-card code is printed by CardPrinter.printAt with area.angle -90, and printAt appends
        // into `side` - which for the code is renderCard's OWN side, i.e. the blankCardContainer frame,
        // not the unitCardContainer face that renderUnit/renderPlace/renderText clone for the same slot.
        // A painted slot therefore holds TWO unrotated depth-1 clones and only the frame carries the
        // rotate(-90) code node, so the frames are filtered out of containers() here: mapping every
        // unrotated clone (the pre-correction behaviour, 18 entries for 9 cards) would return 9 empty
        // strings interleaved with the 9 real codes and `codeOrder` would stop being the print order.
        // Filtering also makes the "hide card id" option read as an EMPTY list (0 frames) instead of a
        // list of empty strings, while `sides(i).upper` stays at 18 and remains the control that proves
        // the artwork is still there and only the code went away.
        var cont = containers(i);
        if (!cont) return null;
        var out = [];
        for (var c = 0; c < cont.length; c++) {
            var g = cont[c];
            var inner = g.n.getElementsByTagName("*");
            var found = null;
            for (var k = 0; k < inner.length; k++) {
                var tr = inner[k].getAttribute ? String(inner[k].getAttribute("transform") || "") : "";
                if (/rotate\(-90[,)]/.test(tr)) { found = inner[k]; break; }
            }
            if (!found) continue;
            var spans = found.getElementsByTagName("tspan");
            var s = "";
            for (var j = 0; j < spans.length; j++) s += txt(spans[j]);
            out.push({ k: out.length, dx: g.dx, dy: g.dy, code: s, hasCodeNode: true, unrotatedClones: cont.length });
        }
        return out;
    }
    function tspanRuns(i) {
        // multi-line text boxes: every <text> whose tspan count is > 1, with the tspans' y values.
        var svg = sheetNode(i);
        if (!svg) return null;
        var texts = svg.getElementsByTagName("text");
        var out = [];
        for (var k = 0; k < texts.length; k++) {
            var sp = texts[k].getElementsByTagName("tspan");
            if (sp.length < 2) continue;
            var ys = [], xs = [], s = "";
            for (var j = 0; j < sp.length; j++) { ys.push(num(attr(sp[j], "y"))); xs.push(num(attr(sp[j], "x"))); s += txt(sp[j]) + "\n"; }
            out.push({ k: out.length, lines: sp.length, ys: ys, xs: xs, ySpread: (ys.length > 1 && ys[0] !== null && ys[ys.length - 1] !== null) ? Math.round((ys[ys.length - 1] - ys[0]) * 1000) / 1000 : null, text: s.slice(0, 200) });
        }
        return out;
    }

    // ---------- snapshot ----------
    function snapshot() {
        var a = app() || {};
        var dp = a.deckPainter || null;
        var ps = dp && dp.pages ? dp.pages : null;
        var db = a.database && a.database.index ? a.database.index : null;
        var stats = a.selectedStats || {};
        var selCards = a.selectedCards || {};
        var selIds = a.selectedIds || {};
        var selData = a.selectedData || [];
        return {
            probe: "rb-probe/stampadia-generals/1",
            ready: !!document.querySelector(".shoproot") && !!db && !!dp,
            booted: !!document.querySelector(".shoproot"),
            dbLoaded: !!db,
            url: safe(function () { return location.pathname; }),
            title: safe(function () { return document.title; }),
            errors: capturedErrors.slice(),
            app: {
                hasApp: !!appGetter,
                tab: a.tab === undefined ? null : a.tab,
                busy: a.busy === undefined ? null : !!a.busy,
                hideCardId: a.hideCardId === undefined ? null : !!a.hideCardId,
                devEnabled: a.devEnabled === undefined ? null : !!a.devEnabled,
                cheatStatus: a.cheatStatus === undefined ? null : a.cheatStatus,
                dbLen: db ? db.length : -1,
                dbOrder: db ? db.map(function (it) { return it.meta.id; }) : [],
                dbTypes: db ? db.map(function (it) { return it.meta.type; }) : [],
                dbNames: db ? db.map(function (it) { return it.meta.name; }) : [],
                dbLangs: db ? db.map(function (it) { return it.meta.language; }) : [],
                dbRecent: db ? db.map(function (it) { return it.recentType; }) : [],
                dbCards: db ? db.map(function (it) { return it.meta.cardsCount; }) : [],
                selectedIds: Object.keys(selIds).sort(),
                selectedDataIds: selData.map(function (it) { return it.meta.id; }),
                selectedDataNames: selData.map(function (it) { return it.meta.name; }),
                selectedCardsLen: Object.keys(selCards).sort().map(function (k) { return [k, selCards[k] ? selCards[k].length : -1]; }),
                selectedCardsFirst: Object.keys(selCards).sort().map(function (k) { return [k, selCards[k] && selCards[k].length ? selCards[k].slice(0, 6) : []]; }),
                stats: { cards: stats.cards === undefined ? null : stats.cards, unitCards: stats.unitCards === undefined ? null : stats.unitCards,
                         eventCards: stats.eventCards === undefined ? null : stats.eventCards, textCards: stats.textCards === undefined ? null : stats.textCards },
                statsKeys: Object.keys(stats).sort(),
                pages: ps ? ps.length : -1,
                tabCount: a.tabBarOptions ? a.tabBarOptions.length : -1,
                profiles: dp && dp.PROFILES ? dp.PROFILES.map(function (p) { return p.id; }) : [],
                cardBacks: dp && dp.CARDBACKS ? dp.CARDBACKS.map(function (p) { return p.id; }) : [],
                papers: dp && dp.PAPERS ? dp.PAPERS.map(function (p) { return p.id; }) : []
            },
            dom: {
                shoproot: !!document.querySelector(".shoproot"),
                tabbar: tabbarFacts(),
                deckRows: deckRowFacts(),
                recap: recapFacts(),
                moduleRows: moduleRowFacts(),
                setRows: setRowFacts(),
                cardRows: cardRowFacts(),
                actions: actionFacts(),
                selects: selectFacts(),
                checkboxes: checkboxFacts(),
                welcome: welcomeFacts(),
                printsChildren: safe(function () { var p = document.querySelector(".list.prints"); return p ? p.children.length : -1; }),
                counts: {
                    tabbar: list(".tabbar .item").length, deckRows: list(".list.decks .row").length,
                    deckSelected: list(".list.decks .row.selected").length,
                    printsRows: list(".list.prints .row").length, moduleRows: moduleRowFacts().length,
                    setRows: list(".list.prints .row.selectable").length, cardRows: list(".list.prints .card").length,
                    cardSelected: list(".list.prints .card.selected").length,
                    actions: list(".actionbutton").length, selects: list(".list.prints select").length,
                    recapRows: list(".list.prints .recapheader .tablerow").length,
                    tips: list(".list.prints .tips").length, warntips: list(".list.prints .warntips").length,
                    testids: list("[data-testid^='rb-']").length
                }
            },
            paint: { pages: ps ? ps.length : -1 },
            // ---- methods (recomputed on every call) ----
            tab: function (i) { return safe(function () { return tabbarFacts()[i] || { found: false, i: i }; }); },
            tabByText: function (t) { return safe(function () { var f = tabbarFacts().filter(function (x) { return x.text === t; }); return f.length === 1 ? f[0] : { found: false, text: t, matches: f.length }; }); },
            deck: function (i) { return safe(function () { return deckRowFacts()[i] || { found: false, i: i }; }); },
            deckByCode: function (c) { return safe(function () { var f = deckRowFacts().filter(function (x) { return x.code === c; }); return f.length === 1 ? f[0] : { found: false, code: c, matches: f.length }; }); },
            recapAt: function (label) { return safe(function () { var r = recapFacts(); if (!r.found) return { found: false, label: label, why: "no recapheader" }; var f = r.rows.filter(function (x) { return x.label === label; }); return f.length === 1 ? Object.assign({ found: true }, f[0]) : { found: false, label: label, matches: f.length, labels: r.rows.map(function (x) { return x.label; }) }; }); },
            recapLabels: function () { return safe(function () { var r = recapFacts(); return r.found ? r.rows.map(function (x) { return x.label; }) : { found: false }; }); },
            module: function (i) { return safe(function () { return moduleRowFacts()[i] || { found: false, i: i }; }); },
            moduleTableAt: function (i, label) { return safe(function () { var m = moduleRowFacts()[i]; if (!m) return { found: false, i: i, label: label }; var f = m.table.filter(function (x) { return x.label === label; }); return f.length === 1 ? f[0] : { found: false, i: i, label: label, matches: f.length, labels: m.table.map(function (x) { return x.label; }) }; }); },
            set: function (i) { return safe(function () { return setRowFacts()[i] || { found: false, i: i }; }); },
            card: function (i) { return safe(function () { return cardRowFacts()[i] || { found: false, i: i }; }); },
            cardNames: function () { return safe(function () { return cardRowFacts().map(function (x) { return x.name; }); }); },
            action: function (i) { return safe(function () { return actionFacts()[i] || { found: false, i: i }; }); },
            actionByText: function (t) { return safe(function () { var f = actionFacts().filter(function (x) { return x.text === t; }); return f.length === 1 ? Object.assign({ found: true }, f[0]) : { found: false, text: t, matches: f.length }; }); },
            select: function (i) { return safe(function () { return selectFacts()[i] || { found: false, i: i }; }); },
            sheet: function (i) { return safe(function () { return sheetFacts(i === undefined ? 0 : i); }); },
            sheetPositions: function (i) { return safe(function () { var f = sheetFacts(i === undefined ? 0 : i); return f.found ? f.positions : f; }); },
            sheetRotations: function (i) { return safe(function () { var f = sheetFacts(i === undefined ? 0 : i); return f.found ? f.rotations : f; }); },
            sides: function (i) { return safe(function () { return sideFacts(i === undefined ? 0 : i); }); },
            lowerAngles: function (i) { return safe(function () { var f = sideFacts(i === undefined ? 0 : i); return f.found ? f.lowerAngleUniq : f; }); },
            lowerCount: function (i) { return safe(function () { var f = sideFacts(i === undefined ? 0 : i); return f.found ? f.lower : f; }); },
            gridDx: function (i) { return safe(function () { var f = sideFacts(i === undefined ? 0 : i); return f.found ? f.dxs.join(",") : f; }); },
            gridDy: function (i) { return safe(function () { var f = sideFacts(i === undefined ? 0 : i); return f.found ? f.dys.join(",") : f; }); },
            fillOf: function (i, id) { return safe(function () { return fillOfId(i === undefined ? 0 : i, id); }); },
            codes: function (i) { return safe(function () { return codeTexts(i === undefined ? 0 : i); }); },
            codeAt: function (i, slot) { return safe(function () { var c = codeTexts(i === undefined ? 0 : i); if (!c) return { found: false }; return c[slot] || { found: false, slot: slot, have: c.length }; }); },
            codeOrder: function (i) { return safe(function () { var c = codeTexts(i === undefined ? 0 : i); return c ? c.map(function (x) { return x.code; }) : { found: false }; }); },
            multiLine: function (i) { return safe(function () { return tspanRuns(i === undefined ? 0 : i); }); },
            // Read-only evidence dump for the side filter: EVERY node of a painted sheet whose transform
            // matches the translate/rotate grammar, with the facts the filter keys on (depth, childNodes,
            // descendant count, template id) plus its parent. Published so the filter is chosen from a
            // measurement of the painted sheet and not from reading the seed source alone, and so the
            // calibration record can show that no template original survives SVG.finalize().
            sideCensus: function (i) { return safe(function () {
                var page = i === undefined ? 0 : i;
                var tr = transformed(page);
                if (!tr) return { found: false, page: page };
                var out = [], byDepth = {}, withId = 0;
                for (var k = 0; k < tr.length; k++) {
                    var g = tr[k];
                    byDepth[g.depth] = (byDepth[g.depth] || 0) + 1;
                    if (g.id) withId++;
                    out.push({ k: k, tag: g.tag, id: g.id, depth: g.depth, children: g.children,
                               desc: g.n.getElementsByTagName ? g.n.getElementsByTagName("*").length : -1,
                               dx: g.dx, dy: g.dy, angle: g.angle,
                               parentTag: g.n.parentNode ? String(g.n.parentNode.nodeName || "").toLowerCase() : null,
                               parentId: (g.n.parentNode && g.n.parentNode.getAttribute) ? g.n.parentNode.getAttribute("id") : null });
                }
                var cs = cardSides(page) || [];
                return { found: true, page: page, exact: tr.length, byDepth: byDepth, withTemplateId: withId,
                         sides: cs.length,
                         upper: cs.filter(function (g) { return g.angle === null; }).length,
                         lower: cs.filter(function (g) { return g.angle !== null; }).length,
                         nodes: out };
            }); },
            allSheets: function () { return safe(function () { var ps = pages(); if (!ps) return { found: false }; var out = []; for (var i = 0; i < ps.length; i++) out.push(sheetFacts(i)); return out; }); }
        };
    }

    // ---------- command surface ----------
    function resolve(ref) {
        if (typeof ref !== "string" || !ref.length) return null;
        var i = ref.indexOf(":");
        if (i < 0) return document.querySelector(ref);
        var kind = ref.slice(0, i), rest = ref.slice(i + 1);
        if (kind === "testid") return document.querySelector('[data-testid="' + rest + '"]');
        if (kind === "id") return document.getElementById(rest);
        if (kind === "css") return document.querySelector(rest);
        if (kind === "nth") {
            var p = rest.split("|");
            var l = list(p[0]);
            return l[Number(p[1])] || null;
        }
        if (kind === "text") {
            var q = rest.split("|");
            var cands = list(q[0]);
            for (var k = 0; k < cands.length; k++) if (txt(cands[k]) === q[1]) return cands[k];
            return null;
        }
        if (kind === "contains") {
            var r2 = rest.split("|");
            var c2 = list(r2[0]);
            for (var j = 0; j < c2.length; j++) if (txt(c2[j]).indexOf(r2[1]) >= 0) return c2[j];
            return null;
        }
        return null;
    }
    function click(node) {
        if (!node) return false;
        try {
            node.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
            return true;
        } catch (e) { return false; }
    }
    function notFound(what, ref) { return { found: false, what: what, ref: ref === undefined ? null : String(ref), errors: capturedErrors.length }; }
    var CMD = {
        clickNode: function (ref) { var n = safe(function () { return resolve(ref); }); if (!n || n === ERR) return notFound("clickNode", ref); return { found: true, what: "clickNode", ref: String(ref), clicked: click(n), tag: String(n.nodeName || ""), cls: String(n.className || ""), text: txt(n).slice(0, 60) }; },
        clickTab: function (label) { var f = safe(function () { return tabbarFacts().filter(function (x) { return x.text === label; }); }); if (!f || f.length !== 1) return notFound("clickTab", label); var n = list(".tabbar .item")[f[0].i]; return { found: true, what: "clickTab", label: label, clicked: click(n) }; },
        clickDeckByCode: function (code) { var f = safe(function () { return deckRowFacts().filter(function (x) { return x.code === code; }); }); if (!f || f.length !== 1) return notFound("clickDeckByCode", code); var n = list(".list.decks .row")[f[0].i]; return { found: true, what: "clickDeckByCode", code: code, clicked: click(n), wasSelected: f[0].selected }; },
        clickDeck: function (i) { var n = list(".list.decks .row")[Number(i)]; if (!n) return notFound("clickDeck", i); return { found: true, what: "clickDeck", i: Number(i), clicked: click(n), code: txt(n.querySelector(".title .code")) }; },
        clickCard: function (i) { var n = list(".list.prints .card")[Number(i)]; if (!n) return notFound("clickCard", i); return { found: true, what: "clickCard", i: Number(i), clicked: click(n), wasSelected: /\bselected\b/.test(String(n.className || "")) }; },
        clickCardByName: function (name) { var f = safe(function () { return cardRowFacts().filter(function (x) { return x.name === name; }); }); if (!f || f.length !== 1) return notFound("clickCardByName", name); var n = list(".list.prints .card")[f[0].i]; return { found: true, what: "clickCardByName", name: name, clicked: click(n), matches: f.length }; },
        clickSet: function (i) { var n = list(".list.prints .row.selectable")[Number(i === undefined ? 0 : i)]; if (!n) return notFound("clickSet", i); return { found: true, what: "clickSet", i: Number(i || 0), clicked: click(n), code: txt(n.querySelector(".title .code")) }; },
        clickAction: function (label) { var f = safe(function () { return actionFacts().filter(function (x) { return x.text === (label === undefined ? "Download" : label); }); }); if (!f || f.length !== 1) return notFound("clickAction", label); var n = list(".actionbutton")[f[0].i]; return { found: true, what: "clickAction", label: f[0].text, clicked: click(n) }; },
        setSelect: function (i, value) {
            var sels = list(".list.prints select");
            var s = sels[Number(i)];
            if (!s) return notFound("setSelect", i);
            var hit = null;
            for (var k = 0; k < s.options.length; k++) if (String(s.options[k].value) === String(value)) hit = s.options[k];
            if (!hit) return { found: false, what: "setSelect", i: Number(i), value: String(value), have: Array.prototype.map.call(s.options, function (o) { return String(o.value); }) };
            s.value = String(value);
            try { s.dispatchEvent(new window.Event("change", { bubbles: true })); } catch (e) { return { found: true, what: "setSelect", changed: false, err: String(e).slice(0, 120) }; }
            return { found: true, what: "setSelect", i: Number(i), value: String(value), changed: true, now: String(s.value) };
        },
        setCheckbox: function (i, checked) {
            var boxes = list(".list.prints input[type=checkbox]");
            var b = boxes[Number(i)];
            if (!b) return notFound("setCheckbox", i);
            b.checked = !!checked;
            try { b.dispatchEvent(new window.Event("change", { bubbles: true })); } catch (e) { return { found: true, what: "setCheckbox", changed: false, err: String(e).slice(0, 120) }; }
            return { found: true, what: "setCheckbox", i: Number(i), checked: !!b.checked, changed: true };
        },
        reload: function () { return { found: true, what: "reload", note: "no-op: use the runner's reload action" }; },
        probeVersion: function () { return { found: true, what: "probeVersion", version: 1 }; }
    };

    Object.defineProperty(window, "__RB_PUBLISH_APP__", {
        configurable: true, enumerable: false,
        value: function (getter) { if (typeof getter === "function") appGetter = getter; return !!appGetter; }
    });
    Object.defineProperty(window, "__SP__", { configurable: true, enumerable: false, value: function () { return safe(snapshot) || { ready: false, probe: "rb-probe/stampadia-generals/1", fatal: true }; } });
    Object.defineProperty(window, "__SP_CMD__", { configurable: true, enumerable: false, value: CMD });
})();

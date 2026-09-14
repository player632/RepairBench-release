#!/usr/bin/env node
// dsl_runner.mjs - RepairBench DSL checkpoint runner.
// Usage: node dsl_runner.mjs --dsl <dsl.json> --base-url <url> --timeout <ms> --out <results.json> [--channel chromium] [--task id]
// Semantics: one isolated browser
// context per checkpoint; locators resolve via data-testid (role= prefix for
// role-based locators, trailing-* wildcard prefixes); diagnostic order is
// locator existence -> visibility -> behavior.
import fs from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
function opt(name, dflt) { const i = args.indexOf(name); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt; }
const dslPath = opt("--dsl");
const baseUrl = (opt("--base-url", "http://127.0.0.1:8080")).replace(/\/$/, "");
const baseTimeout = Number(opt("--timeout", "15000"));
const outPath = opt("--out");
const onlyIds = opt("--only"); // optional comma-separated checkpoint-id shard filter (additive)
if (!dslPath || !outPath) { console.error("usage: node dsl_runner.mjs --dsl <dsl.json> --base-url <url> --timeout <ms> --out <results.json>"); process.exit(2); }

// 30 s readiness timeout, so slow application boots are not reported as failures
// (s2d ng-alain: table rows never appeared within 15s under concurrent builds; isolated probes boot <1s)
const LOCATOR_TIMEOUT = 30000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// optional named-script registry (drawdb / vue-fabric-editor / fortune-sheet)
let scriptRegistry = {};
try { scriptRegistry = (await import("./dsl_lib.mjs")).scripts || {}; } catch (e) { /* no lib */ }

const dsl = JSON.parse(fs.readFileSync(dslPath, "utf8"));
const dslContext = dsl.context || {};

class CheckpointFailure extends Error {
  constructor(failureType, detail) { super(detail); this.failureType = failureType; this.detail = detail; }
}

function fmt(v) {
  if (v === null || v === undefined) return "<null>";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function assertEq(expected, actual, loose = false) {
  if (loose) return actual == expected;
  if (actual === expected) return true;
  if (typeof expected === "number" && typeof actual === "string") return actual.trim() === String(expected);
  if (typeof expected === "string" && typeof actual === "number") return String(actual) === expected.trim();
  return false;
}

// [sweep fix 2026-09-04] whitespace normalization for text comparisons: innerText
// inserts \n at block boundaries; archived expected values were calibrated with
// whitespace runs collapsed to single spaces (takenote CP-P09 et al).
function normText(x) { return String(x ?? "").replace(/\s+/g, " ").trim(); }

function normUrl(pageUrl) {
  const u = new URL(pageUrl);
  let s = u.pathname + u.search + u.hash;
  return s;
}

// ---- locator resolution ----
function resolveLocator(scope, target) {
  if (!target) return scope;
  if (target === "html" || target === "body" || target === "document") {
    const root = scope._page || scope;
    return root.locator(target === "document" ? "html" : target);
  }
  if (String(target).startsWith("role=")) {
    const role = String(target).slice(5);
    return scope.getByRole(role);
  }
  if (String(target).startsWith("text=")) {
    return scope.getByText(String(target).slice(5)).first();
  }
  const t = String(target);
  // [main-session fix 2026-09-03] corpus target syntax "aria-label=<text>"
  if (t.startsWith("aria-label=")) {
    const v = t.slice("aria-label=".length);
    return scope.locator(`[aria-label="${v}"]`).or(scope.getByLabel(v, { exact: false })).first();
  }
  // [sweep fix 2026-09-04] generic attribute=value target syntax
  // (aria-pressed=false, aria-expanded=false, aria-checked=true, ...)
  const attrEq = t.match(/^([a-zA-Z][a-zA-Z0-9-]*)=([\s\S]*)$/);
  if (attrEq) {
    return scope.locator(`[${attrEq[1]}="${attrEq[2]}"]`).first();
  }
  if (t.includes("*")) {
    const prefix = t.split("*")[0];
    const suffix = t.split("*").pop();
    if (t.endsWith("*")) return scope.locator(`[data-testid^="${prefix}"]`);
    if (t.startsWith("*")) return scope.locator(`[data-testid$="${suffix}"]`);
    return scope.locator(`[data-testid*="${t.replace(/\*/g, "")}"]`);
  }
  return scope.getByTestId(t);
}

// count/order/count-delta asserts need the FULL match set; resolveLocator's
// attr=/aria-label=/text= branches cap at .first() for single-element actions,
// which silently clamps counts to <=1: a count assert over three matching
// elements would read 1.
function resolveLocatorMany(scope, target) {
  const t = String(target || "");
  // [2026-09-04] role= must resolve via getByRole (implicit ARIA role); the generic
  // attr=value branch below would turn "role=row" into [role="row"] (explicit attribute),
  // which silently counts 0 on framework tables whose <tr> has no explicit role
  // (ng-alain CP-11/12/33/35 "expected 11, actual 0" - repro: single-CP dsl_runner run).
  if (t.startsWith("role=")) return scope.getByRole(t.slice(5));
  if (t.startsWith("aria-label=")) {
    const v = t.slice("aria-label=".length);
    return scope.locator(`[aria-label="${v}"]`).or(scope.getByLabel(v, { exact: false }));
  }
  const attrEq = t.match(/^([a-zA-Z][a-zA-Z0-9-]*)=([\s\S]*)$/);
  if (attrEq) return scope.locator(`[${attrEq[1]}="${attrEq[2]}"]`);
  if (t.startsWith("text=")) return scope.getByText(t.slice(5));
  return resolveLocator(scope, target);
}

// [sweep fix 2026-09-04] for aria-label targets used with fill/value, prefer the
// actual editable control: some component libs mirror aria-label on a wrapper too,
// and DOM-order-first union resolution can pick the wrapper over the input.
async function preferEditable(scope, target, baseLoc) {
  const t = String(target || "");
  if (!t.startsWith("aria-label=")) return baseLoc;
  const v = t.slice("aria-label=".length);
  const editable = scope.locator(`input[aria-label="${v}"], textarea[aria-label="${v}"], select[aria-label="${v}"], [contenteditable][aria-label="${v}"]`);
  try { if (await editable.count() > 0) return editable.first(); } catch (e) { /* fall through */ }
  return baseLoc;
}

function getScope(page, step) {
  let scope = page;
  if (step && step.within) scope = page.getByTestId(step.within);
  if (step && step.frame) scope = resolveFrame(page, step.frame);
  return scope;
}

function frameSelector(frameRef) {
  // frame ref: iframe name, id, testid, or fall back to the first iframe
  return `iframe[name="${frameRef}"], iframe#${frameRef}, iframe[data-testid="${frameRef}"], iframe[data-testid="${frameRef}-iframe"], iframe`;
}

function resolveFrame(page, frameRef) {
  const fl = page.frameLocator(frameSelector(frameRef));
  return {
    getByTestId: (t) => fl.getByTestId(t),
    getByRole: (r) => fl.getByRole(r),
    locator: (sel) => fl.locator(sel),
    _frameRef: frameRef,
    _page: page,
  };
}

async function countOf(loc) {
  try { return await loc.count(); } catch (e) { return 0; }
}

async function firstVisible(loc) {
  const n = await countOf(loc);
  for (let i = 0; i < n; i++) {
    const el = loc.nth(i);
    try { if (await el.isVisible()) return el; } catch (e) { /* next */ }
  }
  return null;
}

async function requireElement(loc, expectedDesc) {
  const n = await countOf(loc);
  if (n === 0) throw new CheckpointFailure("locator_failure", `expected ${expectedDesc}, actual "<element not found>"`);
  return loc.first();
}

// ---- state carried through one checkpoint run ----
class RunState {
  constructor(page, context) {
    this.page = page;
    this.context = context;
    this.tags = {};            // tag -> {texts: {target: text}}
    this.preTagCounts = {};    // tag -> {target: count} captured before tagged action
    this.requestCount = null;  // {target, count}
  }
  activePage() {
    // actions stay on the checkpoint's original page; context-open only adds pages
    return this.context.pages()[0] || this.page;
  }
}

async function textOf(loc) {
  const el = await requireElement(loc, "<text>");
  // [main-session fix 2026-09-03] innerText = render-aware (applies CSS
  // text-transform), matching the archived Windows/msedge runner semantics.
  return await el.innerText().catch(() => el.textContent()) ?? "";
}

// ---- observe_at snapshot helpers ----
// attribute-aware + bounded poll: the observed element may mount a moment after
// the tagged wait (hydration races); poll until it settles at the expected value
// or LOCATOR_TIMEOUT expires (engine-wide poll semantics).
function snapshotAttrOf(a) {
  if (a.type !== "aria" && a.type !== "attr") return null;
  if (a.expected && typeof a.expected === "object") return String(a.expected.attribute);
  const str = String(a.expected);
  const i = str.indexOf("=");
  return i >= 0 ? str.slice(0, i) : str;
}
function snapshotWant(a) {
  if (a.expected && typeof a.expected === "object") return String(a.expected.value ?? "");
  const str = String(a.expected);
  const i = str.indexOf("=");
  return i >= 0 ? str.slice(i + 1) : "";
}
function snapshotMatches(a, value) {
  if (snapshotAttrOf(a) !== null) return value === snapshotWant(a);
  const match = a.match || (a.type === "text-regex" ? "regex" : "exact");
  const text = normText(value);
  if (match === "contains") return text.includes(normText(a.expected));
  if (match === "not_contains") return !text.includes(normText(a.expected));
  if (match === "regex") return new RegExp(a.expected).test(text);
  return text === normText(a.expected);
}
async function captureSnapshot(state, a) {
  const attr = snapshotAttrOf(a);
  const kind = attr !== null ? "attr" : "text";
  const t0 = Date.now();
  let lastValue = null;
  let found = false;
  for (;;) {
    try {
      const loc = resolveLocator(state.activePage(), a.target); // [figmaboy-G1 fix 2026-09-04] pass the testid string, not the assert object (String(a) === "[object Object]" never matches)
      if (await countOf(loc) > 0) {
        found = true;
        const el = loc.first();
        const v = attr !== null ? await el.getAttribute(attr) : (await el.innerText().catch(() => el.textContent()) ?? "");
        lastValue = v;
        if (v !== null && snapshotMatches(a, v)) break;
      }
    } catch (e) { /* element not ready yet */ }
    if (Date.now() - t0 >= LOCATOR_TIMEOUT) break;
    await sleep(200);
  }
  if (!found) return { kind, value: "\u0000__missing__" };
  return { kind, value: lastValue };
}

// ---- setup actions ----
async function execAction(state, step, cp) {
  if (process.env.WLB_DEBUG_STEPS) console.error(`[step] ${cp.id}: ${step.action} ${step.target ?? ""} ${step.value ?? ""}`);
  const page = state.activePage();
  const act = step.action;
  const tag = step.tag;
  // count-delta pre-capture happens before the tagged action
  if (tag && cp._deltaTargets) {
    for (const dt of cp._deltaTargets[tag] || []) {
      state.preTagCounts[tag] = state.preTagCounts[tag] || {};
      state.preTagCounts[tag][dt] = await countOf(resolveLocatorMany(page, dt));
    }
  }
  switch (act) {
    case "goto": {
      const url = String(step.target).startsWith("http") ? step.target : baseUrl + step.target;
      // The static server can die mid-run under memory pressure; run.sh
      // supervises and respawns it, so retry the goto briefly on connection
      // errors instead of recording the checkpoint as failed.
      let gotoErr = null;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          await page.goto(url, { waitUntil: "load", timeout: 60000 });
          gotoErr = null;
          break;
        } catch (e) {
          gotoErr = e;
          if (!/ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ECONNREFUSED/.test(String(e.message || e))) break;
          if (attempt < 4) await sleep(900);
        }
      }
      if (gotoErr) throw new CheckpointFailure("setup_failure", `setup goto ${step.target}: ${String(gotoErr.message || gotoErr).split("\n")[0]}`);
      // implicit settle: offline SPAs need the post-load quiet window to mount
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      break;
    }
    case "wait": {
      const ms = Number(step.value || 0);
      const target = step.target;
      if (!target || target === "page") {
        await sleep(ms);
      } else {
        const loc = resolveLocator(getScope(page, step), target);
        try {
          await loc.first().waitFor({ state: "visible", timeout: LOCATOR_TIMEOUT });
        } catch (e) {
          throw new CheckpointFailure("setup_failure", `setup wait ${target}: ${String(e.message || e).split("\n")[0]}`);
        }
      }
      if (tag) {
        // capture observe_at snapshots for asserts referencing this tag
        const entries = [];
        for (const a of cp._observeAsserts[tag] || []) entries.push(await captureSnapshot(state, a));
        state.tags[tag] = { entries };
      }
      break;
    }
    case "fill": {
      const fillScope = getScope(page, step);
      const loc = await preferEditable(fillScope, step.target, resolveLocator(fillScope, step.target));
      try { await loc.fill(String(step.value ?? ""), { timeout: LOCATOR_TIMEOUT }); }
      catch (e) {
        let diag = "";
        try {
          diag = await page.evaluate((tid) => {
            const el = document.querySelector(`[data-testid="${tid}"]`);
            if (!el) return "el=absent";
            const r = el.getBoundingClientRect();
            return `el=${el.tagName} rect=${Math.round(r.width)}x${Math.round(r.height)} disabled=${el.disabled} readOnly=${el.readOnly} type=${el.type || ""} offsetParent=${el.offsetParent !== null}`;
          }, String(step.target));
        } catch (e2) { diag = "diag-err"; }
        throw new CheckpointFailure("setup_failure", `setup fill ${step.target}: ${String(e.message || e).split("\n")[0]} [${diag}]`);
      }
      break;
    }
    case "click": {
      const loc = resolveLocator(getScope(page, step), step.target);
      try {
        const opts = { timeout: LOCATOR_TIMEOUT };
        if (step.value === "Shift") opts.modifiers = ["Shift"];
        else if (step.value === "Control") opts.modifiers = ["Control"];
        else if (step.value === "Alt") opts.modifiers = ["Alt"];
        if (step.frame) {
          const fr = page.frameLocator(frameSelector(step.frame));
          await fr.getByTestId(step.target).click(opts);
        } else {
          await loc.first().click(opts);
        }
      } catch (e) {
        if (e instanceof CheckpointFailure) throw e;
        throw new CheckpointFailure("setup_failure", `setup click ${step.target}: ${String(e.message || e).split("\n")[0]}`);
      }
      break;
    }
    case "dblclick": {
      try {
        if (step.frame) {
          const fr = page.frameLocator(frameSelector(step.frame));
          await fr.getByTestId(step.target).dblclick({ timeout: LOCATOR_TIMEOUT });
        } else {
          const loc = resolveLocator(getScope(page, step), step.target);
          await loc.first().dblclick({ timeout: LOCATOR_TIMEOUT });
        }
      } catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup dblclick ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      break;
    }
    case "rightclick": {
      const loc = resolveLocator(getScope(page, step), step.target);
      try { await loc.first().click({ button: "right", timeout: LOCATOR_TIMEOUT }); }
      catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup rightclick ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      break;
    }
    case "hover": {
      const loc = resolveLocator(getScope(page, step), step.target);
      try { await loc.first().hover({ timeout: LOCATOR_TIMEOUT }); }
      catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup hover ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      break;
    }
    case "press": {
      // Headless Chromium never turns Ctrl/Cmd+V into a `paste` event (no OS
      // clipboard round-trip); arm a detector before the press so that
      // compensation applies only when the real event did not fire, which keeps
      // double-paste out of real-browser runs. fortune-sheet F02 depends on it.
      const isPasteCombo = /^(control|meta|ctrl)\+v$/i.test(String(step.value || "").trim());
      if (isPasteCombo) {
        await page.evaluate(() => {
          window.__wlbPasteFired = false;
          document.addEventListener("paste", () => { window.__wlbPasteFired = true; }, { capture: true, once: true });
        }).catch(() => {});
      }
      if (!step.target || step.target === "page") {
        await page.keyboard.press(String(step.value));
      } else {
        const loc = resolveLocator(getScope(page, step), step.target);
        try { await loc.first().press(String(step.value), { timeout: LOCATOR_TIMEOUT }); }
        catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup press ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      }
      if (isPasteCombo) {
        try {
          await sleep(150);
          const fired = await page.evaluate(() => window.__wlbPasteFired === true);
          if (!fired) {
            await page.evaluate(async () => {
              let text = "";
              try { text = await navigator.clipboard.readText(); } catch (e) { /* empty */ }
              const dt = new DataTransfer();
              dt.setData("text/plain", text);
              const ev = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt });
              (document.activeElement || document.body).dispatchEvent(ev);
            });
          }
        } catch (e) { /* best effort */ }
      }
      // [sweep fix 2026-09-04] headless Chromium does not dispatch a `copy` event
      // for Ctrl/Cmd+C with a collapsed selection (real Windows Chrome/Edge does);
      // keyboard-copy paths (svgomg CP-31) depend on it. Compensate after the press.
      if (/^(control|meta|ctrl)\+c$/i.test(String(step.value || "").trim())) {
        try {
          const collapsed = await page.evaluate(() => {
            const sel = window.getSelection();
            return !sel || sel.isCollapsed;
          });
          if (collapsed) {
            await page.evaluate(() => {
              const target = document.activeElement || document.body;
              target.dispatchEvent(new ClipboardEvent("copy", { bubbles: true, cancelable: true }));
            });
          }
        } catch (e) { /* best effort */ }
      }
      break;
    }
    case "select": {
      const loc = resolveLocator(getScope(page, step), step.target);
      try {
        const el = loc.first();
        await el.waitFor({ state: "attached", timeout: LOCATOR_TIMEOUT });
        const v = String(step.value ?? "");
        try { await el.selectOption(v, { timeout: LOCATOR_TIMEOUT }); }
        catch (e1) { await el.selectOption(v.split(","), { timeout: LOCATOR_TIMEOUT }); }
      } catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup select ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      break;
    }
    case "vselect": {
      // custom (non-native) select: open, then click the option matching value
      const loc = resolveLocator(page, step.target);
      try {
        const el = loc.first();
        await el.waitFor({ state: "visible", timeout: LOCATOR_TIMEOUT });
        const tag = await el.evaluate((n) => n.tagName.toLowerCase());
        if (tag === "select") { await el.selectOption(String(step.value)); break; }
        await el.click({ timeout: LOCATOR_TIMEOUT });
        await sleep(350);
        const want = String(step.value).toLowerCase();
        const option = page.locator(`li, .option, [role="option"], .dropdown-item, .select-item, .v-select-option, [class*="option"]`).filter({ hasText: new RegExp(`^\\s*${String(step.value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") });
        const vis = await firstVisible(option);
        if (vis) { await vis.click({ timeout: LOCATOR_TIMEOUT }); }
        else {
          const anyOpt = page.getByText(String(step.value), { exact: false });
          const vis2 = await firstVisible(anyOpt);
          if (!vis2) throw new Error(`vselect option "${step.value}" not found`);
          await vis2.click({ timeout: LOCATOR_TIMEOUT });
        }
        await sleep(250);
      } catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup vselect ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      break;
    }
    case "blur": {
      const loc = resolveLocator(getScope(page, step), step.target);
      try { await loc.first().blur({ timeout: LOCATOR_TIMEOUT }); }
      catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup blur ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      break;
    }
    case "drag": {
      const scope = getScope(page, step);
      const src = resolveLocator(scope, step.target);
      const dst = resolveLocator(scope, step.value);
      try {
        const s = await requireElement(src, `<drag-src ${step.target}>`).then((el) => el.boundingBox());
        const d = await requireElement(dst, `<drag-dst ${step.value}>`).then((el) => el.boundingBox());
        if (!s || !d) throw new Error("drag bounding box unavailable");
        await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
        await page.mouse.down();
        await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2, { steps: 12 });
        await sleep(60);
        await page.mouse.up();
        await sleep(200);
      } catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup drag ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      break;
    }
    case "mouse": {
      const m = String(step.value).match(/^(click|down|move|up|rightclick|dblclick):([-\d.]+),([-\d.]+)$/);
      if (!m) throw new CheckpointFailure("setup_failure", `setup mouse: unparsable value ${step.value}`);
      const [, op, xs, ys] = m; const x = Number(xs), y = Number(ys);
      if (op === "click") await page.mouse.click(x, y);
      else if (op === "rightclick") await page.mouse.click(x, y, { button: "right" });
      else if (op === "dblclick") await page.mouse.dblclick(x, y);
      else if (op === "down") { await page.mouse.move(x, y); await page.mouse.down(); }
      else if (op === "up") { await page.mouse.move(x, y); await page.mouse.up(); }
      else await page.mouse[op](x, y);
      break;
    }
    case "js_eval": {
      await page.evaluate(step.expr);
      break;
    }
    case "script": {
      const fn = scriptRegistry[step.target];
      if (!fn) throw new CheckpointFailure("setup_failure", `setup script: unknown script "${step.target}"`);
      try { await fn(state, step, { baseUrl, sleep, resolveLocator, requireElement, CheckpointFailure }); }
      catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup script ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      break;
    }
    case "reload": {
      await page.reload({ waitUntil: "load", timeout: 60000 });
      break;
    }
    case "back": {
      await page.goBack({ waitUntil: "load", timeout: 60000 }).catch(async () => { await page.goBack({ timeout: 60000 }); });
      break;
    }
    case "set-clipboard": {
      try { await state.context.grantPermissions(["clipboard-read", "clipboard-write"]); } catch (e) { /* best effort */ }
      await page.evaluate((v) => navigator.clipboard.writeText(v), String(step.value ?? ""));
      break;
    }
    case "context-open": {
      // corpus semantics (dashy CP-19/20): open the target's CONTEXT MENU via
      // right-click; the follow-up step clicks a menu entry. (The earlier
      // new-tab interpretation was an accidental by-product of dashy opening
      // internal links in a new tab and never exposed the menu.)
      const loc = resolveLocator(page, step.target);
      try {
        await loc.first().click({ button: "right", timeout: LOCATOR_TIMEOUT });
      } catch (e) { if (e instanceof CheckpointFailure) throw e; throw new CheckpointFailure("setup_failure", `setup context-open ${step.target}: ${String(e.message || e).split("\n")[0]}`); }
      break;
    }
    case "assert-pages": {
      const n = state.context.pages().length;
      if (n !== Number(step.expected)) throw new CheckpointFailure("behavior_failure", `setup assert-pages expected ${step.expected}, actual ${n}`);
      break;
    }
    case "count-requests": {
      const want = String(step.target);
      const win = Number(step.window_ms || 4000);
      let count = 0;
      let firstSeen = null;
      const handler = (req) => { try { if (req.url().includes(want)) { count++; if (!firstSeen) firstSeen = Date.now(); } } catch (e) { /* ignore */ } };
      page.on("request", handler);
      // align the steady-state window to the first matching request for determinism
      const deadline = Date.now() + win;
      while (!firstSeen && Date.now() < deadline) await sleep(50);
      if (firstSeen) await sleep(win);
      page.off("request", handler);
      state.requestCount = { target: want, count };
      break;
    }
    default:
      throw new CheckpointFailure("setup_failure", `setup ${act}: unknown action`);
  }
}

// ---- asserts ----
// asserts poll until the condition holds or the per-checkpoint timeout expires
// (original-runner semantics; absorbs SPA hydration and debounced updates)
async function evalAssert(state, a) {
  const deadline = Date.now() + baseTimeout;
  let lastErr = null;
  for (;;) {
    try {
      return await evalAssertOnce(state, a);
    } catch (e) {
      if (!(e instanceof CheckpointFailure)) throw e;
      lastErr = e;
      if (Date.now() >= deadline) throw lastErr;
      await sleep(150);
    }
  }
}

async function evalAssertOnce(state, a) {
  const page = state.activePage();
  const t = a.type;
  const expectDesc = fmt(a.expected !== undefined ? a.expected : (a.expr || ""));
  switch (t) {
    case "exists": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const n = await countOf(loc);
      const want = a.expected !== false;
      const got = n > 0;
      if (got !== want) throw new CheckpointFailure("behavior_failure", `expected ${want}, actual ${got}`);
      return { assertType: "exists" };
    }
    case "visible": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const want = a.expected !== false;
      let got = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const n = await countOf(loc);
        got = false;
        if (n > 0) { const vis = await firstVisible(loc); got = !!vis; }
        if (got === want) break;
        await sleep(60);
      }
      if (got !== want) throw new CheckpointFailure("behavior_failure", `expected ${want}, actual ${got}`);
      return { assertType: "visible" };
    }
    case "text":
    case "text-regex": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const text = normText(await textOf(loc));
      const match = a.match || (t === "text-regex" ? "regex" : "exact");
      let ok = false;
      if (match === "contains") ok = text.includes(normText(a.expected));
      else if (match === "not_contains") ok = !text.includes(normText(a.expected));
      else if (match === "regex") ok = new RegExp(a.expected).test(text);
      else ok = text === normText(a.expected);
      if (!ok) throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual ${fmt(text)}`);
      return { assertType: match === "regex" ? "text-regex" : "text" };
    }
    case "any_text": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const n = await countOf(loc);
      if (n === 0) throw new CheckpointFailure("locator_failure", `expected ${fmt(a.expected)}, actual "<element not found>"`);
      let ok = false;
      for (let i = 0; i < n; i++) {
        const s = normText(await loc.nth(i).innerText().catch(() => loc.nth(i).textContent()).catch(() => ""));
        const match = a.match || "contains";
        if (match === "contains" ? s.includes(normText(a.expected)) : match === "exact" ? s === normText(a.expected) : new RegExp(a.expected).test(s)) { ok = true; break; }
      }
      if (!ok) throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual <no matching element text>`);
      return { assertType: "any_text" };
    }
    case "aria": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const el = await requireElement(loc, fmt(a.expected));
      let attr, want;
      if (a.expected && typeof a.expected === "object") {
        attr = a.expected.attribute;
        want = String(a.expected.value ?? "");
      } else {
        const eqIdx = String(a.expected).indexOf("=");
        attr = eqIdx >= 0 ? String(a.expected).slice(0, eqIdx) : String(a.expected);
        want = eqIdx >= 0 ? String(a.expected).slice(eqIdx + 1) : "";
      }
      // [main-session fix 2026-09-03] settle window: poll until the attribute
      // state matches or timeout (cross-machine boot-speed tolerance; matches
      // archived-run outcomes without changing state semantics).
      const t0 = Date.now();
      let got = await el.getAttribute(attr);
      while ((got === null || got !== want) && Date.now() - t0 < baseTimeout) {
        await sleep(200);
        got = await el.getAttribute(attr).catch(() => null);
      }
      if (got === null || got !== want) throw new CheckpointFailure("behavior_failure", `expected ${fmt(typeof a.expected === "object" ? `${attr}=${want}` : a.expected)}, actual ${fmt(got === null ? "" : got)}`);
      return { assertType: "aria" };
    }
    case "url": {
      const norm = normUrl(page.url());
      const want = String(a.expected);
      const u = new URL(page.url());
      const candidates = [norm, u.pathname, u.pathname + u.search, u.hash, u.hash.replace(/^#/, ""), "/" + u.hash.replace(/^#\/?/, "")];
      if (!candidates.includes(want)) throw new CheckpointFailure("behavior_failure", `expected ${fmt(want)}, actual ${fmt(u.pathname + u.search === "/" ? (u.hash ? u.hash.replace(/^#/, "") : "/") : norm)}`);
      return { assertType: "url" };
    }
    case "url-contains": {
      const full = page.url();
      if (!full.includes(String(a.expected))) throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual ${fmt(full)}`);
      return { assertType: "url-contains" };
    }
    case "storage": {
      if (a.key !== undefined) {
        const which = a.target || "localStorage";
        const got = await page.evaluate(([w, k]) => window[w].getItem(k), [which, a.key]);
        if (!assertEq(a.expected, got, true)) throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual ${fmt(got)}`);
        return { assertType: "storage" };
      }
      const got = await page.evaluate(() => ({
        localStorage: Object.keys(window.localStorage),
        sessionStorage: Object.keys(window.sessionStorage),
      }));
      const want = a.expected || {};
      const eqList = (x, y) => JSON.stringify([...(x || [])].sort()) === JSON.stringify([...(y || [])].sort());
      if (!eqList(got.localStorage, want.localStorage) || !eqList(got.sessionStorage, want.sessionStorage)) {
        throw new CheckpointFailure("behavior_failure", `expected ${fmt(want)}, actual ${fmt(got)}`);
      }
      return { assertType: "storage" };
    }
    case "storage-keys-whitelist": {
      const which = a.target || "localStorage";
      const keys = await page.evaluate((w) => Object.keys(window[w]), which);
      const wl = new Set(a.expected || []);
      const extra = keys.filter((k) => !wl.has(k));
      if (extra.length) throw new CheckpointFailure("behavior_failure", `expected whitelist ${fmt(a.expected)}, actual extra keys ${fmt(extra)}`);
      return { assertType: "storage-keys-whitelist" };
    }
    case "storage-json-key": {
      const which = a.target || "localStorage";
      const raw = await page.evaluate(([w, k]) => window[w].getItem(k), [which, a.key]);
      let ok = false;
      if (raw !== null) {
        try { ok = JSON.stringify(JSON.parse(raw)).includes(String(a.contains)); } catch (e) { ok = raw.includes(String(a.contains)); }
      }
      if (!ok) throw new CheckpointFailure("behavior_failure", `expected ${which}[${a.key}] to contain ${fmt(a.contains)}, actual ${fmt(raw)}`);
      return { assertType: "storage-json-key" };
    }
    case "count": {
      const loc = resolveLocatorMany(getScope(page, a), a.target);
      const n = await countOf(loc);
      if (n !== Number(a.expected)) throw new CheckpointFailure("behavior_failure", `expected ${a.expected}, actual ${n}`);
      return { assertType: "count" };
    }
    case "count-visible": {
      const loc = resolveLocatorMany(getScope(page, a), a.target);
      const n = await countOf(loc);
      let vis = 0;
      for (let i = 0; i < n; i++) { try { if (await loc.nth(i).isVisible()) vis++; } catch (e) { /* skip */ } }
      if (vis !== Number(a.expected)) throw new CheckpointFailure("behavior_failure", `expected ${a.expected}, actual ${vis}`);
      return { assertType: "count-visible" };
    }
    case "order": {
      const loc = resolveLocatorMany(getScope(page, a), a.target);
      const n = await countOf(loc);
      if (n === 0) throw new CheckpointFailure("locator_failure", `expected ${fmt(a.expected)}, actual "<element not found>"`);
      const texts = []; const ids = [];
      for (let i = 0; i < n; i++) {
        const el = loc.nth(i);
        texts.push(normText(await el.innerText().catch(() => el.textContent()).catch(() => "")));
        ids.push(await el.getAttribute("data-testid").catch(() => ""));
      }
      const want = a.expected || [];
      const eqArr = (x) => JSON.stringify(x) === JSON.stringify(want);
      if (!eqArr(texts) && !eqArr(ids)) throw new CheckpointFailure("behavior_failure", `expected ${fmt(want)}, actual ${fmt(texts)}`);
      return { assertType: "order" };
    }
    case "disabled": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const el = await requireElement(loc, fmt(a.expected));
      const got = await el.isDisabled();
      if (got !== (a.expected !== false)) throw new CheckpointFailure("behavior_failure", `expected ${a.expected}, actual ${got}`);
      return { assertType: "disabled" };
    }
    case "value": {
      const valueScope = getScope(page, a);
      const loc = await preferEditable(valueScope, a.target, resolveLocator(valueScope, a.target));
      const el = await requireElement(loc, fmt(a.expected));
      const got = await el.inputValue().catch(async () => await el.getAttribute("value"));
      if (a.match === "contains") {
        if (!String(got ?? "").includes(String(a.expected))) throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual ${fmt(got)}`);
      } else if (!assertEq(a.expected, got)) {
        throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual ${fmt(got)}`);
      }
      return { assertType: "value" };
    }
    case "attribute": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const el = await requireElement(loc, fmt(a.expected));
      const got = await el.getAttribute(a.attribute);
      if (!assertEq(a.expected, got, true)) throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual ${fmt(got)}`);
      return { assertType: "attribute" };
    }
    case "attr-contains": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const el = await requireElement(loc, fmt(a.expected));
      const got = await el.getAttribute(a.attr);
      // [sweep fix 2026-09-04] semantics = substring containment per type name
      // (startsWith broke mermaid P17 where the expected hash sits mid-src)
      if (got === null || !got.includes(String(a.expected))) throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual ${fmt(got)}`);
      return { assertType: "attr-contains" };
    }
    case "class-contains": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const el = await requireElement(loc, fmt(a.expected));
      const got = await el.getAttribute("class");
      const cls = (got || "").split(/\s+/);
      if (!cls.includes(String(a.expected))) throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual ${fmt(got)}`);
      return { assertType: "class-contains" };
    }
    case "count-visible": {
      const loc = multiLocator(page, as, as.target);
      await sleep(200);
      let n = 0;
      const all = loc;
      const cnt = await all.count();
      for (let i = 0; i < cnt; i += 1) { if (await all.nth(i).isVisible().catch(() => false)) n += 1; }
      return n === Number(as.expected) ? pass() : fail("behavior_failure", `expected ${as.expected}, actual ${n}`);
    }
    case "class-contains": {
      const loc = locatorFor(page, as, as.target);
      await loc.waitFor({ state: "attached", timeout: TIMEOUT }).catch(() => {});
      if ((await loc.count()) === 0) return fail("locator_failure", `element not found: ${as.target}`);
      const cls = (await loc.getAttribute("class")) || "";
      return cls.includes(String(as.expected ?? "")) ? pass() : fail("behavior_failure", `expected class contains ${j(as.expected)}, actual ${j(cls)}`);
    }
    case "class-missing": {
      const loc = resolveLocator(getScope(page, a), a.target);
      const el = await requireElement(loc, fmt(a.expected));
      const got = await el.getAttribute("class");
      const cls = (got || "").split(/\s+/);
      if (cls.includes(String(a.expected))) throw new CheckpointFailure("behavior_failure", `expected class ${fmt(a.expected)} missing, actual ${fmt(got)}`);
      return { assertType: "class-missing" };
    }
    case "js_eval": {
      const got = await page.evaluate(a.expr);
      if (!assertEq(a.expected, got, true)) throw new CheckpointFailure("behavior_failure", `expected ${fmt(a.expected)}, actual ${fmt(got)}`);
      return { assertType: "js_eval" };
    }
    case "pages-count": {
      const n = state.context.pages().length;
      if (n !== Number(a.expected)) throw new CheckpointFailure("behavior_failure", `expected ${a.expected}, actual ${n}`);
      return { assertType: "pages-count" };
    }
    case "request-count": {
      const got = state.requestCount ? state.requestCount.count : null;
      if (got !== Number(a.expected)) throw new CheckpointFailure("behavior_failure", `expected ${a.expected}, actual ${got}`);
      return { assertType: "request-count" };
    }
    case "count-delta": {
      const tag = a.delta_after_tag;
      const pre = (state.preTagCounts[tag] || {})[a.target];
      const post = await countOf(resolveLocatorMany(page, a.target));
      if (pre === undefined) throw new CheckpointFailure("setup_failure", `count-delta: no pre-capture for tag ${tag}`);
      const delta = post - pre;
      if (delta !== Number(a.expected)) throw new CheckpointFailure("behavior_failure", `expected ${a.expected}, actual ${fmt({ before: pre, after: post, delta })}`);
      return { assertType: "count-delta" };
    }
    default:
      throw new CheckpointFailure("behavior_failure", `unknown assert type ${t}`);
  }
}

// ---- checkpoint runner ----
async function runCheckpointOnce(browser, cp) {
  const started = Date.now();
  const ctxOpts = {
    viewport: dslContext.viewport || { width: 1280, height: 720 },
    locale: dslContext.locale || "en-US",
  };
  if (dslContext.timezoneId) ctxOpts.timezoneId = dslContext.timezoneId;
  if (dslContext.deviceScaleFactor) ctxOpts.deviceScaleFactor = dslContext.deviceScaleFactor;
  if (dslContext.permissions) ctxOpts.permissions = dslContext.permissions;
  if (!process.env.WLB_NO_UA) {
    ctxOpts.userAgent = WIN_UA;
  }
  const context = await browser.newContext(ctxOpts);
  if (!process.env.WLB_NO_UA) await context.addInitScript(PLATFORM_INIT);
  const page = await context.newPage();
  const state = new RunState(page, context);

  // normalize asserts; when both are present the plural list is authoritative —
  // archived-runner semantics: singular `assert` alongside `asserts` is a legacy
  // leftover (svgomg CP-20/21 carry superseded visible asserts)
  let asserts = [];
  if (cp.asserts) asserts = asserts.concat(cp.asserts);
  else if (cp.assert) asserts = asserts.concat(Array.isArray(cp.assert) ? cp.assert : [cp.assert]);

  // pre-index observe_at asserts and count-delta tags
  cp._observeAsserts = {};
  cp._deltaTargets = {};
  for (const a of asserts) {
    if (a.observe_at) { (cp._observeAsserts[a.observe_at] = cp._observeAsserts[a.observe_at] || []).push(a); }
    if (a.type === "count-delta" && a.delta_after_tag) { (cp._deltaTargets[a.delta_after_tag] = cp._deltaTargets[a.delta_after_tag] || []).push(a.target); }
  }

  const firstType = (asserts[0] || {}).type || "";
  let result = { id: cp.id, source_ac_id: cp.source_ac_id || "", kind: cp.kind || "", assert_type: firstType, status: "pass", failure_type: null, detail: "", duration_ms: 0 };

  try {
    for (const step of cp.setup || []) await execAction(state, step, cp);
    for (const a of asserts) {
      if (a.observe_at) {
        const entries = (state.tags[a.observe_at] || {}).entries || [];
        const snap = entries[(cp._observeAsserts[a.observe_at] || []).indexOf(a)];
        if (!snap) throw new CheckpointFailure("setup_failure", `observe_at@${a.observe_at}: no snapshot for ${a.target}`);
        if (snap.value === "\u0000__missing__") throw new CheckpointFailure("locator_failure", `observe_at@${a.observe_at}: expected ${fmt(a.expected)}, actual "<element not found>"`);
        let ok;
        if (snap.kind === "attr") ok = snap.value === snapshotWant(a);
        else {
          const match = a.match || (a.type === "text-regex" ? "regex" : "exact");
          const text = normText(snap.value);
          if (match === "contains") ok = text.includes(normText(a.expected));
          else if (match === "regex") ok = new RegExp(a.expected).test(text);
          else if (match === "not_contains") ok = !text.includes(normText(a.expected));
          else ok = text === normText(a.expected);
        }
        if (!ok) throw new CheckpointFailure("behavior_failure", `observe_at@${a.observe_at}: expected ${fmt(a.expected)}, actual ${fmt(String(snap.value).trim())}`);
        continue;
      }
      if (a.second) {
        // primary assertion evaluated at its observe point was handled above when observe_at is set;
        // if a.second present without observe_at, evaluate primary now then secondaries
        if (!a.observe_at) await evalAssert(state, a);
        for (const s of a.second) await evalAssert(state, s);
        continue;
      }
      await evalAssert(state, a);
    }
  } catch (e) {
    if (e instanceof CheckpointFailure) {
      result.status = "fail";
      result.failure_type = e.failureType;
      result.detail = e.detail;
    } else {
      result.status = "fail";
      result.failure_type = "setup_failure";
      result.detail = `runner error: ${String(e.message || e).split("\n")[0]}`;
    }
  } finally {
    result.duration_ms = Date.now() - started;
    try { await context.close(); } catch (e) { /* ignore */ }
  }
  return result;
}

// [crash-retry 2026-09-05] under memory pressure the OS/jetsam can kill a
// renderer mid-checkpoint (goto "interrupted by another navigation to
// chrome-error://", page crashed, target closed). That is infrastructure
// flakiness, not a red checkpoint. Retry the whole checkpoint once in a fresh
// context before recording a failure. Genuine behavior/locator failures are
// never retried (they carry other failure types / non-crash details).
const CRASH_SIG = /chrome-error:|interrupted by another navigation|page crashed|target closed|target, context or browser has been closed|browser has been closed|context or browser has been closed|navigation failed because page was closed/i;
async function runCheckpoint(browser, cp) {
  const first = await runCheckpointOnce(browser, cp);
  if (first.status !== "fail") return first;
  const detail = String(first.detail || "");
  if (!CRASH_SIG.test(detail)) return first;
  await sleep(1500);
  try {
    const second = await runCheckpointOnce(browser, cp);
    second.detail = second.detail || "(recovered after transient crash retry)";
    return second;
  } catch (e) {
    return first;
  }
}

// ---- main ----
const browser = await chromium.launch({ headless: true });
// Ground-truth calibration environment was Windows/msedge (archived runs).
// Spoof a Windows UA + platform so UA-sniffing code paths (e.g. piskel's
// Mac-vs-Windows modifier mapping, isMac = /Mac/.test(navigator.userAgent))
// behave exactly as they did at derivation time, independent of host OS.
const WIN_UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36`;
const PLATFORM_INIT = () => {
  Object.defineProperty(navigator, "platform", { get: () => "Win32" });
  if (navigator.userAgentData) {
    Object.defineProperty(navigator.userAgentData, "platform", { get: () => "Windows" });
  }
};
const results = [];
let cps = dsl.checkpoints || [];
if (onlyIds) { const keep = new Set(onlyIds.split(",").map((s) => s.trim()).filter(Boolean)); cps = cps.filter((c) => keep.has(c.id)); }
let idx = 0;
// [2026-09-04] browser-process crash guard: under memory pressure chromium can be
// killed mid-run ("Target page, context or browser has been closed"); previously the
// uncaught exception left no results file and run.sh emitted only
// {"error":"checkpoint_results.json missing"}. Now: remaining checkpoints are recorded
// as infra_crash failures, a RUNNER_CRASHED marker reaches run.sh stdout (the
// orchestrator's infra-retry matches it), and the exit code is 4.
let runnerCrashed = null;
for (const cp of cps) {
  idx++;
  let r;
  try {
    r = await runCheckpoint(browser, cp);
  } catch (e) {
    runnerCrashed = String((e && e.message) || e).split("\n")[0];
    results.push({ id: cp.id, status: "fail", failure_type: "infra_crash", assert_type: "", detail: `runner crash: ${runnerCrashed}` });
    for (const rest of cps.slice(idx)) {
      results.push({ id: rest.id, status: "fail", failure_type: "infra_crash", assert_type: "", detail: "runner crash: remaining checkpoints skipped" });
    }
    break;
  }
  results.push(r);
  const line = `[${idx}/${cps.length}] ${r.status.toUpperCase()} ${r.id} (${r.assert_type})${r.detail ? " :: " + r.detail.slice(0, 200) : ""}`;
  console.log(line);
}
if (!runnerCrashed) await browser.close();

const failureTypes = {};
for (const r of results) if (r.failure_type) failureTypes[r.failure_type] = (failureTypes[r.failure_type] || 0) + 1;
const summary = { checkpoint: { passed: results.filter((r) => r.status === "pass").length, total: results.length }, failure_types: failureTypes };
fs.writeFileSync(outPath, JSON.stringify({ summary, checkpoint_results: results, ...(runnerCrashed ? { runner_crashed: runnerCrashed } : {}) }, null, 1));
if (runnerCrashed) {
  console.log(`RUNNER_CRASHED: ${runnerCrashed}`);
  console.log(`summary: ${summary.checkpoint.passed}/${summary.checkpoint.total} passed (crashed)`);
  process.exit(4);
}
console.log(`summary: ${summary.checkpoint.passed}/${summary.checkpoint.total} passed`);
process.exit(summary.checkpoint.passed === summary.checkpoint.total ? 0 : 1);

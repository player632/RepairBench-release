/*
 *
 * A read-only facade over objects the app already owns: the Logicflow instance the
 * Flow component creates, its per-element form store, the BPMN text the app's own
 * Adapter produces, and the DOM the app renders. The probe reimplements no app
 * logic, caches nothing, and exposes no defect state: every reading below is either
 * (a) something a user can see on screen, or (b) the app's own export text / model
 * data reachable from the instance the app publishes to its own components.
 *
 * It exists because `window.lf` is published only under `import.meta.env.DEV`
 * (src/components/logicFlow/index.tsx:64-67) and the graded artifact is a
 * `vite build` product, so a production build has no handle on the instance.
 */
import { FIXTURES } from "./fixtures";

type Any = any;

let LF: Any = null;

const clone = (v: Any): Any => {
  if (v === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(v));
  } catch (e) {
    return String(v);
  }
};
const q = (sel: string): HTMLElement | null =>
  document.querySelector(sel) as HTMLElement | null;
const qa = (sel: string): HTMLElement[] =>
  Array.from(document.querySelectorAll(sel)) as HTMLElement[];
const attr = (el: Element | null, name: string): string | null =>
  el ? el.getAttribute(name) : null;
const txt = (el: HTMLElement | null): string | null =>
  el ? String(el.innerText !== undefined ? el.innerText : el.textContent || "") : null;

function raw(): Any {
  if (!LF) return { nodes: [], edges: [] };
  return LF.getGraphRawData();
}
function dig(obj: Any, dotted: string): Any {
  let cur = obj;
  for (const part of String(dotted).split(".")) {
    if (cur === null || cur === undefined) return null;
    cur = cur[part];
  }
  return cur === undefined ? null : cur;
}

/** page-coordinate point of an element (node centre / edge midpoint), via the app's
 *  own transform model, offset by the canvas host rect (playwright clicks in page
 *  coordinates). Cross-checkable against the app's own context-pad position. */
function pointOf(id: string): { x: number; y: number } | null {
  if (!LF) return null;
  let model: Any = null;
  try {
    model = LF.getModelById(id);
  } catch (e) {
    return null;
  }
  if (!model) return null;
  let cx: number;
  let cy: number;
  if (model.BaseType === "edge") {
    const data = model.getData();
    const list = data.pointsList || [];
    const mid = midpointOf(list.length >= 2 ? list : null, data);
    if (!mid) return null;
    cx = mid.x;
    cy = mid.y;
  } else {
    cx = model.x;
    cy = model.y;
  }
  return toPage(cx, cy);
}

/** canvas point -> page point through the app's own transform model, offset by the
 *  canvas host rect (playwright clicks in page coordinates). */
function toPage(cx: number, cy: number): { x: number; y: number } | null {
  if (!LF) return null;
  const html = LF.graphModel.transformModel.CanvasPointToHtmlPoint([cx, cy]);
  const host = q("[data-rb-canvas]");
  const rect = host ? host.getBoundingClientRect() : { left: 0, top: 0 };
  return {
    x: Math.round(rect.left + html[0]),
    y: Math.round(rect.top + html[1]),
  };
}

/** midpoint of the middle segment of a polyline (the geometric centre of the connector,
 *  not its first waypoint). */
function midpointOf(list: Any, data: Any): { x: number; y: number } | null {
  if (!list) {
    const sp = data && data.startPoint;
    const ep = data && data.endPoint;
    if (!sp || !ep) return null;
    return { x: (sp.x + ep.x) / 2, y: (sp.y + ep.y) / 2 };
  }
  const i = Math.floor((list.length - 1) / 2);
  const a = list[i];
  const b = list[i + 1];
  if (!a || !b) return null;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** point at fraction `frac` (0..1) along a connector's polyline, by arc length. Used to
 *  click a connector away from its label background. */
function edgePointOf(id: string, frac: number): { x: number; y: number } | null {
  if (!LF) return null;
  let model: Any = null;
  try {
    model = LF.getModelById(id);
  } catch (e) {
    return null;
  }
  if (!model) return null;
  const data = model.getData();
  const list = (data && data.pointsList) || [];
  if (list.length < 2) return pointOf(id);
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < list.length - 1; i++) {
    const d = Math.hypot(list[i + 1].x - list[i].x, list[i + 1].y - list[i].y);
    segs.push(d);
    total += d;
  }
  let want = Math.max(0, Math.min(1, Number(frac))) * total;
  for (let i = 0; i < segs.length; i++) {
    if (want <= segs[i] || i === segs.length - 1) {
      const t = segs[i] ? want / segs[i] : 0;
      return toPage(
        list[i].x + (list[i + 1].x - list[i].x) * t,
        list[i].y + (list[i + 1].y - list[i].y) * t,
      );
    }
    want -= segs[i];
  }
  return null;
}

function canvasHost(): HTMLElement | null {
  return q("[data-rb-canvas]");
}

export function installRbProbe(lf: Any): void {
  LF = lf;
  const w = window as Any;
  w.__RB__ = {
    probe: "camunda-rb-probe/1",

    /* ---------- instance / graph ---------- */
    hasLf: () => !!LF,
    ready: () => !!LF && !!(LF as Any).graphModel,
    processId: () => (LF ? String(LF.processId) : null),
    nodeCount: () => raw().nodes.length,
    edgeCount: () => raw().edges.length,
    nodeIds: () => raw().nodes.map((n: Any) => n.id),
    edgeIds: () => raw().edges.map((e: Any) => e.id),
    nodeTypes: () => raw().nodes.map((n: Any) => n.type),
    edgeTypes: () => raw().edges.map((e: Any) => e.type),
    graph: () => clone(raw()),
    node: (id: string) => clone(raw().nodes.find((n: Any) => n.id === id) || null),
    edge: (id: string) => clone(raw().edges.find((e: Any) => e.id === id) || null),
    nodeField: (id: string, dotted: string) =>
      clone(dig(raw().nodes.find((n: Any) => n.id === id) || null, dotted)),
    edgeField: (id: string, dotted: string) =>
      clone(dig(raw().edges.find((e: Any) => e.id === id) || null, dotted)),
    nodeText: (id: string) => {
      const n = raw().nodes.find((o: Any) => o.id === id);
      if (!n) return null;
      if (n.text === null || n.text === undefined) return null;
      return typeof n.text === "object" ? String(n.text.value) : String(n.text);
    },
    nodeTextX: (id: string) => {
      const n = raw().nodes.find((o: Any) => o.id === id);
      return n && n.text && typeof n.text === "object" ? Number(n.text.x) : null;
    },
    nodeTextY: (id: string) => {
      const n = raw().nodes.find((o: Any) => o.id === id);
      return n && n.text && typeof n.text === "object" ? Number(n.text.y) : null;
    },
    edgeText: (id: string) => {
      const e = raw().edges.find((o: Any) => o.id === id);
      return e && e.text && typeof e.text === "object" ? String(e.text.value) : null;
    },
    edgeTextX: (id: string) => {
      const e = raw().edges.find((o: Any) => o.id === id);
      return e && e.text && typeof e.text === "object" ? Number(e.text.x) : null;
    },
    edgeEnds: (id: string) => {
      const e = raw().edges.find((o: Any) => o.id === id);
      return e ? [String(e.sourceNodeId), String(e.targetNodeId)] : null;
    },
    waypoints: (id: string) =>
      clone((raw().edges.find((o: Any) => o.id === id) || { pointsList: [] }).pointsList),

    /* ---------- import (the app's own 导入 path: lf.render(xml) -> Adapter.adapterIn) ---------- */
    fixtureKeys: () => Object.keys(FIXTURES),
    fixture: (k: string) => (k in FIXTURES ? FIXTURES[k] : null),
    fixtureLen: (k: string) => (k in FIXTURES ? FIXTURES[k].length : null),
    load: (k: string) => {
      LF.render(FIXTURES[k]);
      return { nodes: raw().nodes.length, edges: raw().edges.length };
    },
    loadXml: (xml: string) => {
      LF.render(xml);
      return { nodes: raw().nodes.length, edges: raw().edges.length };
    },
    loadError: (k: string) => {
      try {
        LF.render(FIXTURES[k]);
        return null;
      } catch (e: Any) {
        return String((e && e.message) || e);
      }
    },

    /* ---------- export (the app's own 导出 path: lf.getGraphData() -> Adapter.adapterOut) ---------- */
    xml: () => (LF ? String(LF.getGraphData()) : null),
    xmlLen: () => (LF ? String(LF.getGraphData()).length : null),
    xmlHas: (needle: string) => (LF ? String(LF.getGraphData()).includes(needle) : null),
    xmlCount: (needle: string) =>
      LF ? String(LF.getGraphData()).split(needle).length - 1 : null,
    xmlCountRe: (src: string) => {
      if (!LF) return null;
      const m = String(LF.getGraphData()).match(new RegExp(src, "g"));
      return m ? m.length : 0;
    },
    /** well-formedness of the app's own export, judged by the browser's XML parser */
    xmlValid: () => {
      if (!LF) return null;
      const doc = new DOMParser().parseFromString(
        String(LF.getGraphData()),
        "application/xml",
      );
      const errs = doc.getElementsByTagName("parsererror");
      return errs.length === 0;
    },
    xmlError: () => {
      if (!LF) return null;
      const doc = new DOMParser().parseFromString(
        String(LF.getGraphData()),
        "application/xml",
      );
      const errs = doc.getElementsByTagName("parsererror");
      return errs.length ? String(errs[0].textContent || "").slice(0, 160) : null;
    },
    /** count of attribute names in the export that still carry the internal "-" prefix */
    xmlDashAttrs: () => {
      if (!LF) return null;
      const m = String(LF.getGraphData()).match(/\s-[A-Za-z_][\w.:-]*="/g);
      return m ? m.length : 0;
    },
    xmlTagOrder: (tagName: string) => {
      if (!LF) return null;
      const txtAll = String(LF.getGraphData());
      const re = new RegExp("<" + tagName + "\\b([^>]*)>", "g");
      const out: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(txtAll)) !== null) {
        const nm = /(?:^|\s)-?name="([^"]*)"/.exec(m[1]);
        out.push(nm ? nm[1] : "");
      }
      return out;
    },

    /* ---------- form store (the app's own per-element property data) ---------- */
    form: (id: string) => (LF ? clone(LF.getForm(id)[0]) : null),
    formPath: (id: string, dotted: string) =>
      LF ? clone(dig(LF.getForm(id)[0], dotted)) : null,
    formKeys: (id: string) => (LF ? Object.keys(LF.getForm(id)[0] || {}) : null),
    baseModelKeys: (id: string) =>
      LF ? Object.keys(dig(LF.getForm(id)[0], "baseModel") || {}) : null,
    extPairs: (id: string) => {
      if (!LF) return null;
      const list = dig(LF.getForm(id)[0], "extensionElements") || [];
      return clone(list.map((o: Any) => [String(o.name), String(o.value)]));
    },
    extCount: (id: string) => {
      if (!LF) return null;
      const list = dig(LF.getForm(id)[0], "extensionElements") || [];
      return list.length;
    },
    ioCounts: (id: string) => {
      if (!LF) return null;
      const bm = dig(LF.getForm(id)[0], "baseModel") || {};
      return {
        inputs: (bm.inputs || []).length,
        outputs: (bm.outputs || []).length,
        headers: (bm.headers || []).length,
      };
    },
    ioTargets: (id: string, which: string) => {
      if (!LF) return null;
      const bm = dig(LF.getForm(id)[0], "baseModel") || {};
      return clone((bm[which] || []).map((o: Any) => String(o.target)));
    },
    collapseState: (formId: string, collapseId: string) =>
      LF ? clone(dig(LF.getForm(formId)[0], "collapseData." + collapseId)) : null,
    messageTags: () => {
      if (!LF) return null;
      try {
        return clone(LF.globalTags.getTag("bpmn:message"));
      } catch (e) {
        return null;
      }
    },

    /* ---------- DOM: left palette ---------- */
    palette: () =>
      qa("[data-rb-palette]").map((el) => ({
        type: attr(el, "data-rb-palette"),
        name: (txt(el) || "").trim(),
      })),
    paletteTypes: () =>
      qa("[data-rb-palette]").map((el) => attr(el, "data-rb-palette")),
    paletteCount: () => qa("[data-rb-palette]").length,

    /* ---------- DOM: right property panel ---------- */
    panelName: () => txt(q("[data-rb-panel-name]")),
    panelPresent: () => !!q("[data-rb-rightpanel]"),
    sections: () =>
      qa("[data-rb-rightpanel] [data-rb-collapse]").map((el) => ({
        id: attr(el, "data-rb-collapse"),
        open: attr(el, "data-rb-open"),
        content: !!el.querySelector("[data-rb-collapse-content]"),
      })),
    sectionIds: () =>
      qa("[data-rb-rightpanel] [data-rb-collapse]").map((el) =>
        attr(el, "data-rb-collapse"),
      ),
    sectionOpen: (id: string) => attr(q('[data-rb-collapse="' + id + '"]'), "data-rb-open"),
    sectionContent: (id: string) =>
      !!q('[data-rb-collapse-content="' + id + '"]'),
    fieldValue: (name: string) => {
      const el = q('[data-rb-field="' + name + '"]') as HTMLInputElement | null;
      return el ? String(el.value) : null;
    },
    fieldCount: (name: string) => qa('[data-rb-field="' + name + '"]').length,
    docValue: () => {
      const el = q('[data-rb-field="document"]') as HTMLTextAreaElement | null;
      return el ? String(el.value) : null;
    },
    eqValue: (label: string) => {
      const box = q('[data-rb-equal="' + label + '"]');
      if (!box) return null;
      const el = box.querySelector("input, textarea") as HTMLInputElement | null;
      return el ? String(el.value) : null;
    },
    eqActive: (label: string) =>
      attr(q('[data-rb-equal="' + label + '"]'), "data-rb-eq-active"),
    eqInputKind: (label: string) => {
      const box = q('[data-rb-equal="' + label + '"]');
      if (!box) return null;
      const el = box.querySelector("input, textarea");
      if (!el) return null;
      return el.tagName.toLowerCase() + (attr(el, "type") ? ":" + attr(el, "type") : "");
    },
    eqLabels: () => qa("[data-rb-equal]").map((el) => attr(el, "data-rb-equal")),
    itemCounts: () => ({
      items: qa("[data-rb-item]").length,
      extInputs: qa("[data-rb-ext-name]").length,
    }),
    extNameValue: (i: number) => {
      const n = qa("[data-rb-ext-name]")[i] as HTMLInputElement | undefined;
      const v = qa("[data-rb-ext-value]")[i] as HTMLInputElement | undefined;
      return [n ? String(n.value) : null, v ? String(v.value) : null];
    },

    /* ---------- DOM: context pad ---------- */
    padPresent: () => {
      const el = q("[data-rb-pad-root]");
      return !!el && attr(el, "style") !== null && el.style.display !== "none" && !!el.parentNode;
    },
    padItems: () => qa("[data-rb-pad]").map((el) => attr(el, "data-rb-pad")),
    padCount: () => qa("[data-rb-pad]").length,
    padPos: () => {
      const el = q("[data-rb-pad-root]");
      return el ? { left: el.style.left, top: el.style.top } : null;
    },

    /* ---------- geometry helpers for real mouse interaction ---------- */
    point: (id: string) => pointOf(id),
    pointX: (id: string) => {
      const p = pointOf(id);
      return p ? p.x : null;
    },
    pointY: (id: string) => {
      const p = pointOf(id);
      return p ? p.y : null;
    },
    edgePoint: (id: string, frac: number) => edgePointOf(id, frac),
    pagePoint: (x: number, y: number) => toPage(Number(x), Number(y)),
    canvasRect: () => {
      const host = canvasHost();
      if (!host) return null;
      const r = host.getBoundingClientRect();
      return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
    },
    elementAt: (id: string) => {
      const p = pointOf(id);
      if (!p) return null;
      const el = document.elementFromPoint(p.x, p.y);
      if (!el) return null;
      return {
        tag: el.tagName.toLowerCase(),
        cls: attr(el, "class"),
        parentCls: el.parentElement ? attr(el.parentElement, "class") : null,
      };
    },
    /** what the browser would actually hit at a page point, plus its ancestry classes */
    elementAtXY: (x: number, y: number) => {
      const el = document.elementFromPoint(Number(x), Number(y));
      if (!el) return null;
      const chain: string[] = [];
      let cur: Element | null = el;
      for (let i = 0; i < 4 && cur; i++) {
        chain.push(cur.tagName.toLowerCase() + (attr(cur, "class") ? "." + String(attr(cur, "class")).trim().replace(/\s+/g, ".") : ""));
        cur = cur.parentElement;
      }
      return { tag: el.tagName.toLowerCase(), cls: attr(el, "class"), chain };
    },
    /** bounding box (page coords) of a rendered element the probe can see */
    boxOf: (sel: string) => {
      const el = q(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
    },
    /** structural dump used once during authoring to learn the rendered canvas DOM */
    canvasHtml: (n: number) => {
      const host = canvasHost();
      return host ? host.innerHTML.slice(0, Number(n) || 2000) : null;
    },
    svgCensus: () => {
      const host = canvasHost();
      if (!host) return null;
      const els = Array.from(host.querySelectorAll("*")).slice(0, 120);
      return els.map((el) => ({
        tag: el.tagName.toLowerCase(),
        cls: attr(el, "class"),
        attrs: Array.from(el.attributes || [])
          .map((a) => a.name)
          .filter((nm) => nm !== "class")
          .slice(0, 8)
          .join(","),
      }));
    },
    topBar: () =>
      qa("[data-rb-btn]").map((el) => ({ btn: attr(el, "data-rb-btn"), text: (txt(el) || "").trim() })),
  };
}

export function rbProbeInstalled(): boolean {
  return !!LF;
}

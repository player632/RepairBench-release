import Konva from "konva";
import { stageDataAction } from "./redux/currentStageData";

export type RieBridgeHooks = {
  getStore: () => any;
  getSel: () => any[];
  getTabs: () => { id: string; active: boolean }[];
  getHist: () => { past: number; future: number; clip: number };
};

// WLB instrumentation bridge for react-image-editor.
// App reinstalls it on EVERY render (useEffect without deps), so every
// function closes over the freshest store/selection/tab/history values.
// DSL consumers must re-read window.__RIE__ on every access - never cache it.
// All read accessors return scalars (number/string/boolean/null) so DSL
// js_eval asserts can compare them directly.
export const installRieBridge = (hooks: RieBridgeHooks) => {
  const items = (): any[] => {
    try {
      const cs = hooks.getStore().getState().currentStageData;
      return cs.ids.map((id: string) => cs.entities[id]).filter(Boolean);
    } catch (e) {
      return [];
    }
  };

  const stage = (): any => (Konva.stages && Konva.stages.length > 0 ? Konva.stages[0] : null);

  const node = (id: string | null): any => {
    const s = stage();
    if (!s || !id) return null;
    try {
      return s.findOne(`#${id}`);
    } catch (e) {
      return null;
    }
  };

  const api = {
    // boot gate: stage mounted, tutorial items loaded, navbar rendered
    ready: (): boolean => {
      const s = stage();
      return (
        !!s
        && !!s.container()
        && items().length > 0
        && !!document.querySelector('[data-navbar-id="zoom-in"]')
      );
    },
    count: (): number => items().length,
    countType: (t: string): number => items().filter((i) => i.attrs["data-item-type"] === t).length,
    findId: (t: string, idx: number): string | null => {
      const f = items().filter((i) => i.attrs["data-item-type"] === t);
      return f[idx] ? f[idx].id : null;
    },
    attrOf: (id: string | null, k: string): any => {
      if (!id) return null;
      const it = items().find((i) => i.id === id);
      return it && it.attrs[k] !== undefined ? it.attrs[k] : null;
    },
    itemType: (id: string | null): string | null => {
      if (!id) return null;
      const it = items().find((i) => i.id === id);
      return it ? it.attrs["data-item-type"] : null;
    },
    // rendered Konva text (not redux) - this is what the user sees
    textOf: (id: string | null): string | null => {
      const n = node(id);
      return n && typeof n.text === "function" ? n.text() : null;
    },
    // render order of stage items as Konva layer children (comma-joined ids)
    zOrder: (): string => {
      const s = stage();
      if (!s) return "";
      const layer = s.getChildren()[0];
      if (!layer) return "";
      return layer
        .getChildren((c: any) => c.name() === "label-target")
        .map((c: any) => c.id())
        .join(",");
    },
    scale: (): number | null => {
      const s = stage();
      return s ? s.scaleX() : null;
    },
    selCount: (): number => hooks.getSel().length,
    tabs: (): string => hooks.getTabs().map((t) => t.id).join(","),
    activeTab: (): string | null => {
      const el = document.querySelector('[data-file-id][data-active="true"]');
      return el ? el.getAttribute("data-file-id") : null;
    },
    absOffX: (): number | null => {
      const s = stage();
      return s ? Math.round(s.container().getBoundingClientRect().x) : null;
    },
    absOffY: (): number | null => {
      const s = stage();
      return s ? Math.round(s.container().getBoundingClientRect().y) : null;
    },
    konvaAttr: (id: string, k: string): any => {
      const n = node(id);
      if (!n) return null;
      if (typeof n[k] === "function") return n[k]();
      return n.getAttr(k) ?? null;
    },
    konvaImgSrc: (id: string): string => {
      const n = node(id);
      if (!n || typeof n.image !== "function") return "";
      const img = n.image();
      return img ? String(img.src || "") : "";
    },
    lsHas: (k: string): boolean => {
      try {
        return window.localStorage.getItem(k) !== null;
      } catch (e) {
        return false;
      }
    },
    histPast: (): number => hooks.getHist().past,
    // actuators -----------------------------------------------------------
    seed: (newItems: any[]): number => {
      const st = hooks.getStore();
      st.dispatch(stageDataAction.clearItems({}));
      st.dispatch(stageDataAction.addItem(newItems));
      return newItems.length;
    },
    create: (item: any): boolean => {
      hooks.getStore().dispatch(stageDataAction.addItem(item));
      return true;
    },
    // HTML5 drag&drop actuator: fires the widget's React dragstart, then
    // dragover+drop on the Konva stage container with a real DataTransfer.
    drop: (testid: string, clientX: number, clientY: number): string => {
      try {
        const s = stage();
        if (!s) return "no-stage";
        const src = document.querySelector(`[data-testid="${testid}"]`);
        if (!src) return "no-src";
        const container = s.container();
        const dt = new DataTransfer();
        src.dispatchEvent(
          new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }),
        );
        container.dispatchEvent(
          new DragEvent("dragover", {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
            clientX,
            clientY,
          }),
        );
        container.dispatchEvent(
          new DragEvent("drop", {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
            clientX,
            clientY,
          }),
        );
        return "ok";
      } catch (e: any) {
        return `err:${String(e && e.message ? e.message : e)}`;
      }
    },
  };

  (window as any).__RIE__ = api;
  return api;
};

/**
 * RepairBench read-only probe bridge (`rbProbe`) - publishes `window.__rb` exactly once.
 *
 * Discipline (same shape as the registered corpus' probe bridges):
 *  - STRICTLY READ-ONLY: it dispatches nothing and mutates no store, no game state, no DOM node and
 *    no fixture. Every reader is a getter over a snapshot the instrumented components *publish* on
 *    render, over the app's own pure game predicates, or over `document` / `window` / `location`.
 *  - PUBLISHED ONCE AND FROZEN: the root object and every namespace are `Object.freeze`d and a
 *    second install is a no-op, so a repair cannot re-point a reading at its own value
 *    (`__rb.meta.rbIsFrozen()` is the checkpoint that proves it).
 *  - NEVER THROWS: every reader is wrapped, so a broken state yields an `__ERR__:` string (a visible
 *    red) instead of a setup_failure.
 *  - SCALARS ONLY: readers return numbers, strings or booleans, because evaluation/dsl_runner.mjs
 *    compares `js_eval` results with a loose `==` and an object/array `expected` is always false.
 *
 * Why a probe is needed at all: `block-sort` keeps the level in React component state inside the
 * Level component (there is no store), and the two things a repair has to be judged on - the
 * *logical* column contents (`blockType`, not the seasonal hex colour) and the *derived* readings the
 * app computes from them (`selectFromColumn`, `hasWon`, `isStuck`, the recorded move list) - are not
 * in the DOM in a stable form. The rendered DOM only carries hashed CSS-module class names plus
 * Tailwind utilities, so without this bridge an assertion would have to be written against a
 * build-specific class hash.
 *
 * The two publishers below are the ONLY writes this module performs, and they write into
 * module-private variables, never into the app.
 */
import { selectFromColumn } from "@/game/actions";
import { hasWon, isStuck } from "@/game/state";
import type { LevelState, Move } from "@/game/types";

const RB_PROBE_VERSION = "r28-blocksort-1";

/* The only __-prefixed window globals this face is allowed to own: the probe itself plus the ones the
 * PWA/offline stack parks there. Listing them by name keeps `globals.unexpected()` order-independent
 * while still catching anything ELSE a repair parks on window - the anti-hack reading stays
 * red-capable. */
const RB_KNOWN_GLOBALS = ["__rb", "__rbInstalledAt", "__VITE_PLUGIN_PWA__"];

const ABSENT = -1;

type RbLevelSnapshot = {
  present: boolean;
  title: string;
  levelNr: number;
  playState: string;
  levelState: LevelState | null;
  levelMoves: Move[];
  selection: [number, number] | null;
  showTutorial: boolean;
  storageKey: string;
  currentStageNr: number;
  maxStages: number;
};

type RbTrackSnapshot = {
  present: boolean;
  officialLevelNr: number;
  levelNr: number;
  numberFrom: number;
};

const levelSnap: { current: RbLevelSnapshot | null } = { current: null };
const trackSnap: { current: RbTrackSnapshot | null } = { current: null };
const trackMessages: { current: { levelNr: number; text: string }[] } = { current: [] };

/** Published by the Level component on every render. Pure assignment into a module-private slot. */
export const publishRbLevel = (next: RbLevelSnapshot): void => {
  levelSnap.current = next;
};

/** Published by the level-track components on every render. */
export const publishRbTrack = (
  next: RbTrackSnapshot,
  messages: { levelNr: number; text: string }[]
): void => {
  trackSnap.current = next;
  trackMessages.current = messages;
};

const wrap = (fn: () => unknown): unknown => {
  try {
    const value = fn();
    return value === undefined ? "" : value;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return "__ERR__:" + msg.slice(0, 90);
  }
};

const uncaught: string[] = [];
const rejections: string[] = [];
const consoleErrors: string[] = [];

const domText = (sel: string): string => {
  const el = document.querySelector(sel);
  return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";
};

const all = (sel: string): Element[] => Array.from(document.querySelectorAll(sel));

const col = (i: number) => levelSnap.current?.levelState?.columns[i] ?? null;

const colCount = (): number =>
  levelSnap.current?.levelState?.columns.length ?? ABSENT;

const colSig = (i: number): string => {
  const c = col(i);
  if (!c) return "";
  return (
    c.type +
    "|" +
    c.columnSize +
    "|" +
    (c.locked ? 1 : 0) +
    "|" +
    c.blocks.map((b) => b.blockType + (b.revealed === false ? "?" : "")).join(",")
  );
};

const selectionSize = (i: number): number => {
  const st = levelSnap.current?.levelState;
  if (!st || !st.columns[i]) return ABSENT;
  return selectFromColumn(st, i).length;
};

const tutorialText = (): string => domText("[data-rb-tutorial]");

const playButton = (): HTMLButtonElement | null => {
  const btns = Array.from(document.querySelectorAll("button"));
  for (const b of btns) {
    if (/^(Play level \d+|Level \d+)$/.test((b.textContent || "").trim()))
      return b as HTMLButtonElement;
  }
  return null;
};

const nodeEls = (): Element[] => all("[data-rb-node]");

/** the per-node flags live on LevelNode's inner element, one level below the [data-rb-node] li. */
const nodeInner = (n: Element): Element | null => n.querySelector("[data-rb-node-inner]");

const nodeAttrList = (attr: string, value: string): string =>
  nodeEls()
    .filter((n) => nodeInner(n)?.getAttribute(attr) === value)
    .map((n) => n.getAttribute("data-rb-node"))
    .join(",");

const rewardMessages = (): { levelNr: number; text: string }[] =>
  trackMessages.current.filter((m) => m.text.indexOf("\u2b50") === 0);

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyReader = (...args: any[]) => any;
type Namespace = Record<string, AnyReader>;

const guardNamespace = (ns: Namespace): Namespace => {
  const out: Namespace = {};
  for (const key of Object.keys(ns)) {
    const impl = ns[key];
    out[key] = (...args: any[]): unknown => wrap(() => impl(...args));
  }
  return Object.freeze(out);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const buildNamespaces = (): Record<string, Namespace> => {
  const meta: Namespace = {
    version: () => RB_PROBE_VERSION,
    rbIsFrozen: () => {
      const w = window as unknown as { __rb?: object };
      return w.__rb && Object.isFrozen(w.__rb) ? 1 : 0;
    },
    installMarker: () => {
      const w = window as unknown as { __rbInstalledAt?: number };
      return typeof w.__rbInstalledAt === "number" ? 1 : 0;
    },
    probeReadonly: () => 1
  };

  const underscored = (): string[] =>
    Object.getOwnPropertyNames(window)
      .filter((k) => k.indexOf("__") === 0)
      .sort();

  const globals: Namespace = {
    known: () => underscored().filter((k) => RB_KNOWN_GLOBALS.includes(k)).join(","),
    unexpected: () =>
      underscored().filter((k) => !RB_KNOWN_GLOBALS.includes(k)).join(","),
    count: () => underscored().length
  };

  const residue: Namespace = {
    rbResidue: () =>
      Object.getOwnPropertyNames(window)
        .filter((k) => /^__rb/i.test(k) && !RB_KNOWN_GLOBALS.includes(k))
        .sort()
        .join(","),
    localStorageKeys: () => {
      const out: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++)
        out.push(window.localStorage.key(i) || "");
      return out.sort().join(",");
    },
    sessionStorageKeys: () => {
      const out: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++)
        out.push(window.sessionStorage.key(i) || "");
      return out.sort().join(",");
    },
    urlResidue: () =>
      window.location.pathname + "|" + window.location.search + "|" + window.location.hash,
    globalThisRbKeys: () =>
      Object.getOwnPropertyNames(globalThis)
        .filter((k) => /^rb/i.test(k))
        .sort()
        .join(",")
  };

  const errors: Namespace = {
    uncaught: () => uncaught.join(" | "),
    rejections: () => rejections.join(" | "),
    consoleErrors: () => consoleErrors.join(" | "),
    total: () => uncaught.length + rejections.length + consoleErrors.length
  };

  const level: Namespace = {
    present: () => (levelSnap.current?.present ? 1 : 0),
    title: () => levelSnap.current?.title ?? "",
    levelNr: () => levelSnap.current?.levelNr ?? ABSENT,
    playState: () => levelSnap.current?.playState ?? "",
    showTutorial: () => (levelSnap.current?.showTutorial ? 1 : 0),
    storageKey: () => levelSnap.current?.storageKey ?? "",
    stage: () =>
      (levelSnap.current?.currentStageNr ?? ABSENT) +
      "/" +
      (levelSnap.current?.maxStages ?? ABSENT),
    colCount: () => colCount(),
    colType: (i: number) => col(i)?.type ?? "",
    colSize: (i: number) => col(i)?.columnSize ?? ABSENT,
    colLocked: (i: number) => (col(i) ? (col(i)?.locked ? 1 : 0) : ABSENT),
    colBlocks: (i: number) => (col(i) ? (col(i)?.blocks.length ?? 0) : ABSENT),
    colTypes: (i: number) => (col(i)?.blocks ?? []).map((b) => b.blockType).join(","),
    colSig: (i: number) => colSig(i),
    boardSig: () => {
      const n = colCount();
      if (n < 0) return "";
      const out: string[] = [];
      for (let i = 0; i < n; i++) out.push(colSig(i));
      return out.join(";");
    },
    boardBlockCount: () => {
      const n = colCount();
      if (n < 0) return ABSENT;
      let t = 0;
      for (let i = 0; i < n; i++) t += col(i)?.blocks.length ?? 0;
      return t;
    },
    blockType: (c: number, i: number) => col(c)?.blocks[i]?.blockType ?? "",
    blockRevealed: (c: number, i: number) => {
      const b = col(c)?.blocks[i];
      return b ? (b.revealed === false ? 0 : 1) : ABSENT;
    },
    colTopType: (c: number) => col(c)?.blocks[0]?.blockType ?? "",
    lockedCols: () => {
      const n = colCount();
      if (n < 0) return "";
      const out: number[] = [];
      for (let i = 0; i < n; i++) if (col(i)?.locked) out.push(i);
      return out.join(",");
    },
    /** the app's own pure selection rule, applied to the live snapshot. */
    selections: () => {
      const n = colCount();
      if (n < 0) return "";
      const out: number[] = [];
      for (let i = 0; i < n; i++) out.push(selectionSize(i));
      return out.join(",");
    },
    selectionOf: (i: number) => selectionSize(i),
    selectionTypes: (i: number) => {
      const st = levelSnap.current?.levelState;
      if (!st || !st.columns[i]) return "";
      return selectFromColumn(st, i).map((b) => b.blockType).join(",");
    },
    /** the [column, amount] the UI currently holds lifted, or "none". */
    selected: () => {
      const s = levelSnap.current?.selection;
      return s ? s[0] + "," + s[1] : "none";
    },
    movesMade: () => (levelSnap.current ? levelSnap.current.levelMoves.length : ABSENT),
    moveLog: () =>
      (levelSnap.current?.levelMoves ?? []).map((m) => m.from + ">" + m.to).join(","),
    won: () => {
      const st = levelSnap.current?.levelState;
      return st ? (hasWon(st) ? 1 : 0) : ABSENT;
    },
    stuck: () => {
      const st = levelSnap.current?.levelState;
      return st ? (isStuck(st) ? 1 : 0) : ABSENT;
    },
    /** visible tutorial prose (whitespace-collapsed), "" when the tutorial renders nothing. */
    tutorial: () => tutorialText(),
    tutorialHas: (needle: string) => (tutorialText().indexOf(needle) >= 0 ? 1 : 0),
    tutorialLength: () => tutorialText().length,
    /** visible overlay Message prose ("Restarting" / "Blocked!" / the win sentence). */
    message: () => domText("[data-rb-message]"),
    messagePresent: () => (document.querySelector("[data-rb-message]") ? 1 : 0)
  };

  const dom: Namespace = {
    columns: () => all("[data-rb-col]").length,
    blocks: () => all("[data-rb-block]").length,
    blockCountInCol: (i: number) => all('[data-rb-col="' + i + '"] [data-rb-block]').length,
    selectedBlocks: () => all('[data-rb-block][data-rb-selected="1"]').length,
    selectedBlocksInCol: (i: number) =>
      all('[data-rb-col="' + i + '"] [data-rb-block][data-rb-selected="1"]').length,
    selectedCols: () =>
      all("[data-rb-col]")
        .filter((c) => c.querySelector('[data-rb-block][data-rb-selected="1"]'))
        .map((c) => c.getAttribute("data-rb-col"))
        .join(","),
    lockedColsInDom: () =>
      all("[data-rb-col]")
        .filter((c) => c.getAttribute("data-rb-col-locked") === "1")
        .map((c) => c.getAttribute("data-rb-col"))
        .join(","),
    colBlockTypesInDom: (i: number) =>
      all('[data-rb-col="' + i + '"] [data-rb-block]')
        .map((b) => b.getAttribute("data-rb-block-type"))
        .join(","),
    colBlockColorsInDom: (i: number) =>
      all('[data-rb-col="' + i + '"] [data-rb-block]')
        .map((b) => b.getAttribute("data-rb-block-color"))
        .join(","),
    blockColor: (c: number, i: number) =>
      all('[data-rb-col="' + c + '"] [data-rb-block]')[i]?.getAttribute(
        "data-rb-block-color"
      ) ?? "",
    blockTypeAttr: (c: number, i: number) =>
      all('[data-rb-col="' + c + '"] [data-rb-block]')[i]?.getAttribute(
        "data-rb-block-type"
      ) ?? "",
    topButtonIcons: () =>
      all("span.material-icons")
        .map((s) => (s.textContent || "").trim())
        .filter(Boolean)
        .join(","),
    playButtonLabel: () => {
      const b = playButton();
      return b ? (b.textContent || "").trim() : "";
    },
    playButtonDisabled: () => {
      const b = playButton();
      return b ? (b.disabled ? 1 : 0) : ABSENT;
    }
  };

  const track: Namespace = {
    present: () => (trackSnap.current?.present ? 1 : 0),
    officialLevelNr: () => trackSnap.current?.officialLevelNr ?? ABSENT,
    displayLevelNr: () => trackSnap.current?.levelNr ?? ABSENT,
    numberFrom: () => trackSnap.current?.numberFrom ?? ABSENT,
    nodes: () => nodeEls().length,
    nodeLevels: () =>
      nodeEls().map((n) => n.getAttribute("data-rb-node")).join(","),
    nodeLevelText: (oneBased: number) =>
      domText('[data-rb-node="' + oneBased + '"] [data-rb-node-number]'),
    completedNodes: () => nodeAttrList("data-rb-completed", "1"),
    completedCount: () =>
      nodeEls().filter((n) => nodeInner(n)?.getAttribute("data-rb-completed") === "1")
        .length,
    currentNode: () => {
      const hit = nodeEls().find((n) => nodeInner(n)?.getAttribute("data-rb-current") === "1");
      return hit ? Number(hit.getAttribute("data-rb-node")) : ABSENT;
    },
    smileyAtNode: () => {
      const hit = nodeEls().find((n) => n.querySelector("[data-rb-smiley]"));
      return hit ? Number(hit.getAttribute("data-rb-node")) : ABSENT;
    },
    /** 1-based level numbers carrying a difficulty reward bar, ascending. */
    rewardLevels: () =>
      rewardMessages().map((m) => m.levelNr + 1).sort((a, b) => a - b).join(","),
    rewardCount: () => rewardMessages().length,
    /** 1-based level number carrying the "Zen mode unlocked" bar, 0 when absent. */
    zenLabelLevel: () => {
      const hit = trackMessages.current.find(
        (m) => m.text.indexOf("Zen mode unlocked") >= 0
      );
      return hit ? hit.levelNr + 1 : 0;
    },
    messageLevels: () =>
      trackMessages.current.map((m) => m.levelNr + 1).sort((a, b) => a - b).join(","),
    /** 1-based level carrying "Zen difficulty <name> unlocked", 0 when absent. */
    zenDifficultyLevel: (name: string) => {
      const needle = "Zen difficulty " + name + " unlocked";
      const hit = trackMessages.current.find((m) => m.text.indexOf(needle) >= 0);
      return hit ? hit.levelNr + 1 : 0;
    },
    zenTypeLabelLevels: () =>
      trackMessages.current
        .filter((m) => m.text.indexOf("Zen level type") >= 0)
        .map((m) => m.levelNr + 1)
        .sort((x, y) => x - y)
        .join(","),
    /** text of the message bar attached to a 1-based level, "" when there is none. */
    rewardText: (oneBased: number) => {
      const hit = trackMessages.current.find((m) => m.levelNr + 1 === oneBased);
      return hit ? hit.text : "";
    },
    zenButtonHidden: () => {
      const el = document.querySelector("[data-rb-zen-slot]");
      if (!el) return ABSENT;
      return /opacity-0/.test(el.getAttribute("class") || "") ? 1 : 0;
    },
    playLabel: () => dom.playButtonLabel(),
    nodeShiftClass: (oneBased: number) => {
      const el = document.querySelector(
        '[data-rb-node="' + oneBased + '"] [data-rb-node-inner]'
      );
      if (!el) return "";
      const hits = (el.getAttribute("class") || "")
        .split(/\s+/)
        .filter((c) => /^-?translate-x-/.test(c));
      return hits.length ? hits.join(" ") : "none";
    }
  };

  const storage: Namespace = {
    storeName: () => "block-sort-store",
    localStorageKeyCount: () => window.localStorage.length,
    sessionStorageKeyCount: () => window.sessionStorage.length,
    serviceWorkerControlled: () =>
      navigator.serviceWorker && navigator.serviceWorker.controller ? 1 : 0
  };

  return { meta, globals, residue, errors, level, dom, track, storage };
};

export const installRbProbe = (): void => {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __rb?: object; __rbInstalledAt?: number };
  if (w.__rb) return;

  window.addEventListener("error", (event) => {
    if (uncaught.length < 40) {
      const msg = event.message || (event.error && event.error.message) || "error";
      uncaught.push(String(msg).slice(0, 160));
    }
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (rejections.length < 40) {
      const reason = event.reason as { message?: string } | undefined;
      rejections.push(String((reason && reason.message) || reason || "rejection").slice(0, 160));
    }
  });
  const origError = console.error.bind(console);
  console.error = (...data: unknown[]): void => {
    if (consoleErrors.length < 40) {
      consoleErrors.push(
        data
          .map((a) => {
            if (typeof a === "string") return a;
            const m = (a as { message?: string } | null)?.message;
            return String(m || a);
          })
          .join(" ")
          .slice(0, 160)
      );
    }
    origError(...data);
  };

  const built = buildNamespaces();
  const frozen: Record<string, Namespace> = {};
  for (const name of Object.keys(built)) frozen[name] = guardNamespace(built[name]);
  w.__rbInstalledAt = Date.now();
  w.__rb = Object.freeze(frozen);
};

/**
 * RepairBench instrumentation probe for personal-kanban.
 *
 * Installs the window.__PKB__ bridge and stamps data-testid probes onto the
 * Material-UI DOM through a MutationObserver.
 *
 * Bridge contract: every accessor is LIVE - it re-queries the document (or
 * localStorage) on each call and never caches a node, a NodeList or a computed
 * style. React re-renders and react-beautiful-dnd DOM moves therefore can not
 * stale the readings. Checkpoint expressions must call window.__PKB__.<fn>()
 * fresh on every access and must never store the bridge object (or a value
 * derived from it) across an interaction.
 *
 * Missing-element convention: counters return 0, boolean probes return the
 * string "NO_EL" (so an assertion comparing against false fails loudly instead
 * of passing by accident), and textual probes return "NONE".
 */
(function () {
  const w = window as any;

  function q(sel: string): Element | null {
    try {
      return document.querySelector(sel);
    } catch (e) {
      return null;
    }
  }

  function qa(sel: string): Element[] {
    try {
      const nl = document.querySelectorAll(sel);
      const out: Element[] = [];
      for (let i = 0; i < nl.length; i += 1) {
        out.push(nl[i]);
      }
      return out;
    } catch (e) {
      return [];
    }
  }

  function nth(sel: string, i: number): Element | null {
    const list = qa(sel);
    if (i < 0 || i >= list.length) {
      return null;
    }
    return list[i];
  }

  function sub(sel: string, i: number, subSel: string): Element | null {
    const host = nth(sel, i);
    if (!host) {
      return null;
    }
    try {
      return host.querySelector(subSel);
    } catch (e) {
      return null;
    }
  }

  function subAll(sel: string, i: number, subSel: string): Element[] {
    const host = nth(sel, i);
    if (!host) {
      return [];
    }
    try {
      const nl = host.querySelectorAll(subSel);
      const out: Element[] = [];
      for (let k = 0; k < nl.length; k += 1) {
        out.push(nl[k]);
      }
      return out;
    } catch (e) {
      return [];
    }
  }

  function txt(el: Element | null): string {
    if (!el) {
      return "NONE";
    }
    const s = el.textContent;
    return s === null ? "NONE" : s.replace(/\s+/g, " ").trim();
  }

  function joinTxt(list: Element[]): string {
    const out: string[] = [];
    for (let i = 0; i < list.length; i += 1) {
      out.push(txt(list[i]));
    }
    return out.join("|");
  }

  function bgOf(el: Element | null): string {
    if (!el) {
      return "NONE";
    }
    return window.getComputedStyle(el).backgroundColor;
  }

  function attrOf(el: Element | null, name: string): string {
    if (!el) {
      return "NONE";
    }
    const v = el.getAttribute(name);
    return v === null ? "NONE" : v;
  }

  function valueOf(el: Element | null): any {
    if (!el) {
      return "NO_EL";
    }
    const v = (el as any).value;
    return v === undefined ? "NO_VALUE" : String(v);
  }

  function disabledOf(el: Element | null): any {
    if (!el) {
      return "NO_EL";
    }
    return (el as any).disabled === true;
  }

  function ancestorWith(el: Element | null, sel: string): Element | null {
    let node: Element | null = el;
    let guard = 0;
    while (node && guard < 12) {
      if (node.querySelector && node.querySelector(sel)) {
        return node;
      }
      node = node.parentElement;
      guard += 1;
    }
    return null;
  }

  function fieldEl(name: string): Element | null {
    return (
      q('[data-testid="pkb-dialog"] [name="' + name + '"]') ||
      q('[name="' + name + '"]')
    );
  }

  const COL = '[data-testid="pkb-col"]';
  const CARD = '[data-testid="pkb-card"]';

  w.__PKB__ = {
    ready: true,

    // ---- storage / globals (live reads) ----
    lsKeys: function (): string {
      const out: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        out.push(String(window.localStorage.key(i)));
      }
      out.sort();
      return out.join(",");
    },
    lsHas: function (key: string): boolean {
      return window.localStorage.getItem(key) !== null;
    },
    lsRaw: function (key: string): string {
      const v = window.localStorage.getItem(key);
      return v === null ? "NONE" : v;
    },
    lsGet: function (key: string): any {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return "NONE";
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || parsed === undefined) {
          return "NULL";
        }
        if (typeof parsed === "object") {
          return Array.isArray(parsed) ? "ARR:" + parsed.length : "OBJ";
        }
        return String(parsed);
      } catch (e) {
        return raw;
      }
    },
    lsColField: function (colIndex: number, field: string): string {
      const raw = window.localStorage.getItem("columns");
      if (raw === null) {
        return "NO_KEY";
      }
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        return "BAD_JSON";
      }
      if (!parsed || !parsed.length || colIndex < 0 || colIndex >= parsed.length) {
        return "NO_COL";
      }
      const v = parsed[colIndex][field];
      return v === undefined ? "UNDEF" : String(v);
    },
    bodyBg: function (): string {
      return window.getComputedStyle(document.body).backgroundColor;
    },
    docTitle: function (): string {
      return document.title;
    },
    i18nLang: function (): string {
      return w.__PKB_I18N__ ? String(w.__PKB_I18N__.language) : "NO_I18N";
    },
    i18nText: function (key: string): string {
      return w.__PKB_I18N__ ? String(w.__PKB_I18N__.t(key)) : "NO_I18N";
    },

    // ---- board aggregates ----
    colCount: function (): number {
      return qa(COL).length;
    },
    columnTitles: function (): string {
      const cols = qa(COL);
      const out: string[] = [];
      for (let i = 0; i < cols.length; i += 1) {
        out.push(txt(cols[i].querySelector("h6")));
      }
      return out.join("|");
    },
    cardCounts: function (): string {
      const cols = qa(COL);
      const out: string[] = [];
      for (let i = 0; i < cols.length; i += 1) {
        out.push(String(cols[i].querySelectorAll(CARD).length));
      }
      return out.join(",");
    },
    cardTitles: function (colIndex: number): string {
      return joinTxt(subAll(COL, colIndex, CARD + ' [data-testid="pkb-card-title"]'));
    },
    cardTitleAttrs: function (colIndex: number): string {
      const cards = subAll(COL, colIndex, CARD);
      const out: string[] = [];
      for (let i = 0; i < cards.length; i += 1) {
        out.push(attrOf(cards[i].querySelector('[data-testid="pkb-card-title"]'), "title"));
      }
      return out.join("|");
    },
    dragHandles: function (): number {
      return qa("[data-rbd-drag-handle-draggable-id]").length;
    },
    droppables: function (): number {
      return qa("[data-rbd-droppable-id]").length;
    },

    // ---- generic live element readers ----
    count: function (sel: string): number {
      return qa(sel).length;
    },
    exists: function (sel: string): boolean {
      return q(sel) !== null;
    },
    text: function (sel: string): string {
      return txt(q(sel));
    },
    texts: function (sel: string): string {
      return joinTxt(qa(sel));
    },
    attr: function (sel: string, name: string): string {
      return attrOf(q(sel), name);
    },
    value: function (sel: string): any {
      return valueOf(q(sel));
    },
    disabled: function (sel: string): any {
      return disabledOf(q(sel));
    },
    bg: function (sel: string): string {
      return bgOf(q(sel));
    },
    countIn: function (sel: string, i: number, subSel: string): number {
      return subAll(sel, i, subSel).length;
    },
    existsIn: function (sel: string, i: number, subSel: string): boolean {
      return sub(sel, i, subSel) !== null;
    },
    textIn: function (sel: string, i: number, subSel: string): string {
      return txt(sub(sel, i, subSel));
    },
    textsIn: function (sel: string, i: number, subSel: string): string {
      return joinTxt(subAll(sel, i, subSel));
    },
    attrIn: function (sel: string, i: number, subSel: string, name: string): string {
      return attrOf(sub(sel, i, subSel), name);
    },
    valueIn: function (sel: string, i: number, subSel: string): any {
      return valueOf(sub(sel, i, subSel));
    },
    disabledIn: function (sel: string, i: number, subSel: string): any {
      return disabledOf(sub(sel, i, subSel));
    },
    bgIn: function (sel: string, i: number, subSel: string): string {
      return bgOf(sub(sel, i, subSel));
    },
    nthBg: function (sel: string, i: number): string {
      return bgOf(nth(sel, i));
    },
    nthText: function (sel: string, i: number): string {
      return txt(nth(sel, i));
    },
    nthAttr: function (sel: string, i: number, name: string): string {
      return attrOf(nth(sel, i), name);
    },
    nthDisabled: function (sel: string, i: number): any {
      return disabledOf(nth(sel, i));
    },

    // ---- dialog / form readers ----
    dialogOpen: function (): boolean {
      return q('[data-testid="pkb-dialog"]') !== null;
    },
    dialogTitle: function (): string {
      return txt(q('[data-testid="pkb-dialog"] .MuiDialogTitle-root'));
    },
    dialogHeading: function (): string {
      return txt(q('[data-testid="pkb-dialog"] h6'));
    },
    dialogText: function (): string {
      return txt(q('[data-testid="pkb-dialog"] .MuiDialogContent-root'));
    },
    fieldValue: function (name: string): any {
      return valueOf(fieldEl(name));
    },
    fieldError: function (name: string): string {
      const el = fieldEl(name);
      const host = ancestorWith(el, ".MuiFormHelperText-root");
      if (!host) {
        return "";
      }
      const helper = host.querySelector(".MuiFormHelperText-root");
      return txt(helper);
    },
    fieldHasError: function (name: string): any {
      const el = fieldEl(name);
      if (!el) {
        return "NO_EL";
      }
      const host = ancestorWith(el, ".MuiFormHelperText-root");
      if (!host) {
        return false;
      }
      const helper = host.querySelector(".MuiFormHelperText-root");
      return helper ? helper.className.indexOf("Mui-error") >= 0 : false;
    },
    radioChecked: function (name: string): string {
      const list = qa('[data-testid="pkb-dialog"] input[name="' + name + '"]');
      for (let i = 0; i < list.length; i += 1) {
        if ((list[i] as any).checked === true) {
          return String(attrOf(list[i], "value"));
        }
      }
      return "NONE";
    },
  };

  function stamp(el: Element | null | undefined, id: string): void {
    if (el && !el.getAttribute("data-testid")) {
      el.setAttribute("data-testid", id);
    }
  }

  function all(root: any, sel: string): Element[] {
    const out: Element[] = [];
    if (root && root.matches && root.matches(sel)) {
      out.push(root);
    }
    if (root && root.querySelectorAll) {
      const nl = root.querySelectorAll(sel);
      for (let i = 0; i < nl.length; i += 1) {
        out.push(nl[i]);
      }
    }
    return out;
  }

  const TB_IDS = [
    "pkb-tb-logo",
    "pkb-tb-addcol",
    "pkb-tb-clear",
    "pkb-tb-info",
    "pkb-tb-dark",
    "pkb-tb-lang",
    "pkb-tb-github",
  ];

  function stampCard(card: Element): void {
    stamp(card, "pkb-card");
    stamp(card.querySelector("p.MuiTypography-body1"), "pkb-card-title");
    stamp(card.querySelector("p.MuiTypography-body2"), "pkb-card-desc");
    stamp(card.querySelector("p.MuiTypography-caption"), "pkb-card-created");
    const cicons = card.querySelectorAll(".MuiIconButton-root");
    if (cicons.length >= 1) {
      stamp(cicons[0], "pkb-card-edit");
    }
    if (cicons.length >= 2) {
      stamp(cicons[1], "pkb-card-delete");
    }
  }

  function stampColumn(col: Element): void {
    stamp(col, "pkb-col");
    stamp(col.querySelector("h6"), "pkb-col-title");
    const icons = col.querySelectorAll(".MuiIconButton-root");
    const ownIcons: Element[] = [];
    for (let i = 0; i < icons.length; i += 1) {
      if (!icons[i].closest(".MuiPaper-elevation1")) {
        ownIcons.push(icons[i]);
      }
    }
    if (ownIcons.length >= 4) {
      stamp(ownIcons[0], "pkb-col-edit");
      stamp(ownIcons[1], "pkb-col-delete");
      stamp(ownIcons[2], "pkb-col-addrecord");
      stamp(ownIcons[3], "pkb-col-deleteall");
    }
    const captions = col.querySelectorAll("p.MuiTypography-caption");
    for (let i = 0; i < captions.length; i += 1) {
      if (!captions[i].closest(".MuiPaper-elevation1")) {
        stamp(captions[i], "pkb-col-caption");
      }
    }
    const cards = col.querySelectorAll(".MuiPaper-elevation1");
    for (let i = 0; i < cards.length; i += 1) {
      stampCard(cards[i]);
    }
  }

  function stampDialog(dlg: Element): void {
    stamp(dlg, "pkb-dialog");
    stamp(dlg.querySelector('button[type="submit"]'), "pkb-dialog-submit");
    const outlined = dlg.querySelectorAll(".MuiButton-outlined");
    for (let i = 0; i < outlined.length; i += 1) {
      stamp(outlined[i], "pkb-dialog-cancel");
    }
    const contained = dlg.querySelectorAll(".MuiButton-containedPrimary");
    for (let i = 0; i < contained.length; i += 1) {
      stamp(contained[i], "pkb-dialog-confirm");
    }
  }

  function stampTree(root: any): void {
    if (!root || (!root.querySelectorAll && !root.matches)) {
      return;
    }

    const appbars = all(root, ".MuiAppBar-root");
    for (let i = 0; i < appbars.length; i += 1) {
      stamp(appbars[i], "pkb-appbar");
      stamp(appbars[i].querySelector(".MuiTypography-root"), "pkb-app-title");
      const btns = appbars[i].querySelectorAll(".MuiIconButton-root");
      for (let j = 0; j < btns.length && j < TB_IDS.length; j += 1) {
        stamp(btns[j], TB_IDS[j]);
      }
    }

    const cols = all(root, ".MuiPaper-elevation4");
    for (let i = 0; i < cols.length; i += 1) {
      stampColumn(cols[i]);
    }

    const dialogs = all(root, ".MuiDialog-root");
    for (let i = 0; i < dialogs.length; i += 1) {
      stampDialog(dialogs[i]);
    }

    const langItems = all(root, "#language-menu li[role='menuitem']");
    for (let i = 0; i < langItems.length; i += 1) {
      stamp(langItems[i], "pkb-lang-" + i);
    }

    const popovers = all(root, ".MuiPopover-paper");
    for (let i = 0; i < popovers.length; i += 1) {
      if (!popovers[i].matches(".MuiMenu-paper")) {
        stamp(popovers[i], "pkb-popover");
        stamp(popovers[i].querySelector("img"), "pkb-popover-img");
        const links = popovers[i].querySelectorAll('a[target="_blank"]');
        for (let j = 0; j < links.length; j += 1) {
          stamp(links[j], j === 0 ? "pkb-popover-link" : "pkb-popover-link-" + j);
        }
      }
    }
  }

  function boot(): void {
    stampTree(document);
    // Full-document re-stamp on every childList batch. Stamping only the added
    // node misses cards inserted into an ALREADY stamped column (the added node
    // is the card Paper, not a .MuiPaper-elevation4 column), so late-added
    // cards/rows would never receive their probes. stamp() is idempotent and
    // this document is small (~100 elements), so a rescan per batch is cheap.
    const observer = new MutationObserver(function () {
      stampTree(document);
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

export {};

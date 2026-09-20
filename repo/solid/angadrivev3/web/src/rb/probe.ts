//
//
// 为什么存在：本株 `data-testid` 实测 0 处（surface.json B7），替代锚只有 aria-label 1 处／role 2 处／data-index 2 处，
//   而 42 条检查点要读的大多是**位置性**读数（「第 3 张卡的 Size 读数」「同一张卡的 Eye 锚 href」「信息行第 2 个值」），
//   role=/text= 那套语法表达不了 ⇒ 发布 window.__RB__，一组对种子已渲染 DOM 的纯读函数。
//
// 硬规则（四条都是结构性的）：
//   1) 只读：0 处 DOM 写、0 处 dispatchEvent、0 处 click、0 处 store 写入、0 处 storage 写入、0 处网络。
//      唯一的常驻副作用是一个 MutationObserver（childList+subtree），只**观察**、只往本模块的数组里记账，
//      用于捕获 FileCard.tsx:390-396 那个「建好就点、点完就 remove()」的瞬时下载锚（P11 的唯一可读面）。
//   2) 不重实现应用逻辑：本文件不格式化字节数、不排日期、不截断名字、不拼 href、不排序、不过滤。
//      每个值都是从渲染好的 DOM 里读回来的（textContent／getAttribute），或从离线桩自己的状态里读回来的。
//   3) 不暴露缺陷态：本文件不知道 12 枚缺陷、不含任何期望值、不做任何「对/错」比较，只报告屏幕上有什么。
//   4) 不是检查点咽喉：下面每个读数都有等价的裸 DOM 表达式（见 COVERAGE 的 bare 字段）；探针缺席时
//      window.__RB__ 为 undefined，裸 DOM 断言仍绿、探针断言红 ⇒ 塌方可归因，不会变成 42/42 setup_failure。
//
//
//   一律**不**进 CSS 选择器，改用 className 子串／classList.contains 判定，避免转义歧义。

interface StubJournalEntry { [key: string]: unknown }
interface StubLike {
  version?: number;
  fixture?: string;
  profile?: string;
  handshake?: Record<string, unknown>;
  journal?: {
    ctor?: StubJournalEntry[];
    sent?: StubJournalEntry[];
    delivered?: StubJournalEntry[];
    blocked?: StubJournalEntry[];
    unhandled?: StubJournalEntry[];
    errors?: StubJournalEntry[];
  };
  sockets?: () => Array<Record<string, unknown>>;
  state?: { files?: Array<Record<string, unknown>>; collections?: Array<Record<string, unknown>> };
  fixture_map?: Record<string, unknown>;
  channels?: Array<Record<string, unknown>>;
  uncovered?: string[];
}
type Win = Window & { __RB__?: unknown; __RB_STUB__?: StubLike };

const PROBE_VERSION = 1;
const win = (): Win => window as unknown as Win;
const stub = (): StubLike | null => {
  const s = win().__RB_STUB__;
  return s === undefined ? null : s;
};

// ---------------------------------------------------------------- 文本与 class 小工具（纯读）
const rawText = (el: Element | null): string => (el !== null && el.textContent !== null ? el.textContent : "");
const normText = (el: Element | null): string => rawText(el).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const classHas = (el: Element, sub: string): boolean => typeof el.className === "string" && el.className.indexOf(sub) >= 0;
const all = (sel: string): Element[] => Array.from(document.querySelectorAll(sel));
const attr = (el: Element | null, name: string): string | null => (el !== null ? el.getAttribute(name) : null);

// ---------------------------------------------------------------- FileCard（web/src/components/FileCard.tsx:302-413）
export interface RbFieldPair { label: string; value: string; valueRaw: string }
export interface RbFileCard {
  index: number;
  title: string;
  titleRaw: string;
  fields: RbFieldPair[];
  type: string;
  uploadedName: string;
  timestamp: string;
  timestampRaw: string;
  size: string;
  eyeHref: string | null;
  previewHref: string | null;
  anchorHrefs: Array<string | null>;
  previewKind: string;
  previewSrc: string | null;
  hasConvert: boolean;
  hasDelete: boolean;
  hasDownload: boolean;
  hasCopy: boolean;
  hasSelect: boolean;
  selected: boolean;
}

const CARD_SELECTOR = "div.w-80.h-96.bg-neutral-950";      // FileCard 根节点的三个稳定类
const COLL_SELECTOR = "div.w-64.h-60.bg-neutral-800";      // CollectionCard 根节点的三个稳定类

const cardEls = (): Element[] => all(CARD_SELECTOR);

// 信息行的两列（左标签／右值）：第一个「有 ≥2 个子 div、每个子 div 含 ≥2 个 <p>」的 div
const fieldColumns = (root: Element): Element[][] => {
  const divs = Array.from(root.querySelectorAll("div"));
  for (const d of divs) {
    const cols = Array.from(d.children).filter((c: Element) => c.tagName === "DIV" && c.querySelectorAll("p").length >= 2);
    if (cols.length >= 2) return cols.map((c: Element) => Array.from(c.querySelectorAll("p")));
  }
  return [];
};
const fieldPairs = (root: Element): RbFieldPair[] => {
  const cols = fieldColumns(root);
  if (cols.length < 2) return [];
  const labels = cols[0];
  const values = cols[1];
  const out: RbFieldPair[] = [];
  const n = labels.length < values.length ? labels.length : values.length;
  for (let i = 0; i < n; i += 1) {
    out.push({
      label: normText(labels[i]).replace(/:$/, "").toLowerCase(),
      value: normText(values[i]),
      valueRaw: rawText(values[i]),
    });
  }
  return out;
};
const fieldValue = (card: Element, label: string): string => {
  const want = label.replace(/:$/, "").toLowerCase();
  const pairs = fieldPairs(card);
  for (const p of pairs) if (p.label === want) return p.value;
  return "";
};
const fieldValueRaw = (card: Element, label: string): string => {
  const want = label.replace(/:$/, "").toLowerCase();
  const pairs = fieldPairs(card);
  for (const p of pairs) if (p.label === want) return p.valueRaw;
  return "";
};
const classBlob = (card: Element): string => {
  let s = typeof card.className === "string" ? card.className : "";
  const els = Array.from(card.querySelectorAll("*"));
  for (const el of els) if (typeof el.className === "string") s += " " + el.className;
  return s;
};
const anchorsOf = (card: Element): Element[] => Array.from(card.querySelectorAll("a"));
const previewAnchor = (card: Element): Element | null => {
  const as = anchorsOf(card);
  for (const a of as) if (classHas(a, "overflow-hidden")) return a;
  return as.length > 0 ? as[0] : null;
};
const eyeAnchor = (card: Element): Element | null => {
  const as = anchorsOf(card);
  for (const a of as) if (classHas(a, "bg-yellow-700/30")) return a;
  return as.length > 1 ? as[as.length - 1] : null;
};
const previewOf = (card: Element): { kind: string; src: string | null } => {
  const host: Element = previewAnchor(card) || card;
  const img = host.querySelector("img");
  if (img !== null) return { kind: "img", src: attr(img, "src") };
  const audio = host.querySelector("audio");
  if (audio !== null) return { kind: "audio", src: attr(audio, "src") };
  const video = host.querySelector("video");
  if (video !== null) return { kind: "video", src: attr(video, "src") };
  if (host.querySelector("svg") !== null) return { kind: "svg", src: null };
  return { kind: "none", src: null };
};
const titleOf = (card: Element): Element | null => card.querySelector("p.text-2xl");
const describeCard = (card: Element, index: number): RbFileCard => {
  const blob = classBlob(card);
  const pv = previewOf(card);
  return {
    index: index,
    title: normText(titleOf(card)),
    titleRaw: rawText(titleOf(card)),
    fields: fieldPairs(card),
    type: fieldValue(card, "Type"),
    uploadedName: fieldValue(card, "Uploaded Name"),
    timestamp: fieldValue(card, "Timestamp"),
    timestampRaw: fieldValueRaw(card, "Timestamp"),
    size: fieldValue(card, "Size"),
    eyeHref: attr(eyeAnchor(card), "href"),
    previewHref: attr(previewAnchor(card), "href"),
    anchorHrefs: anchorsOf(card).map((a: Element) => attr(a, "href")),
    previewKind: pv.kind,
    previewSrc: pv.src,
    hasConvert: blob.indexOf("text-blue-500") >= 0,
    hasDelete: blob.indexOf("bg-red-800/30") >= 0,
    hasDownload: blob.indexOf("text-green-500") >= 0,
    hasCopy: blob.indexOf("text-cyan-500") >= 0,
    hasSelect: blob.indexOf("border-blue-400") >= 0 || blob.indexOf("bg-blue-700") >= 0,
    selected: classHas(card, "border-blue-700"),
  };
};
const driveCards = (): RbFileCard[] => cardEls().map((c: Element, i: number) => describeCard(c, i));
const cardByDir = (dir: string): RbFileCard | null => {
  const cards = driveCards();
  for (const c of cards) if (c.uploadedName === dir) return c;
  return null;
};

// ---------------------------------------------------------------- CollectionCard（web/src/components/CollectionCard.tsx:109-126）
export interface RbCollectionCard {
  index: number;
  title: string;
  titleRaw: string;
  titleLength: number;
  fields: RbFieldPair[];
  size: string;
  fileCount: string;
  folderCount: string;
  editors: string;
}
const describeCollection = (card: Element, index: number): RbCollectionCard => ({
  index: index,
  title: normText(titleOf(card)),
  titleRaw: rawText(titleOf(card)),
  titleLength: normText(titleOf(card)).length,
  fields: fieldPairs(card),
  size: fieldValue(card, "Size"),
  fileCount: fieldValue(card, "File Count"),
  folderCount: fieldValue(card, "Folder Count"),
  editors: fieldValue(card, "Editors"),
});
const collectionCards = (): RbCollectionCard[] => all(COLL_SELECTOR).map((c: Element, i: number) => describeCollection(c, i));

// ---------------------------------------------------------------- /my_drive 壳与控件
const driveShellKind = (): string => {
  for (const n of all("nav")) if (classHas(n, "backdrop-blur-md")) return "mobile";   // MobileNavbar（Navbar.tsx:58）
  if (document.querySelector("div.max-h-screen.w-screen") !== null) return "desktop"; // DesktopTemplate（Template.tsx:43）
  return "absent";
};
const driveTitleRaw = (): string => {
  for (const p of all("p")) if (p.classList.contains("font-black") && classHas(p, "text-[4vh]")) return rawText(p);
  return "";
};
const searchInput = (): HTMLInputElement | null => {
  const el = document.querySelector('input[placeholder="Search files by name or path"]');
  return el === null ? null : (el as HTMLInputElement);
};
const sortTrigger = (): Element | null => document.querySelector('button[aria-haspopup="listbox"]');
const sortListbox = (): Element | null => document.querySelector('ul[role="listbox"]');
export interface RbSortOption { index: number; text: string; dataIndex: string | null; selected: boolean }
const sortOptions = (): RbSortOption[] => {
  const box = sortListbox();
  if (box === null) return [];
  return Array.from(box.querySelectorAll('li[role="option"]')).map((li: Element, i: number) => ({
    index: i,
    text: normText(li),
    dataIndex: attr(li, "data-index"),
    selected: attr(li, "aria-selected") === "true",
  }));
};
export interface RbNotice { text: string; className: string; bannerClassName: string }
const notices = (): RbNotice[] => {
  const out: RbNotice[] = [];
  for (const p of all("p.text-sm")) {
    const parent = p.parentElement;
    const banner = parent !== null ? parent.parentElement : null;
    out.push({
      text: normText(p),
      className: typeof p.className === "string" ? p.className : "",
      bannerClassName: banner !== null && typeof banner.className === "string" ? banner.className : "",
    });
  }
  return out;
};

// ---------------------------------------------------------------- /account（AccountManager.tsx:20-24、DangerZone.tsx:75-91）
export interface RbStat { title: string; value: string; valueRaw: string }
const accountStats = (): RbStat[] => {
  const out: RbStat[] = [];
  for (const p of all("p.text-blue-700")) {
    const next = p.nextElementSibling;
    out.push({ title: normText(p), value: normText(next), valueRaw: rawText(next) });
  }
  return out;
};
const accountStat = (title: string): RbStat | null => {
  const want = title.replace(/\s+/g, " ").trim().toLowerCase();
  for (const s of accountStats()) if (s.title.toLowerCase() === want) return s;
  return null;
};
const buttonTexts = (): string[] => all("button").map((b: Element) => normText(b)).filter((t: string) => t.length > 0);
const logoutButtonPresent = (): boolean => buttonTexts().indexOf("Log Out") >= 0;
const loginFormPresent = (): boolean => document.querySelector('input[type="password"]') !== null;

// ---------------------------------------------------------------- 首页（Header.tsx:12-26／29-79、DefaultsButtons.tsx）
export interface RbSubtitle { present: boolean; raw: string; norm: string; emText: string; beforeEm: string; afterEm: string }
const homeSubtitle = (): RbSubtitle => {
  const em = document.querySelector("p em");
  if (em === null) return { present: false, raw: "", norm: "", emText: "", beforeEm: "", afterEm: "" };
  const p = em.parentElement;
  if (p === null) return { present: false, raw: "", norm: "", emText: normText(em), beforeEm: "", afterEm: "" };
  const raw = rawText(p);
  const emRaw = rawText(em);
  const cut = raw.indexOf(emRaw);
  return {
    present: true,
    raw: raw,
    norm: normText(p),
    emText: normText(em),
    beforeEm: cut >= 0 ? raw.slice(0, cut) : "",
    afterEm: cut >= 0 ? raw.slice(cut + emRaw.length) : "",
  };
};
const homeTitleEl = (): Element | null => {
  const em = document.querySelector("p em");
  if (em === null || em.parentElement === null) return null;
  return em.parentElement.previousElementSibling;
};
const homeTitleText = (): string => normText(homeTitleEl());
const homeTitleRaw = (): string => rawText(homeTitleEl());
const homeHeaderKind = (): string => {
  const el = homeTitleEl();
  if (el === null) return "absent";
  const spans = el.querySelectorAll("span").length;
  if (spans >= 3) return "mobile";        // MobileHeader 的 Anga／Drive／V3 三段 span
  if (normText(el).length > 0) return "desktop";
  return "absent";
};
export interface RbSwitch { index: number; title: string; defaultText: string; value: string }
const defaultsSwitches = (): RbSwitch[] => {
  const out: RbSwitch[] = [];
  for (const p of all("p")) {
    const t = normText(p);
    if (t.indexOf("Default:") !== 0) continue;
    const parent = p.parentElement;
    const titleEl = parent !== null ? parent.querySelector("p") : null;
    out.push({
      index: out.length,
      title: titleEl !== null && titleEl !== p ? normText(titleEl) : "",
      defaultText: t,
      value: t.replace(/^Default:\s*/, ""),
    });
  }
  return out;
};

// ---------------------------------------------------------------- 存储（只读）
const storageKeys = (): string[] => {
  const out: string[] = [];
  const ls = window.localStorage;
  if (!ls) return out;
  const n = ls.length < 64 ? ls.length : 64;
  for (let i = 0; i < n; i += 1) { const k = ls.key(i); if (k !== null) out.push(k); }
  return out;
};
const storageGet = (key: string): string | null => { const ls = window.localStorage; return ls ? ls.getItem(key) : null; };
const storageSnapshot = (): Record<string, string | null> => {
  const out: Record<string, string | null> = {};
  for (const k of storageKeys()) out[k] = storageGet(k);
  return out;
};
export interface RbTokenParts { present: boolean; segmentCount: number; segmentLengths: number[]; charsets: string[] }
const tokenParts = (): RbTokenParts => {
  const t = storageGet("token");
  if (t === null || t === "") return { present: false, segmentCount: 0, segmentLengths: [], charsets: [] };
  const segs = t.split(".");
  return {
    present: true,
    segmentCount: segs.length,
    segmentLengths: segs.map((s: string) => s.length),
    charsets: segs.map((s: string) => (/^[0-9]+$/.test(s) ? "digits" : (/^[A-Za-z0-9]+$/.test(s) ? "alnum" : "other"))),
  };
};

// ---------------------------------------------------------------- 瞬时下载锚（P11 的唯一可读面）
export interface RbTransientAnchor { seq: number; href: string | null; hasDownload: boolean }
const transients: RbTransientAnchor[] = [];
let transientSeq = 0;
const recordTransient = (a: Element): void => {
  transientSeq += 1;
  transients.push({ seq: transientSeq, href: attr(a, "href"), hasDownload: a.hasAttribute("download") });
  if (transients.length > 200) transients.shift();
};
const installObserver = (): boolean => {
  if (typeof MutationObserver !== "function") return false;
  if (!document.body) return false;
  const obs = new MutationObserver((records: MutationRecord[]) => {
    for (const r of records) {
      const added = Array.from(r.addedNodes);
      for (const node of added) {
        if (node.nodeType !== 1) continue;
        const el = node as Element;
        if (el.tagName === "A") { if (el.hasAttribute("download")) recordTransient(el); continue; }
        for (const a of Array.from(el.querySelectorAll("a"))) if (a.hasAttribute("download")) recordTransient(a);
      }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  return true;
};
const transientAnchors = (): RbTransientAnchor[] => transients.slice();
const downloadAnchorHrefs = (): Array<string | null> => transients.map((t: RbTransientAnchor) => t.href);

// ---------------------------------------------------------------- 桩面（只读快照；桩不在时全部返回空/假）
const stubPresent = (): boolean => stub() !== null;
const stubHandshake = (): Record<string, unknown> => { const s = stub(); return s !== null && s.handshake ? s.handshake : {}; };
const stubFixture = (): string => { const s = stub(); return s !== null && s.fixture ? s.fixture : ""; };
const stubProfile = (): string => { const s = stub(); return s !== null && s.profile ? s.profile : ""; };
const stubSockets = (): Array<Record<string, unknown>> => { const s = stub(); return s !== null && typeof s.sockets === "function" ? s.sockets() : []; };
const stubSentTypes = (): string[] => {
  const s = stub();
  if (s === null || !s.journal || !s.journal.sent) return [];
  const out: string[] = [];
  for (const e of s.journal.sent) { const t = e.type; if (typeof t === "string" && out.indexOf(t) < 0) out.push(t); }
  return out;
};
const stubDeliveredTypes = (): string[] => {
  const s = stub();
  if (s === null || !s.journal || !s.journal.delivered) return [];
  const out: string[] = [];
  for (const e of s.journal.delivered) { const t = e.type; if (typeof t === "string" && out.indexOf(t) < 0) out.push(t); }
  return out;
};
const stubBlocked = (): StubJournalEntry[] => { const s = stub(); return s !== null && s.journal && s.journal.blocked ? s.journal.blocked.slice() : []; };
const stubUnhandled = (): StubJournalEntry[] => { const s = stub(); return s !== null && s.journal && s.journal.unhandled ? s.journal.unhandled.slice() : []; };
const stubErrors = (): StubJournalEntry[] => { const s = stub(); return s !== null && s.journal && s.journal.errors ? s.journal.errors.slice() : []; };
const stubFiles = (): Array<Record<string, unknown>> => { const s = stub(); return s !== null && s.state && s.state.files ? s.state.files.slice() : []; };
const stubCollections = (): Array<Record<string, unknown>> => { const s = stub(); return s !== null && s.state && s.state.collections ? s.state.collections.slice() : []; };
const stubChannels = (): Array<Record<string, unknown>> => { const s = stub(); return s !== null && s.channels ? s.channels.slice() : []; };
const stubUncovered = (): string[] => { const s = stub(); return s !== null && s.uncovered ? s.uncovered.slice() : []; };

// ---------------------------------------------------------------- 杂项
const liveRegionTexts = (): string[] => {
  const out: string[] = [];
  for (const el of all("[aria-live]")) { const t = normText(el); if (t.length > 0) out.push(t); }
  for (const el of all('[role="status"]')) { const t = normText(el); if (t.length > 0 && out.indexOf(t) < 0) out.push(t); }
  return out;
};
const allPreviewSrcs = (): Array<string | null> => driveCards().map((c: RbFileCard) => c.previewSrc).filter((s: string | null) => s !== null);

// ---------------------------------------------------------------- 门面
const facade = {
  probeVersion: (): number => PROBE_VERSION,
  route: (): string => window.location.pathname,
  search: (): string => window.location.search,
  docTitle: (): string => document.title,
  viewport: (): { width: number; height: number } => ({ width: window.innerWidth, height: window.innerHeight }),
  rootPresent: (): boolean => document.getElementById("root") !== null,
  // /my_drive 卡片面
  driveCards: driveCards,
  driveCardCount: (): number => cardEls().length,
  driveCardNames: (): string[] => driveCards().map((c: RbFileCard) => c.title),
  driveCardDirs: (): string[] => driveCards().map((c: RbFileCard) => c.uploadedName),
  driveCardByDir: cardByDir,
  driveCardField: (dir: string, label: string): string => { const c = cardByDir(dir); return c === null ? "" : c.fields.filter((f: RbFieldPair) => f.label === label.replace(/:$/, "").toLowerCase()).map((f: RbFieldPair) => f.value).join("|"); },
  driveCardType: (dir: string): string => { const c = cardByDir(dir); return c === null ? "" : c.type; },
  driveCardSize: (dir: string): string => { const c = cardByDir(dir); return c === null ? "" : c.size; },
  driveCardTimestamp: (dir: string): string => { const c = cardByDir(dir); return c === null ? "" : c.timestamp; },
  driveCardTimestampRaw: (dir: string): string => { const c = cardByDir(dir); return c === null ? "" : c.timestampRaw; },
  // 🔴 href 一律 getAttribute（不用 a.href：浏览器会把相对值规范化成绝对 URL，抹平 D06 的红因）
  driveCardEyeHref: (dir: string): string | null => { const c = cardByDir(dir); return c === null ? null : c.eyeHref; },
  driveCardPreviewHref: (dir: string): string | null => { const c = cardByDir(dir); return c === null ? null : c.previewHref; },
  driveCardPreviewSrc: (dir: string): string | null => { const c = cardByDir(dir); return c === null ? null : c.previewSrc; },
  driveCardPreviewKind: (dir: string): string => { const c = cardByDir(dir); return c === null ? "" : c.previewKind; },
  driveCardFlags: (dir: string): Record<string, boolean> => { const c = cardByDir(dir); return c === null ? {} : { hasConvert: c.hasConvert, hasDelete: c.hasDelete, hasDownload: c.hasDownload, hasCopy: c.hasCopy, hasSelect: c.hasSelect, selected: c.selected }; },
  allPreviewSrcs: allPreviewSrcs,
  previewKinds: (): string[] => driveCards().map((c: RbFileCard) => c.previewKind),
  // 壳与控件
  driveShellKind: driveShellKind,
  driveTitleRaw: driveTitleRaw,
  driveTitleNorm: (): string => driveTitleRaw().replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(),
  searchInputPresent: (): boolean => searchInput() !== null,
  searchInputValue: (): string => { const el = searchInput(); return el === null ? "" : el.value; },
  sortTriggerPresent: (): boolean => sortTrigger() !== null,
  sortTriggerText: (): string => { const t = sortTrigger(); return t === null ? "" : normText(t.querySelector("span")); },
  sortTriggerExpanded: (): string | null => attr(sortTrigger(), "aria-expanded"),
  sortListboxPresent: (): boolean => sortListbox() !== null,
  sortOptions: sortOptions,
  sortOptionCount: (): number => sortOptions().length,
  sortOptionTexts: (): string[] => sortOptions().map((o: RbSortOption) => o.text),
  notices: notices,
  noticeTexts: (): string[] => notices().map((n: RbNotice) => n.text),
  // /my_collections
  collectionCards: collectionCards,
  collectionCardCount: (): number => all(COLL_SELECTOR).length,
  collectionTitles: (): string[] => collectionCards().map((c: RbCollectionCard) => c.title),
  collectionTitleRaw: (index: number): string => { const cs = collectionCards(); return index >= 0 && index < cs.length ? cs[index].titleRaw : ""; },
  collectionTitleLengths: (): number[] => collectionCards().map((c: RbCollectionCard) => c.titleLength),
  // /account
  accountStats: accountStats,
  accountStat: accountStat,
  accountStatValue: (title: string): string => { const s = accountStat(title); return s === null ? "" : s.value; },
  buttonTexts: buttonTexts,
  logoutButtonPresent: logoutButtonPresent,
  loginFormPresent: loginFormPresent,
  // 首页
  homeTitleText: homeTitleText,
  homeTitleRaw: homeTitleRaw,
  homeTitleSpanCount: (): number => { const el = homeTitleEl(); return el === null ? 0 : el.querySelectorAll("span").length; },
  homeHeaderKind: homeHeaderKind,
  homeSubtitle: homeSubtitle,
  homeSubtitleText: (): string => homeSubtitle().norm,
  defaultsSwitches: defaultsSwitches,
  defaultsValues: (): string[] => defaultsSwitches().map((s: RbSwitch) => s.value),
  defaultsTitles: (): string[] => defaultsSwitches().map((s: RbSwitch) => s.title),
  // 存储（只读）
  storageKeys: storageKeys,
  storageGet: storageGet,
  storageSnapshot: storageSnapshot,
  tokenParts: tokenParts,
  // 瞬时下载锚
  transientAnchors: transientAnchors,
  downloadAnchorHrefs: downloadAnchorHrefs,
  // 桩面
  stubPresent: stubPresent,
  stubHandshake: stubHandshake,
  stubFixture: stubFixture,
  stubProfile: stubProfile,
  stubSockets: stubSockets,
  stubSentTypes: stubSentTypes,
  stubDeliveredTypes: stubDeliveredTypes,
  stubBlocked: stubBlocked,
  stubUnhandled: stubUnhandled,
  stubErrors: stubErrors,
  stubFiles: stubFiles,
  stubCollections: stubCollections,
  stubChannels: stubChannels,
  stubUncovered: stubUncovered,
  // 杂项
  liveRegionTexts: liveRegionTexts,
  coverage: (): Record<string, string> => COVERAGE,
  keys: (): string[] => Object.keys(facade),
};
export type RbFacade = typeof facade;

// 42 条检查点 → 本门面的读数函数（DSL 出件时按此接线；bare 是等价的裸 DOM 表达式，说明探针不是咽喉）
const COVERAGE: Record<string, string> = {
  F01: "driveCardSize(dir) ＋ accountStatValue('Space Used')",
  F02: "driveCardType('u1/ab/PHOTO.JPG')",
  F03: "driveCardType('u1/ab/notes.pdf')",
  F04: "driveCardCount() ＋ driveCardDirs()（删除帧前/后两段读数）",
  F05: "storageGet('password')",
  F06: "driveCardEyeHref(dir)（getAttribute，禁 a.href）",
  F07: "driveCardEyeHref(dir)（数裸空格与 %20）",
  F08: "driveCardTimestamp(dir)",
  F09: "driveCardNames() ×6 个排序选项 ＋ sortOptionTexts()",
  F10: "driveCardNames()／driveCardCount() ×3 个查询 ＋ noticeTexts()",
  F11: "sortTriggerPresent()",
  F12: "collectionTitleRaw(2) ＋ collectionTitleLengths()",
  P01: "stubHandshake() ＋ stubSockets() ＋ driveCardCount()",
  P02: "driveCardSize(dir)（1023 字节那张）",
  P03: "accountStatValue('Files Hosted')",
  P04: "driveCardType('u1/ab/backup.zip')",
  P05: "driveCardType('u1/ab/readme.txt')",
  P06: "driveCardType('u1/ab/clip.mp4')",
  P07: "driveCardCount()（删除帧到达前）",
  P08: "driveCardCount()（file_update{toggle:true} 后）",
  P09: "storageGet('email') ＋ storageGet('display_name')",
  P10: "storageGet('token') ＋ tokenParts()",
  P11: "downloadAnchorHrefs()（MutationObserver 捕获 FileCard.tsx:390-396 的瞬时锚）",
  P12: "driveCardEyeHref(dir)（尾部）",
  P13: "driveCardEyeHref(dir)（1 个空格那张）",
  P14: "driveCardTimestamp(dir)",
  P15: "driveCardNames()（多重集）",
  P16: "sortTriggerText()",
  P17: "driveCardCount()（空查询）",
  P18: "driveCardNames()（共享关键词查询）",
  P19: "sortTriggerPresent()（3 文件夹具）",
  P20: "sortTriggerPresent()（1 文件夹具）",
  P21: "collectionTitleRaw(1) ＋ collectionTitleLengths()",
  P22: "collectionTitleRaw(3) ＋ collectionTitleLengths()",
  P23: "homeHeaderKind() ＋ homeTitleSpanCount() ＋ viewport()",
  P24: "driveShellKind() ＋ driveTitleRaw() ＋ viewport()",
  P25: "defaultsValues() ＋ defaultsTitles()",
  P26: "defaultsValues()（点击前后）＋ storageKeys()",
  P27: "allPreviewSrcs()",
  P28: "driveCardPreviewSrc(dir) ＋ driveCardPreviewKind(dir)",
  P29: "homeSubtitle()",
  P30: "homeTitleText()（两次加载比对）",
};

export function installRbProbe(): boolean {
  const w = win();
  if (w.__RB__ !== undefined) return false;
  let observerArmed = false;
  try { observerArmed = installObserver(); } catch { observerArmed = false; }
  try {
    w.__RB__ = facade;
    (w as unknown as { __RB_OBSERVER__?: boolean }).__RB_OBSERVER__ = observerArmed;
    return true;
  } catch {
    return false;
  }
}

// RepairBench read-only instrumentation probe.
// Publishes observable application state for the verifier. Every reader is read-only and
// fail-closed: on error it returns an inert sentinel instead of throwing.
export type RbBridge = Record<string, (...args: never[]) => RbScalar>;

declare global {
  interface Window {
    __MK__?: RbBridge;
    __RB_FENCE__?: { attempts: string[]; installOrigin: string; installed: boolean };
  }
}

type RbScalar = string | number | boolean;

const RB_ERRORS: string[] = [];
let rbTrapped = false;

function rbTrapErrors(): void {
  if (rbTrapped) return;
  rbTrapped = true;
  window.addEventListener("error", (event) => {
    RB_ERRORS.push(`error: ${String(event.message || "unknown").slice(0, 200)}`);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    RB_ERRORS.push(`rejection: ${String((reason && reason.message) || reason || "unknown").slice(0, 200)}`);
  });
}

function rbText(node: Element | null): string {
  if (!node) return "";
  const asHtml = node as HTMLElement;
  const raw = typeof asHtml.innerText === "string" ? asHtml.innerText : String(node.textContent || "");
  return raw.replace(/\s+/g, " ").trim();
}

//
// `cm-markra-syntax-character` 装饰会按活动行状态隐藏 markup 字符，实测同一 mut 面 `.cm-content`
// 的 innerText 折叠长度在 443（markup 可见）与 441（`#` 与其后空格被隐藏）之间摆动
//
//
// textContent 只反映 DOM 文本、不受 CSS 隐藏与活动行影响 ⇒ 实测四面全时点恒定 435。
function rbTextContent(node: Element | null): string {
  if (!node) return "";
  return String(node.textContent || "").replace(/\s+/g, " ").trim();
}

function rbLines(node: Element | null): string[] {
  if (!node) return [];
  const asHtml = node as HTMLElement;
  const raw = typeof asHtml.innerText === "string" ? asHtml.innerText : String(node.textContent || "");
  const out: string[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.replace(/\s+/g, " ").trim();
    if (trimmed.length > 0) out.push(trimmed);
  }
  return out;
}

function rbAll(selector: string): Element[] {
  return Array.from(document.querySelectorAll(selector));
}

function rbCount(selector: string): number {
  return rbAll(selector).length;
}

function rbFirst(selector: string): Element | null {
  const found = rbAll(selector);
  return found.length > 0 ? found[0] : null;
}

function rbAttr(selector: string, name: string): string {
  const node = rbFirst(selector);
  return node ? String(node.getAttribute(name) || "") : "";
}

function rbAriaLabels(prefix: string): string[] {
  const out: string[] = [];
  for (const node of rbAll("[aria-label]")) {
    const value = String(node.getAttribute("aria-label") || "");
    if (value.indexOf(prefix) === 0) out.push(value);
  }
  return out;
}

function rbAriaLabelAt(index: number, prefix: string): string {
  const labels = rbAriaLabels(prefix);
  return index < labels.length ? labels[index] : "";
}

function rbJoined(values: string[]): string {
  return values.join("|");
}

function rbAriaExactNodes(label: string): Element[] {
  const out: Element[] = [];
  for (const node of rbAll("[aria-label]")) {
    if (String(node.getAttribute("aria-label") || "") === label) out.push(node);
  }
  return out;
}

function rbNodeDescriptor(node: Element | null): string {
  if (!node) return "";
  const role = String(node.getAttribute("role") || "");
  const cls = String(node.getAttribute("class") || "").split(" ")[0];
  return `${node.tagName.toLowerCase()}${role ? `[role=${role}]` : ""}${cls ? `.${cls}` : ""}`;
}

function rbHeaderLabels(): string[] {
  const out: string[] = [];
  for (const node of rbAll("header [aria-label]")) {
    out.push(String(node.getAttribute("aria-label") || ""));
  }
  return out;
}

function rbOutlineItems(): string[] {
  const out: string[] = [];
  for (const node of rbAll('ol[aria-label="Document outline"] > *')) {
    out.push(rbText(node));
  }
  return out;
}

function rbChevronLabels(): string[] {
  return rbAriaLabels("Collapse heading:").concat(rbAriaLabels("Expand heading:"));
}

function rbSettingsNavLabels(): string[] {
  const pattern = /^(General|Storage|Backups|Sync|Logs|Appearance|View|Editor|Templates|Keyboard shortcuts|Export)$/;
  const out: string[] = [];
  for (const node of rbAll("[aria-label]")) {
    const value = String(node.getAttribute("aria-label") || "");
    if (pattern.test(value)) out.push(value);
  }
  return out;
}

function rbSelectByLabel(label: string): HTMLSelectElement | null {
  for (const node of rbAll("select")) {
    if (String(node.getAttribute("aria-label") || "") === label) return node as HTMLSelectElement;
  }
  return null;
}

function rbSelectOptionList(label: string): string[] {
  const select = rbSelectByLabel(label);
  if (!select) return [];
  const out: string[] = [];
  for (const option of Array.from(select.options)) {
    out.push(`${option.value}|${rbText(option)}`);
  }
  return out;
}

function rbVisibilityHost(): Element | null {
  return rbFirst('[aria-label="Element visibility"]');
}

function rbVisibilityRow(label: string): string {
  const lines = rbLines(rbVisibilityHost());
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === label) return index + 1 < lines.length ? lines[index + 1] : "";
    if (line.indexOf(`${label} `) === 0) return line.slice(label.length + 1);
  }
  return "";
}

function rbInputByLabel(label: string, kind: string): HTMLInputElement | null {
  for (const node of rbAll(`input[type=${kind}]`)) {
    if (String(node.getAttribute("aria-label") || "") === label) return node as HTMLInputElement;
  }
  return null;
}

function rbRadioGroup(label: string): Element | null {
  for (const node of rbAll('[role="radiogroup"]')) {
    if (String(node.getAttribute("aria-label") || "") === label) return node;
  }
  return null;
}

function rbRadioGroupOptionLabels(label: string): string[] {
  const group = rbRadioGroup(label);
  if (!group) return [];
  const out: string[] = [];
  for (const node of Array.from(group.querySelectorAll('[role="radio"]'))) {
    const named = String(node.getAttribute("aria-label") || "");
    out.push(named.length > 0 ? named : rbText(node));
  }
  return out;
}

function rbRadioGroupCheckedLabel(label: string): string {
  const group = rbRadioGroup(label);
  if (!group) return "";
  for (const node of Array.from(group.querySelectorAll('[role="radio"]'))) {
    if (String(node.getAttribute("aria-checked") || "") !== "true") continue;
    const named = String(node.getAttribute("aria-label") || "");
    return named.length > 0 ? named : rbText(node);
  }
  return "";
}

function rbMenuRadioTexts(): string[] {
  const out: string[] = [];
  for (const node of rbAll('[role="menuitemradio"],[role="menuitem"]')) {
    out.push(rbText(node).slice(0, 40));
  }
  return out;
}

function rbMenuRadioCheckedTexts(): string[] {
  const out: string[] = [];
  for (const node of rbAll('[role="menuitemradio"],[role="menuitem"]')) {
    if (String(node.getAttribute("aria-checked") || "") === "true") out.push(rbText(node).slice(0, 40));
  }
  return out;
}

function rbHeadingTexts(): string[] {
  const out: string[] = [];
  for (const node of rbAll("h1,h2,h3")) {
    out.push(`${node.tagName.toLowerCase()}:${rbText(node).slice(0, 40)}`);
  }
  return out;
}

function rbVersionText(): string {
  const match = rbText(document.body).match(/Markra v\d+\.\d+\.\d+/);
  return match ? match[0] : "";
}

function rbFenceLedger(): { attempts: string[]; installed: boolean } | null {
  const ledger = window.__RB_FENCE__;
  if (!ledger) return null;
  return { attempts: ledger.attempts, installed: Boolean(ledger.installed) };
}

function rbNonLocalResourceCount(): number {
  const origin = window.location.origin;
  let count = 0;
  for (const entry of performance.getEntriesByType("resource")) {
    if (String(entry.name).indexOf(origin) === 0) continue;
    if (String(entry.name).indexOf("data:") === 0) continue;
    if (String(entry.name).indexOf("blob:") === 0) continue;
    count += 1;
  }
  return count;
}

function rbResourceCount(): number {
  return performance.getEntriesByType("resource").length;
}

function rbStatusText(): string {
  return rbText(rbFirst("footer.quiet-status"));
}

function rbStatusSavedFlag(): string {
  const text = rbStatusText();
  if (/\bunsaved\b/.test(text)) return "unsaved";
  if (/\bsaved\b/.test(text)) return "saved";
  return "";
}

function rbWordCount(): number {
  const match = rbStatusText().match(/^(\d+)\s/);
  return match ? Number(match[1]) : -1;
}

function rbEditorFontSize(): string {
  const node = rbFirst('article[data-editor-engine="codemirror"]');
  if (!node) return "";
  return getComputedStyle(node).fontSize;
}

function rbParagraphSpacingVar(): string {
  const node = rbFirst('article[data-editor-engine="codemirror"]');
  if (!node) return "";
  const asHtml = node as HTMLElement;
  return String(asHtml.style.getPropertyValue("--editor-paragraph-spacing") || "");
}

function rbAriaLabelList(prefix: string): string[] {
  return rbAriaLabels(prefix);
}

function rbAriaExactDescriptorList(label: string): string[] {
  const out: string[] = [];
  for (const node of rbAriaExactNodes(label)) out.push(rbNodeDescriptor(node));
  return out;
}

// ---- published readers (pure) ----

function errorCount(): number {
  return RB_ERRORS.length;
}

function errorJoined(): string {
  return rbJoined(RB_ERRORS.slice(0, 3));
}

function blockedCount(): number {
  const ledger = rbFenceLedger();
  return ledger ? ledger.attempts.length : -1;
}

function blockedJoined(): string {
  const ledger = rbFenceLedger();
  return ledger ? rbJoined(ledger.attempts.slice(0, 5)) : "";
}

function fenceInstalled(): boolean {
  const ledger = rbFenceLedger();
  return ledger ? ledger.installed : false;
}

function resourceCount(): number {
  return rbResourceCount();
}

function nonLocalResourceCount(): number {
  return rbNonLocalResourceCount();
}

function titleText(): string {
  return document.title;
}

function rootChildren(): number {
  const root = document.getElementById("root");
  return root ? root.childElementCount : -1;
}

function bodyTextLen(): number {
  return rbText(document.body).length;
}

function htmlLang(): string {
  return String(document.documentElement.getAttribute("lang") || "");
}

function dataTheme(): string {
  return String(document.documentElement.getAttribute("data-theme") || "");
}

function dataWindow(): string {
  return String(document.documentElement.getAttribute("data-window") || "");
}

function htmlStyleAttr(): string {
  return String(document.documentElement.getAttribute("style") || "");
}

function htmlZoomStyle(): string {
  return String(document.documentElement.style.zoom || "");
}

function statusPresent(): number {
  return rbCount("footer.quiet-status");
}

function statusText(): string {
  return rbStatusText();
}

function statusSavedFlag(): string {
  return rbStatusSavedFlag();
}

function wordCount(): number {
  return rbWordCount();
}

function headerButtonsLen(): number {
  return rbHeaderLabels().length;
}

function headerButtonsJoined(): string {
  return rbJoined(rbHeaderLabels());
}

function viewModeLabel(): string {
  return rbAriaLabelAt(0, "View mode");
}

function viewModeLabelLen(): number {
  return rbAriaLabels("View mode").length;
}

function editorViewModeLabel(): string {
  return rbAriaLabelAt(0, "Editor view mode");
}

function themeToggleLabel(): string {
  return rbAriaLabelAt(0, "Switch to ");
}

function fileTreePresent(): number {
  return rbCount('aside[aria-label="Markdown file tree"]');
}

function outlineListPresent(): number {
  return rbCount('ol[aria-label="Document outline"]');
}

function outlineLen(): number {
  return rbOutlineItems().length;
}

function outlineJoined(): string {
  return rbJoined(rbOutlineItems());
}

function chevronLen(): number {
  return rbChevronLabels().length;
}

function chevronJoined(): string {
  return rbJoined(rbChevronLabels());
}

function outlineCollapseLabel(): string {
  return rbAriaLabelAt(0, "Collapse outline headings").concat(rbAriaLabelAt(0, "Expand outline headings"));
}

function outlineFilterLabel(): string {
  return rbAriaLabelAt(0, "Outline heading levels");
}

function resizerLen(): number {
  return rbCount('[role="separator"][aria-label="Resize editor width"]');
}

function resizerValueNow(): string {
  return rbAttr('[role="separator"][aria-label="Resize editor width"]', "aria-valuenow");
}

function resizerValueMin(): string {
  return rbAttr('[role="separator"][aria-label="Resize editor width"]', "aria-valuemin");
}

function resizerValueMax(): string {
  return rbAttr('[role="separator"][aria-label="Resize editor width"]', "aria-valuemax");
}

function editorSurfaceLen(): number {
  return rbCount('article[data-editor-engine="codemirror"]');
}

function editorFontSize(): string {
  return rbEditorFontSize();
}

function paragraphSpacingVar(): string {
  return rbParagraphSpacingVar();
}

function cmContentLen(): number {
  return rbCount(".cm-content");
}

function cmTextLen(): number {
  return rbText(rbFirst(".cm-content")).length;
}

function cmTextHead(): string {
  return rbText(rbFirst(".cm-content")).slice(0, 120);
}

//
// 为什么不用 cmTextLen：见 rbTextContent 注释，它是 innerText 派生量、随 markup 装饰的活动行状态摆动。
function cmTextContentLen(): number {
  return rbTextContent(rbFirst(".cm-content")).length;
}

function cmLineCount(): number {
  return rbCount(".cm-content .cm-line");
}

function cmLineFirst(): string {
  return rbTextContent(rbFirst(".cm-content .cm-line"));
}

function cmLineTextsJoined(): string {
  return rbAll(".cm-content .cm-line").map((node) => rbTextContent(node)).join("|");
}

function writingSurfaceLen(): number {
  return rbCount('section[aria-label="Writing surface"]');
}

function dialogLen(): number {
  return rbCount('[role="dialog"]');
}

function menuLen(): number {
  return rbCount('[role="menu"]');
}

function menuRadioLen(): number {
  return rbMenuRadioTexts().length;
}

function menuRadioJoined(): string {
  return rbJoined(rbMenuRadioTexts());
}

function menuRadioCheckedJoined(): string {
  return rbJoined(rbMenuRadioCheckedTexts());
}

function settingsNavLen(): number {
  return rbSettingsNavLabels().length;
}

function settingsNavJoined(): string {
  return rbJoined(rbSettingsNavLabels());
}

function selectLen(): number {
  return rbCount("select");
}

function selectValue(label: string): string {
  const select = rbSelectByLabel(label);
  return select ? String(select.value) : "";
}

function selectOptionsJoined(label: string): string {
  return rbJoined(rbSelectOptionList(label));
}

function selectOptionCount(label: string): number {
  return rbSelectOptionList(label).length;
}

function visibilityPresent(): number {
  return rbVisibilityHost() ? 1 : 0;
}

function visibilityText(): string {
  return rbText(rbVisibilityHost());
}

function visibilityLinesJoined(): string {
  return rbJoined(rbLines(rbVisibilityHost()));
}

function visibilityRow(label: string): string {
  return rbVisibilityRow(label);
}

function numberValue(label: string): string {
  const input = rbInputByLabel(label, "number");
  return input ? String(input.value) : "";
}

function textValue(label: string): string {
  const input = rbInputByLabel(label, "text");
  return input ? String(input.value) : "";
}

function radioGroupOptionCount(label: string): number {
  return rbRadioGroupOptionLabels(label).length;
}

function radioGroupOptionsJoined(label: string): string {
  return rbJoined(rbRadioGroupOptionLabels(label));
}

function radioGroupChecked(label: string): string {
  return rbRadioGroupCheckedLabel(label);
}

function switchLen(): number {
  return rbCount('[role="switch"]');
}

function panelHeadingsJoined(): string {
  return rbJoined(rbHeadingTexts().slice(0, 24));
}

function versionText(): string {
  return rbVersionText();
}

function bridgeReady(): boolean {
  return rootChildren() > 0 && bodyTextLen() > 0;
}

function ariaLabelCount(prefix: string): number {
  return rbAriaLabelList(prefix).length;
}

function ariaLabelsJoined(prefix: string): string {
  return rbJoined(rbAriaLabelList(prefix));
}

function ariaExactCount(label: string): number {
  return rbAriaExactNodes(label).length;
}

function ariaExactDescriptorsJoined(label: string): string {
  return rbJoined(rbAriaExactDescriptorList(label));
}

function ariaExactText(label: string): string {
  const nodes = rbAriaExactNodes(label);
  return nodes.length > 0 ? rbText(nodes[0]) : "";
}

function activeElementDescriptor(): string {
  return rbNodeDescriptor(document.activeElement);
}

// ---- setup effectors (act; called from setup steps only) ----

function rbSetNativeSelectValue(select: HTMLSelectElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  if (descriptor && typeof descriptor.set === "function") {
    descriptor.set.call(select, value);
    return;
  }
  select.value = value;
}

function clickAriaPrefix(prefix: string): string {
  const labels = rbAriaLabels(prefix);
  if (labels.length === 0) return `no-match:${prefix}`;
  const target = rbFirst(`[aria-label="${labels[0]}"]`) as HTMLElement | null;
  if (!target) return `no-element:${labels[0]}`;
  target.click();
  return `clicked:${labels[0]}`;
}

function clickAriaExact(label: string): string {
  const nodes = rbAriaExactNodes(label);
  if (nodes.length === 0) return `no-exact-match:${label}`;
  (nodes[0] as HTMLElement).click();
  return `clicked-exact:${label}:${nodes.length}`;
}

function clickAriaPrefixNth(prefix: string, index: number): string {
  const labels = rbAriaLabels(prefix);
  if (index >= labels.length) return `no-match:${prefix}#${index}`;
  const target = rbFirst(`[aria-label="${labels[index]}"]`) as HTMLElement | null;
  if (!target) return `no-element:${labels[index]}`;
  target.click();
  return `clicked:${labels[index]}`;
}

function clickVisibilityRow(label: string): string {
  const host = rbVisibilityHost();
  if (!host) return "no-visibility-host";
  for (const node of Array.from(host.querySelectorAll('[role="switch"],button'))) {
    const named = String(node.getAttribute("aria-label") || "");
    if (named !== label) continue;
    (node as HTMLElement).click();
    return `clicked:${named}`;
  }
  return `no-row:${label}`;
}

function setSelectByLabel(label: string, value: string): string {
  const select = rbSelectByLabel(label);
  if (!select) return `no-select:${label}`;
  rbSetNativeSelectValue(select, value);
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return `set:${label}=${String(select.value)}`;
}

function typeIntoEditor(text: string): string {
  const content = rbFirst(".cm-content") as HTMLElement | null;
  if (!content) return "no-cm-content";
  content.focus();
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(content);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  const inserted = document.execCommand("insertText", false, text);
  return inserted ? "typed" : "insert-text-refused";
}

function readerCount(): number {
  return Object.keys(window.__MK__ || {}).length;
}

export function installRbProbe(): void {
  rbTrapErrors();
  const bridge: RbBridge = {
    errorCount, errorJoined, blockedCount, blockedJoined, fenceInstalled,
    resourceCount, nonLocalResourceCount,
    titleText, rootChildren, bodyTextLen, htmlLang, dataTheme, dataWindow, htmlStyleAttr, htmlZoomStyle,
    statusPresent, statusText, statusSavedFlag, wordCount,
    headerButtonsLen, headerButtonsJoined, viewModeLabel, viewModeLabelLen, editorViewModeLabel, themeToggleLabel,
    fileTreePresent, outlineListPresent, outlineLen, outlineJoined, chevronLen, chevronJoined,
    outlineCollapseLabel, outlineFilterLabel,
    resizerLen, resizerValueNow, resizerValueMin, resizerValueMax,
    editorSurfaceLen, editorFontSize, paragraphSpacingVar, cmContentLen, cmTextLen, cmTextHead,
    cmTextContentLen, cmLineCount, cmLineFirst, cmLineTextsJoined, writingSurfaceLen,
    dialogLen, menuLen, menuRadioLen, menuRadioJoined, menuRadioCheckedJoined,
    settingsNavLen, settingsNavJoined, selectLen, selectValue, selectOptionsJoined, selectOptionCount,
    visibilityPresent, visibilityText, visibilityLinesJoined, visibilityRow,
    numberValue, textValue, radioGroupOptionCount, radioGroupOptionsJoined, radioGroupChecked, switchLen,
    panelHeadingsJoined, versionText, bridgeReady,
    ariaLabelCount, ariaLabelsJoined, ariaExactCount, ariaExactDescriptorsJoined, ariaExactText, activeElementDescriptor,
    clickAriaPrefix, clickAriaExact, clickAriaPrefixNth, clickVisibilityRow, setSelectByLabel, typeIntoEditor, readerCount
  };
  window.__MK__ = bridge;
}

installRbProbe();

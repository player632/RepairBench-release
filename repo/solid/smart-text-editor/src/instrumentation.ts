// RepairBench instrumentation: read-only measurement bridge for the verifier.
// Every member is a getter. There is no setter, no method and no assignment anywhere in this module,
// so the bridge can report state but can never change it: a repair cannot be scored by driving the app
// through this object. It reads the app's own signals and the DOM the app already renders.
import { activeEditor, previewEditor, settings, view, orientation, viewChange, orientationChange, scalingChange, unsavedWork, activeDialog, activeWidget, cardBackdropShown, environment, workspaceTabs, workspaceEditors, workspace, preview as getPreview } from "./app.js";
import Prism from "./prism.js";

function tabs(): HTMLButtonElement[] {
  const bar = workspaceTabs();
  if (bar === null) return [];
  return [...bar.querySelectorAll<HTMLButtonElement>(".tab")];
}
function liveTabs(): HTMLButtonElement[] {
  return tabs().filter(tab => !tab.hasAttribute("data-editor-change"));
}
function tabName(tab: HTMLButtonElement): string {
  const span = tab.querySelector("span");
  return (span ? span.textContent : "") || "";
}
function editorElements(): NumTextElement[] {
  const host = workspaceEditors();
  if (host === null) return [];
  return [...host.querySelectorAll<NumTextElement>("num-text")];
}
function card(id: string): HTMLDivElement | null {
  return document.getElementById(id) as HTMLDivElement | null;
}
function cardValue(id: string): string {
  const element = card(id)?.querySelector<NumTextElement>("num-text");
  return element ? String(element.value ?? "") : "";
}
function previewFrame(): HTMLIFrameElement | null {
  return getPreview() ?? (document.querySelector("iframe.preview") as HTMLIFrameElement | null);
}
function previewDocument(): Document | null {
  const frame = previewFrame();
  if (frame === null) return null;
  try { return frame.contentDocument; } catch { return null; }
}

const bridge = {
  // ---- layout state, read off the app's own accessors and the body it drives
  get view(): string { return view(); },
  get orientation(): string { return orientation(); },
  get viewChange(): number { return viewChange() ? 1 : 0; },
  get orientationChange(): number { return orientationChange() ? 1 : 0; },
  get scalingChange(): number { return scalingChange() ? 1 : 0; },
  get bodyClass(): string { return document.body.className; },
  get bodyViewAttribute(): string { return document.body.getAttribute("data-view") || ""; },
  get bodyOrientationAttribute(): string { return document.body.getAttribute("data-orientation") || ""; },
  get title(): string { return document.title; },
  get appleDevice(): number { return environment.appleDevice ? 1 : 0; },
  get touchDevice(): number { return environment.touchDevice ? 1 : 0; },

  // ---- editors and tabs
  get tabCount(): number { return liveTabs().length; },
  get tabNames(): string { return liveTabs().map(tabName).join("|"); },
  get activeTabName(): string { const t = liveTabs().find(x => x.classList.contains("active")); return t ? tabName(t) : ""; },
  get activeTabIndex(): number { const list = liveTabs(); return list.findIndex(x => x.classList.contains("active")); },
  get unsavedFlags(): string { return liveTabs().map(t => (t.hasAttribute("data-editor-unsaved") ? "1" : "0")).join(""); },
  get refreshFlags(): string { return liveTabs().map(t => (t.hasAttribute("data-editor-refresh") ? "1" : "0")).join(""); },
  get autoCreatedFlags(): string { return liveTabs().map(t => (t.hasAttribute("data-editor-auto-created") ? "1" : "0")).join(""); },
  get renamingFlags(): string { return liveTabs().map(t => (t.querySelector("[data-editor-rename]") ? "1" : "0")).join(""); },
  get editorCount(): number { return editorElements().length; },
  get editorLanguages(): string { return editorElements().map(e => String(e.syntaxLanguage ?? "")).join("|"); },
  get editorHighlights(): string { return editorElements().map(e => { try { return e.syntaxHighlight.active() ? "1" : "0"; } catch { return "e"; } }).join(""); },
  get editorColorSchemes(): string { return editorElements().map(e => { try { return String(e.colorScheme.get()); } catch { return "e"; } }).join("|"); },
  get editorValueLengths(): string { return editorElements().map(e => String(e.value ?? "").length).join("|"); },
  get activeEditorName(): string { const e = activeEditor(); return e ? e.getName() : ""; },
  get activeEditorValue(): string { const e = activeEditor(); return e ? e.getValue() : ""; },
  get activeEditorValueLength(): number { const e = activeEditor(); return e ? e.getValue().length : -1; },
  get activeEditorLanguage(): string { const e = activeEditor(); return e ? e.getSyntaxLanguage() : ""; },
  get activeEditorUnsaved(): number { const e = activeEditor(); return e && e.getUnsaved() ? 1 : 0; },
  get activeEditorRefresh(): number { const e = activeEditor(); return e && e.getRefresh() ? 1 : 0; },
  get activeEditorAutoCreated(): number { const e = activeEditor(); return e && e.getAutoCreated() ? 1 : 0; },
  get activeEditorElementValue(): string { const e = activeEditor(); return e ? String(e.ref.value ?? "") : ""; },
  get activeEditorElementLanguage(): string { const e = activeEditor(); return e ? String(e.ref.syntaxLanguage ?? "") : ""; },
  get activeEditorHighlight(): string { const e = activeEditor(); if (!e) return ""; try { return e.ref.syntaxHighlight.active() ? "1" : "0"; } catch { return "e"; } },
  get unsavedWork(): number { return unsavedWork() ? 1 : 0; },
  get focusedIdentifier(): string { const a = document.activeElement; return a && a.getAttribute ? (a.getAttribute("data-editor-identifier") || "") : ""; },
  get focusedTestId(): string { const a = document.activeElement; return a && a.getAttribute ? (a.getAttribute("data-testid") || "") : ""; },
  get focusedTag(): string { const a = document.activeElement; return a ? a.tagName.toLowerCase() : ""; },

  // ---- preview
  get previewEditorName(): string { const e = previewEditor(); return e ? e.getName() : ""; },
  get previewHasSource(): number { return previewEditor() === null ? 0 : 1; },
  get previewText(): string { const d = previewDocument(); return d && d.body ? d.body.innerText.replace(/\s+/g, " ").trim() : ""; },
  get previewTextLength(): number { const d = previewDocument(); return d && d.body ? d.body.innerText.length : -1; },
  get previewTitle(): string { const d = previewDocument(); return d ? d.title : ""; },
  get previewBaseHref(): string { const d = previewDocument(); const b = d && d.querySelector("base"); return b ? b.getAttribute("href") || "" : ""; },
  get previewSrc(): string { const f = previewFrame(); return f ? (f.getAttribute("src") || "") : ""; },
  get previewWidth(): number { const f = previewFrame(); return f ? Math.round(f.getBoundingClientRect().width) : -1; },
  get previewHeight(): number { const f = previewFrame(); return f ? Math.round(f.getBoundingClientRect().height) : -1; },
  get workspaceWidth(): number { const w = workspace(); return w ? Math.round(w.getBoundingClientRect().width) : -1; },
  get previewMenuSelected(): string { const items = [...document.querySelectorAll("menu-drop li[data-value='active-editor'], menu-drop li[data-editor-identifier]")]; const sel = items.find(li => li.hasAttribute("data-selected")); return sel ? ((sel.textContent || "").trim()) : ""; },

  // ---- cards / dialogs / widgets
  get cardStates(): string { return [...document.querySelectorAll<HTMLElement>(".Card")].map(c => c.id + "=" + (c.hasAttribute("data-active") ? "1" : "0") + (c.classList.contains("minimize") ? "m" : "")).join("|"); },
  get activeCard(): string { const c = document.querySelector<HTMLElement>(".Card[data-active]"); return c ? c.id : ""; },
  get activeCards(): string { return [...document.querySelectorAll<HTMLElement>(".Card[data-active]")].map(c => c.id).join("|"); },
  get activeDialog(): string { return activeDialog() || ""; },
  get activeWidget(): string { return activeWidget() || ""; },
  get backdropShown(): number { return cardBackdropShown() ? 1 : 0; },
  get backdropActive(): number { const b = document.querySelector(".card-backdrop"); return b && b.classList.contains("active") ? 1 : 0; },
  get jsonValue(): string { return cardValue("json_formatter_card"); },
  get jsonNewlines(): number { return (cardValue("json_formatter_card").match(/\n/g) || []).length; },
  get encoderValue(): string { return cardValue("uri_encoder_card"); },
  get encoderComponentChecked(): number { const i = document.getElementById("encoder_type") as HTMLInputElement | null; return i && i.checked ? 1 : 0; },
  get uuidValue(): string { const i = card("uuid_generator_card")?.querySelector("input[type='text']") as HTMLInputElement | null; return i ? i.value : ""; },
  get uuidReadonly(): number { const i = card("uuid_generator_card")?.querySelector("input[type='text']") as HTMLInputElement | null; return i && i.readOnly ? 1 : 0; },
  get replaceValues(): string { const list = [...(card("replace_text_card")?.querySelectorAll<NumTextElement>("num-text") || [])]; return list.map(e => String(e.value ?? "")).join("|"); },
  get settingsOrientationSelected(): string { const m = document.getElementById("default_orientation_setting"); const b = m && m.querySelector("button"); return b ? (b.textContent || "").replace(/\s+/g, " ").trim() : ""; },
  get settingsHighlightChecked(): number { const i = document.getElementById("syntax_highlighting_setting") as HTMLInputElement | null; return i && i.checked ? 1 : 0; },
  get settingsAutoRefreshChecked(): number { const i = document.getElementById("automatic_refresh_setting") as HTMLInputElement | null; return i && i.checked ? 1 : 0; },
  get minimizeTabWidth(): string { const bar = workspaceTabs(); return bar ? bar.style.getPropertyValue("--minimize-tab-width") : ""; },
  get scalingOffset(): string { const w = workspace(); return w ? w.style.getPropertyValue("--scaling-offset") : ""; },
  get scalingActive(): number { return document.body.hasAttribute("data-scaling-active") ? 1 : 0; },

  // ---- settings, storage and residue (state-isolation assertions read these)
  get settingsSnapshot(): string { return [settings.defaultOrientation, settings.syntaxHighlighting, settings.automaticRefresh, settings.previewBase].map(v => (v === null ? "null" : String(v))).join("|"); },
  get storageKeys(): string { try { return Object.keys(localStorage).sort().join("|"); } catch { return "err"; } },
  get sessionKeys(): string { try { return Object.keys(sessionStorage).sort().join("|"); } catch { return "err"; } },
  get urlSearch(): string { return window.location.search; },
  get urlHash(): string { return window.location.hash; },
  get bridgeGlobals(): string { return Object.getOwnPropertyNames(window).filter(k => k.startsWith("__rb")).sort().join("|"); },

  // ---- syntax highlighting engine
  get prismLoaded(): number { return typeof Prism === "object" && Prism !== null ? 1 : 0; },
  get prismLanguageCount(): number { try { return Object.keys(Prism.languages).filter(k => typeof (Prism.languages as Record<string, unknown>)[k] === "object").length; } catch { return -1; } },
  get prismLanguages(): string { try { return Object.keys(Prism.languages).filter(k => typeof (Prism.languages as Record<string, unknown>)[k] === "object").sort().join("|"); } catch { return "err"; } },
  get outboundAnchors(): number { return document.querySelectorAll('a[href^="http"]').length; },
  get offlineStubAnchors(): number { return document.querySelectorAll('a[href*="offline/out.html"]').length; },
  get startupFade(): number { return document.documentElement.classList.contains("startup-fade") ? 1 : 0; },
  get customElementsDefined(): string { return ["num-text", "menu-drop"].map(t => (customElements.get(t) ? "1" : "0")).join(""); }
};

Object.defineProperty(window, "__rb_stedit", { value: Object.freeze(bridge), writable: false, configurable: false, enumerable: true });

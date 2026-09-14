/**
 * KeyboardLabDemo — workspace layout for the keyboard design editor.
 *
 * Layout: toolbar (compact) | 3D viewport (left) + sidebar (right)
 * Sidebar: asset selectors, 2D layout, controls, tabbed JSON editors.
 * 3D viewport legends use world-space 3D Text — stable on resize.
 * Drag handle between viewport and sidebar for resizing.
 */

import React, { useRef, useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import KeyboardLab from "./KeyboardLab";
import KeyboardLayout2D from "./KeyboardLayout2D";
import CaseProfileEditor, { PROFILE_PRESETS } from "./CaseEditor/CaseProfileEditor";
import { bundledResolver, listBundledByType, registerBundled } from "./schema/resolve/assetResolver";
import { designFromSelections } from "./schema/normalize/resolveDesign";
import { buildCodeMap, extractKeys, parseLegendPosition, LEGEND_INSET_DEFAULTS, LEGEND_INSET_RANGE } from "./schema/derive";
import { saveDesign, loadDesign, listDesigns, deleteDesign, exportDesignJSON, importDesignJSON } from "./services/designStorage";
import { importKleLayout } from "./services/kleImporter";
import { getKeycapPreset } from "./presets/keycaps";
import { getLegendPreset } from "./presets/legends";
import { RENDER_STYLE_PRESETS } from "./presets/renderStyles";
import { RENDER_MODES, IMPLEMENTED_MODES } from "./schema/types/renderStyle";
import { useLabTranslation } from "./i18n/useLabTranslation";
import useSound from "use-sound";
import { SOUND_MAP } from "../sound/sound";
const MonacoEditor = lazy(() => import("@monaco-editor/react"));

const KEYCAP_REFS = listBundledByType("keycap");
const LEGEND_REFS = listBundledByType("legend");
const SHELL_REFS = listBundledByType("shell");
const CASE_PROFILE_REFS = listBundledByType("caseProfile");
const RENDER_STYLE_REFS = listBundledByType("renderStyle");

const KEYCAP_ID_TO_REF = {
  "cherry-profile": "keycap/cherry-classic@1", "oem-profile": "keycap/oem-classic@1",
  "sa-profile": "keycap/sa-classic@1", "mt3-profile": "keycap/mt3-sculpted@1",
  "kat-profile": "keycap/kat-sculpted@1",
  "dsa-profile": "keycap/dsa-uniform@1", "xda-profile": "keycap/xda-uniform@1",
  "low-profile": "keycap/low-profile@1",
};
const LEGEND_ID_TO_REF = {
  "gmk-classic": "legend/gmk-center@1", "minimalist": "legend/minimalist@1",
  "retro": "legend/retro@1", "top-print": "legend/top-print@1",
  "cyber": "legend/cyber@1", "blank": "legend/blank@1",
};

const DEFAULT_OPACITY = { keycap: 1.0, accent: 1.0, case: 1.0, legend: 1.0 };

const COLOR_PRESETS = {
  "le smoking": { keycapColor: "#070505", accentKeyColor: "#010305", caseColor: "#7d5db6", opacity: { keycap: 0.95, accent: 1, case: 1.0, legend: 0.75 } },
  midnight:    { keycapColor: "#2a2a2e", accentKeyColor: "#3d3d42", caseColor: "#1a1a1e", opacity: { ...DEFAULT_OPACITY } },
  ocean:       { keycapColor: "#1e3a5f", accentKeyColor: "#2d6a9f", caseColor: "#0d1b2a", opacity: { ...DEFAULT_OPACITY } },
  sakura:      { keycapColor: "#f5e6e0", accentKeyColor: "#d4918b", caseColor: "#3d2b2b", opacity: { ...DEFAULT_OPACITY } },
  forest:      { keycapColor: "#2d4a2d", accentKeyColor: "#5a8a3c", caseColor: "#1a2e1a", opacity: { ...DEFAULT_OPACITY } },
  arctic:      { keycapColor: "#e8edf2", accentKeyColor: "#94b3d4", caseColor: "#c0c8d0", opacity: { ...DEFAULT_OPACITY } },
  translucent: { keycapColor: "#8899aa", accentKeyColor: "#aabbcc", caseColor: "#1a1a1e", opacity: { keycap: 0.55, accent: 0.55, case: 1.0, legend: 1.0 } },
  pudding:     { keycapColor: "#f0e8d8", accentKeyColor: "#1a1a1e", caseColor: "#1a1a1e", opacity: { keycap: 0.75, accent: 0.75, case: 1.0, legend: 1.0 } },
  jelly:       { keycapColor: "#6a4c93", accentKeyColor: "#c75d9b", caseColor: "#0d0d12", opacity: { keycap: 0.45, accent: 0.45, case: 0.85, legend: 0.9 } },
  frosted:     { keycapColor: "#d0dce8", accentKeyColor: "#7eb0d5", caseColor: "#2a2a30", opacity: { keycap: 0.65, accent: 0.65, case: 1.0, legend: 1.0 } },
};

const DEFAULTS = {
  layoutRef: "layout/cyberboard-75-ansi@1",
  keycapRef: "keycap/cherry-classic@1",
  legendRef: "legend/gmk-center@1",
  shellRef: "shell/standard@1",
  caseProfileRef: "caseProfile/cyberboard-wedge@1",
  renderStyleRef: "renderStyle/default@1",
  colorPreset: "le smoking",
  mountOffset: { x: 0.1, y: 0, z: 0.7 },
  mountFit: 0.85,
  caseScale: 1.15,
  extrudeWidth: 0.9,
};

const KeyboardLabDemo = ({ theme, soundMode = false, soundType = "keyboard" }) => {
  const tLab = useLabTranslation();
  const [play] = useSound(SOUND_MAP[soundType] || SOUND_MAP["keyboard"], { volume: 0.5 });
  const keyboardRef = useRef();

  const [layoutRefs, setLayoutRefs] = useState(() => listBundledByType("layout"));
  const [layoutRef, setLayoutRef] = useState("layout/cyberboard-75-ansi@1");
  const [keycapRef, setKeycapRef] = useState("keycap/cherry-classic@1");
  const [legendRef, setLegendRef] = useState("legend/gmk-center@1");
  const [shellRef, setShellRef] = useState("shell/standard@1");
  const [colorPreset, setColorPreset] = useState("le smoking");
  const [colors, setColors] = useState(COLOR_PRESETS["le smoking"]);
  const [opacity, setOpacity] = useState({ ...COLOR_PRESETS["le smoking"].opacity });
  const [legendOverrides, setLegendOverrides] = useState({ color: "#06ea69" });
  const [liveTyping, setLiveTyping] = useState(true);
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [designId] = useState(() => "design-" + Date.now().toString(36));
  const [designName, setDesignName] = useState("Untitled Design");
  const [savedDesigns, setSavedDesigns] = useState(() => listDesigns());
  const [saveMsg, setSaveMsg] = useState("");
  const [splitPercent, setSplitPercent] = useState(65);
  const [showRoadmap, setShowRoadmap] = useState(false);
  // Per-card UI state: which tab is active inside each card, and which cards are collapsed.
  const [cardTabs, setCardTabs] = useState({
    Design: "config", Layout: "config", Shell: "config",
    Keycap: "config", Legend: "config", CaseProfile: "config",
    Style: "config", Viewer: "config",
  });
  const [collapsed, setCollapsed] = useState({});
  const setCardTab = useCallback((card, tab) => setCardTabs(s => ({ ...s, [card]: tab })), []);
  const toggleCollapse = useCallback((card) => setCollapsed(s => ({ ...s, [card]: !s[card] })), []);
  const [showKleModal, setShowKleModal] = useState(false);
  const [kleInput, setKleInput] = useState("");
  const [kleError, setKleError] = useState("");
  const [kleDragOver, setKleDragOver] = useState(false);
  const [caseProfileRef, setCaseProfileRef] = useState("caseProfile/cyberboard-wedge@1");
  const [caseProfile, setCaseProfile] = useState(PROFILE_PRESETS.wedge);
  const [caseScale, setCaseScale] = useState(1.15);
  const [mountOffset, setMountOffset] = useState({ x: 0.1, y: 0, z: 0.7 });
  const [mountFit, setMountFit] = useState(0.85);
  const [extrudeWidth, setExtrudeWidth] = useState(0.9);
  // Render style follows the same flat ref + override pattern as every other
  // asset: refs.renderStyle points at an asset in the bundled registry,
  // overrides.renderStyle patches resolved fields. Scope-specific refs
  // (renderStyleCase) are independent sibling keys at the same flat level —
  // null means "inherit the global ref" at resolve time.
  const [renderStyleRef, setRenderStyleRef] = useState("renderStyle/default@1");
  const [renderStyleOverrides, setRenderStyleOverrides] = useState({});
  const [resolvedRenderStyle, setResolvedRenderStyle] = useState(null);
  const [renderStyleKeycapRef, setRenderStyleKeycapRef] = useState(null); // null = inherit global
  const [renderStyleKeycapOverrides, setRenderStyleKeycapOverrides] = useState({});
  const [resolvedRenderStyleKeycap, setResolvedRenderStyleKeycap] = useState(null);
  const [renderStyleCaseRef, setRenderStyleCaseRef] = useState(null); // null = inherit global
  const [renderStyleCaseOverrides, setRenderStyleCaseOverrides] = useState({});
  const [resolvedRenderStyleCase, setResolvedRenderStyleCase] = useState(null);
  const [styleScope, setStyleScope] = useState("global"); // UI-only — active sub-tab
  const [styleAdvancedOpen, setStyleAdvancedOpen] = useState(false); // show raw mode override

  // Viewer configurator — observer-side only, never persisted in the design
  // doc. Affects how the user perceives the scene (background, light level);
  // does NOT ship with a keyboard.
  // Studio backdrop by default — soft lavender center fading to near-black
  // edges. Flatters the "le smoking" purple case and gives the keyboard a
  // gallery-piece spotlight feel.
  const [viewerBgType, setViewerBgType] = useState("studio");
  const [viewerBg, setViewerBg] = useState("#c0acdc");       // lavender center
  const [viewerBg2, setViewerBg2] = useState("#07050a");     // near-black edges
  const [viewerAmbient, setViewerAmbient] = useState(0.4);
  const [viewerKey, setViewerKey] = useState(1.0);
  // Subtle atmosphere — light fog so the lavender doesn't get muddied, and
  // a soft ground shadow for grounding.
  const [viewerFov, setViewerFov] = useState(38);
  const [viewerFog, setViewerFog] = useState(0.005);
  const [viewerShadow, setViewerShadow] = useState(0.5);
  // Background variant options
  const [viewerGrid3D, setViewerGrid3D] = useState(false); // when bg type is "grid": render a 3D grid inside the scene instead of a flat CSS one
  const [viewerStarCount, setViewerStarCount] = useState(6); // density of stars bg
  const isDragging = useRef(false);

  // Resolve assets
  const [layout, setLayout] = useState(null);
  const [shell, setShell] = useState(null);
  const [resolvedKeycap, setResolvedKeycap] = useState(null);
  const [resolvedLegend, setResolvedLegend] = useState(null);

  useEffect(() => { bundledResolver(layoutRef).then(setLayout).catch(() => {}); }, [layoutRef]);
  useEffect(() => { bundledResolver(shellRef).then(setShell).catch(() => {}); }, [shellRef]);
  useEffect(() => { bundledResolver(keycapRef).then(setResolvedKeycap).catch(() => {}); }, [keycapRef]);
  useEffect(() => { bundledResolver(legendRef).then(setResolvedLegend).catch(() => {}); }, [legendRef]);

  // Resolve renderStyle ref + merge overrides. Fields in renderStyleOverrides
  // patch the corresponding sub-sections (cel / flat / risograph / …) on the
  // resolved asset; `mode` at override root replaces the asset's mode.
  const resolveRenderStyleEffect = (ref, overrides, setter) => {
    bundledResolver(ref).then((asset) => {
      const merged = { ...asset };
      for (const section of ["cel", "flat", "risograph", "blueprint", "pixel", "painterly", "xray"]) {
        if (overrides[section]) {
          merged[section] = { ...(asset[section] || {}), ...overrides[section] };
        }
      }
      if (overrides.mode) merged.mode = overrides.mode;
      setter(merged);
    }).catch(() => setter(null));
  };
  useEffect(() => {
    resolveRenderStyleEffect(renderStyleRef, renderStyleOverrides, setResolvedRenderStyle);
  }, [renderStyleRef, renderStyleOverrides]);
  // Scope-specific resolvers: only run when a scoped ref is actually set.
  // When unset we pass null and KeyboardModel / this component fall back to
  // the global style.
  useEffect(() => {
    if (!renderStyleKeycapRef) { setResolvedRenderStyleKeycap(null); return; }
    resolveRenderStyleEffect(renderStyleKeycapRef, renderStyleKeycapOverrides, setResolvedRenderStyleKeycap);
  }, [renderStyleKeycapRef, renderStyleKeycapOverrides]);
  useEffect(() => {
    if (!renderStyleCaseRef) { setResolvedRenderStyleCase(null); return; }
    resolveRenderStyleEffect(renderStyleCaseRef, renderStyleCaseOverrides, setResolvedRenderStyleCase);
  }, [renderStyleCaseRef, renderStyleCaseOverrides]);
  // The effective keycap style: prefer the scoped override, else inherit from
  // the global renderStyle ref.
  const effectiveKeycapRenderStyle = resolvedRenderStyleKeycap || resolvedRenderStyle;
  useEffect(() => {
    bundledResolver(caseProfileRef).then((p) => {
      if (p.caseProfile) setCaseProfile(p.caseProfile);
      if (p.mount) {
        if (p.mount.offset) setMountOffset(p.mount.offset);
        if (p.mount.fit != null) setMountFit(p.mount.fit);
        if (p.mount.caseScale != null) setCaseScale(p.mount.caseScale);
        if (p.mount.extrudeWidth != null) setExtrudeWidth(p.mount.extrudeWidth);
      }
    }).catch(() => {});
  }, [caseProfileRef]);

  const legendPresetId = Object.entries(LEGEND_ID_TO_REF).find(([, r]) => r === legendRef)?.[0] || "gmk-classic";
  // Use resolved keycap (supports hot-swap from JSON editor)
  const keycapPreset = resolvedKeycap;
  const legendPreset = useMemo(() => {
    const base = getLegendPreset(legendPresetId);
    return Object.keys(legendOverrides).length === 0 ? base : { ...base, style: { ...base.style, ...legendOverrides } };
  }, [legendPresetId, legendOverrides]);
  const codeMap = useMemo(() => layout ? buildCodeMap(extractKeys(layout)) : new Map(), [layout]);

  // Live typing
  useEffect(() => {
    if (!liveTyping) return;
    const down = (e) => { const k = codeMap.get(e.code); if (k) { keyboardRef.current?.triggerKey(k); setActiveKeys(p => new Set(p).add(k)); if (soundMode) play(); } };
    const up = (e) => { const k = codeMap.get(e.code); if (k) setActiveKeys(p => { const n = new Set(p); n.delete(k); return n; }); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [liveTyping, codeMap, soundMode, play]);

  // Stable design document — only regenerates when design inputs change
  const currentDesign = useMemo(() => {
    const d = designFromSelections({
      name: designName, layoutRef, keycapRef, legendRef, shellRef, caseProfileRef,
      renderStyleRef, renderStyleKeycapRef, renderStyleCaseRef,
      colorOverrides: colors, opacityOverrides: opacity, legendOverrides,
      renderStyleOverrides, renderStyleKeycapOverrides, renderStyleCaseOverrides,
    });
    d.id = designId;
    delete d.meta.createdAt;
    return d;
  }, [designId, designName, layoutRef, keycapRef, legendRef, shellRef, caseProfileRef, renderStyleRef, renderStyleKeycapRef, renderStyleCaseRef, colors, opacity, legendOverrides, renderStyleOverrides, renderStyleKeycapOverrides, renderStyleCaseOverrides]);

  const [loadedDesignId, setLoadedDesignId] = useState("");
  const [savedMenuOpen, setSavedMenuOpen] = useState(false);
  const savedMenuRef = useRef(null);

  // Close saved menu on outside click
  useEffect(() => {
    if (!savedMenuOpen) return;
    const handler = (e) => {
      if (savedMenuRef.current && !savedMenuRef.current.contains(e.target)) setSavedMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [savedMenuOpen]);

  // ─── Design actions ───

  // Apply a design bundle (eletypes-design-bundle/1)
  const applyBundle = useCallback((bundle) => {
    const d = bundle.design || bundle;
    const refs = d.refs || d.assets || {};
    const ea = bundle.embeddedAssets || bundle.assets || {};

    setDesignName(d.meta?.name || "Untitled");
    setLayoutRef(refs.layout || DEFAULTS.layoutRef);
    setKeycapRef(refs.keycap || DEFAULTS.keycapRef);
    setLegendRef(refs.legend || DEFAULTS.legendRef);
    setShellRef(refs.shell || DEFAULTS.shellRef);
    setCaseProfileRef(refs.caseProfile || refs.profile || DEFAULTS.caseProfileRef);
    setRenderStyleRef(refs.renderStyle || "renderStyle/default@1");
    setRenderStyleOverrides(d.overrides?.renderStyle || {});
    setRenderStyleKeycapRef(refs.renderStyleKeycap || null);
    setRenderStyleKeycapOverrides(d.overrides?.renderStyleKeycap || {});
    setRenderStyleCaseRef(refs.renderStyleCase || null);
    setRenderStyleCaseOverrides(d.overrides?.renderStyleCase || {});

    // Visual + opacity (opacity is sibling of visual in new format, nested in old)
    setColors(d.overrides?.visual || COLOR_PRESETS.midnight);
    setOpacity({ ...DEFAULT_OPACITY, ...d.overrides?.opacity, ...d.overrides?.visual?.opacity });
    setLegendOverrides(d.overrides?.legend || {});
    setColorPreset("");

    // Restore embedded assets if present
    if (ea.layout) setLayout(ea.layout);
    if (ea.keycap) setResolvedKeycap(ea.keycap);
    if (ea.legend) setResolvedLegend(ea.legend);
    if (ea.shell) setShell(ea.shell);

    // Restore case profile from embedded assets or legacy locations
    const cpAsset = ea.caseProfile || bundle.profile;
    if (cpAsset?.caseProfile) setCaseProfile(cpAsset.caseProfile);
    else if (d.overrides?.caseProfile) setCaseProfile(d.overrides.caseProfile);

    const mt = cpAsset?.mount || bundle.profile?.mount || d.overrides?.mount || {};
    if (mt.offset) setMountOffset(mt.offset);
    if (mt.fit != null) setMountFit(mt.fit);
    if (mt.caseScale != null) setCaseScale(mt.caseScale);
    if (mt.extrudeWidth != null) setExtrudeWidth(mt.extrudeWidth);
  }, []);

  const handleNew = useCallback(() => {
    setDesignName(tLab("lab_untitled"));
    setLayoutRef(DEFAULTS.layoutRef);
    setKeycapRef(DEFAULTS.keycapRef);
    setLegendRef(DEFAULTS.legendRef);
    setShellRef(DEFAULTS.shellRef);
    setCaseProfileRef(DEFAULTS.caseProfileRef);
    setColorPreset(DEFAULTS.colorPreset);
    setColors(COLOR_PRESETS[DEFAULTS.colorPreset]);
    setOpacity({ ...COLOR_PRESETS[DEFAULTS.colorPreset].opacity });
    setLegendOverrides({ color: "#06ea69" });
    setMountOffset(DEFAULTS.mountOffset);
    setMountFit(DEFAULTS.mountFit);
    setCaseScale(DEFAULTS.caseScale);
    setExtrudeWidth(DEFAULTS.extrudeWidth);
    setLoadedDesignId("");
    // Force re-resolve all assets even if refs match current values
    bundledResolver(DEFAULTS.layoutRef).then(setLayout).catch(() => {});
    bundledResolver(DEFAULTS.keycapRef).then(setResolvedKeycap).catch(() => {});
    bundledResolver(DEFAULTS.legendRef).then(setResolvedLegend).catch(() => {});
    bundledResolver(DEFAULTS.shellRef).then(setShell).catch(() => {});
    bundledResolver(DEFAULTS.caseProfileRef).then((p) => {
      if (p.caseProfile) setCaseProfile(p.caseProfile);
      if (p.mount) {
        if (p.mount.offset) setMountOffset(p.mount.offset);
        if (p.mount.fit != null) setMountFit(p.mount.fit);
        if (p.mount.caseScale != null) setCaseScale(p.mount.caseScale);
        if (p.mount.extrudeWidth != null) setExtrudeWidth(p.mount.extrudeWidth);
      }
    }).catch(() => {});
  }, [tLab]);

  // Build an eletypes-design-bundle/1 from current state
  const buildBundle = useCallback(() => ({
    schema: "eletypes-design-bundle/1",
    savedAt: new Date().toISOString(),
    design: currentDesign,
    embeddedAssets: {
      layout: layout || null,
      keycap: resolvedKeycap || null,
      legend: legendPreset || null,
      shell: shell || null,
      caseProfile: {
        schema: "eletypes-caseProfile/1",
        id: caseProfileRef.split("/").pop()?.split("@")[0] || "custom",
        caseProfile,
        mount: { offset: mountOffset, fit: mountFit, caseScale, extrudeWidth },
      },
    },
  }), [currentDesign, layout, resolvedKeycap, legendPreset, shell, caseProfileRef, caseProfile, mountOffset, mountFit, caseScale, extrudeWidth]);

  const handleSave = useCallback(() => {
    saveDesign(buildBundle());
    setSavedDesigns(listDesigns());
    setSaveMsg(tLab("lab_saved_msg"));
    setTimeout(() => setSaveMsg(""), 2000);
  }, [buildBundle]);

  const handleLoad = useCallback((id) => {
    const bundle = loadDesign(id); if (!bundle) return;
    applyBundle(bundle);
  }, [applyBundle]);

  const handleReload = useCallback(() => {
    if (!loadedDesignId) return;
    const bundle = loadDesign(loadedDesignId);
    if (bundle) applyBundle(bundle);
  }, [loadedDesignId, applyBundle]);

  const handleDeleteSingle = useCallback((id) => {
    deleteDesign(id);
    setSavedDesigns(listDesigns());
    if (loadedDesignId === id) setLoadedDesignId("");
  }, [loadedDesignId]);

  const handleClearAll = useCallback(() => {
    savedDesigns.forEach(d => deleteDesign(d.id));
    setSavedDesigns([]);
    setLoadedDesignId("");
  }, [savedDesigns]);

  const handleExport = useCallback(() => {
    const blob = new Blob([exportDesignJSON(buildBundle())], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `${designName.replace(/\s+/g, "-")}.json`; a.click(); URL.revokeObjectURL(url);
  }, [buildBundle, designName]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader();
      r.onload = (ev) => { try {
        const bundle = importDesignJSON(ev.target.result);
        applyBundle(bundle);
      } catch (err) { alert("Import failed: " + err.message); } }; r.readAsText(f); }; input.click();
  }, [applyBundle]);

  const handleKleFileDrop = useCallback((e) => {
    e.preventDefault();
    setKleDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setKleInput(String(ev.target.result || "")); setKleError(""); };
    reader.onerror = () => setKleError(tLab("lab_import_kle_read_failed"));
    reader.readAsText(file);
  }, [tLab]);

  const handleKleConvert = useCallback(() => {
    const trimmed = (kleInput || "").trim();
    if (!trimmed) { setKleError(tLab("lab_import_kle_empty")); return; }
    let preset;
    try {
      preset = importKleLayout(trimmed);
    } catch (err) {
      setKleError(err.message || String(err));
      return;
    }

    // Generate a unique ref + name so repeated imports don't collide.
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 6);
    const ref = `layout/kle-${stamp}-${rand}@1`;
    const baseName = preset.meta?.name || "KLE Import";
    const humanTs = new Date().toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    const uniqueName = `${baseName} (${humanTs})`;
    preset.meta = { ...(preset.meta || {}), name: uniqueName };

    // Sync the full schema state engine: registry → refs list → active ref → resolved layout.
    registerBundled(ref, preset);
    setLayoutRefs(listBundledByType("layout"));
    setLayoutRef(ref);
    setLayout(preset);
    setDesignName(uniqueName);

    setShowKleModal(false);
    setKleInput("");
    setKleError("");
  }, [kleInput, tLab]);

  const triggerDemo = useCallback(() => { ["KeyH","KeyE","KeyL","KeyL","KeyO"].forEach((k,i) => setTimeout(() => keyboardRef.current?.triggerKey(k), i*120)); }, []);
  const applyColorPreset = (name) => { setColorPreset(name); setColors(COLOR_PRESETS[name]); setOpacity({ ...DEFAULT_OPACITY, ...COLOR_PRESETS[name].opacity }); };

  // Drag handle
  const handleMouseDown = useCallback((e) => {
    e.preventDefault(); isDragging.current = true; const startX = e.clientX; const startPct = splitPercent;
    const container = e.currentTarget.parentElement;
    const onMove = (e) => { if (!isDragging.current) return;
      const rect = container.getBoundingClientRect(); const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(25, Math.min(65, pct))); };
    const onUp = () => { isDragging.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [splitPercent]);

  // Per-card JSON strings — each card's JSON editor binds to one of these.
  const designJson = useMemo(() => JSON.stringify(currentDesign, null, 2), [currentDesign]);
  const layoutJson = useMemo(() => layout ? JSON.stringify(layout, null, 2) : "{}", [layout]);
  const shellJson = useMemo(() => shell ? JSON.stringify(shell, null, 2) : "{}", [shell]);
  const keycapJson = useMemo(() => resolvedKeycap ? JSON.stringify(resolvedKeycap, null, 2) : "{}", [resolvedKeycap]);
  const legendJson = useMemo(() => legendPreset ? JSON.stringify(legendPreset, null, 2) : "{}", [legendPreset]);
  const caseProfileJson = useMemo(() =>
    JSON.stringify({ caseProfile, mount: { offset: mountOffset, fit: mountFit, caseScale, extrudeWidth } }, null, 2),
  [caseProfile, mountOffset, mountFit, caseScale, extrudeWidth]);
  const renderStyleJson = useMemo(() => resolvedRenderStyle ? JSON.stringify(resolvedRenderStyle, null, 2) : "{}", [resolvedRenderStyle]);

  const handleJsonChange = useCallback((value, tabType) => {
    try {
      const parsed = JSON.parse(value);
      if (tabType === "Design") {
        if (parsed.meta?.name) setDesignName(parsed.meta.name);
        const refs = parsed.refs || parsed.assets;
        if (refs?.layout) setLayoutRef(refs.layout);
        if (refs?.keycap) setKeycapRef(refs.keycap);
        if (refs?.legend) { setLegendRef(refs.legend); setLegendOverrides({}); }
        if (refs?.shell) setShellRef(refs.shell);
        if (refs?.caseProfile) setCaseProfileRef(refs.caseProfile);
        if (refs?.renderStyle) setRenderStyleRef(refs.renderStyle);
        if ("renderStyleKeycap" in (refs || {})) setRenderStyleKeycapRef(refs.renderStyleKeycap || null);
        if ("renderStyleCase" in (refs || {})) setRenderStyleCaseRef(refs.renderStyleCase || null);
        if (parsed.overrides?.visual) setColors(parsed.overrides.visual);
        if (parsed.overrides?.opacity) setOpacity(o => ({ ...o, ...parsed.overrides.opacity }));
        if (parsed.overrides?.legend) setLegendOverrides(parsed.overrides.legend);
        if (parsed.overrides?.renderStyle) setRenderStyleOverrides(parsed.overrides.renderStyle);
        if (parsed.overrides?.renderStyleKeycap) setRenderStyleKeycapOverrides(parsed.overrides.renderStyleKeycap);
        if (parsed.overrides?.renderStyleCase) setRenderStyleCaseOverrides(parsed.overrides.renderStyleCase);
      } else if (tabType === "Layout") {
        if (parsed.layout?.keys) setLayout({ ...parsed });
        else if (Array.isArray(parsed.keys)) setLayout(prev => ({ ...prev, layout: { keys: parsed.keys } }));
      } else if (tabType === "Keycap") {
        if (parsed.profile) setResolvedKeycap(parsed);
      } else if (tabType === "Legend") {
        if (parsed.style) setLegendOverrides(parsed.style);
      } else if (tabType === "Shell") {
        if (parsed.case) setShell(parsed);
      } else if (tabType === "Case Profile") {
        if (parsed.caseProfile) setCaseProfile(parsed.caseProfile);
        if (parsed.mount) {
          if (parsed.mount.offset) setMountOffset(parsed.mount.offset);
          if (parsed.mount.fit != null) setMountFit(parsed.mount.fit);
          if (parsed.mount.caseScale != null) setCaseScale(parsed.mount.caseScale);
          if (parsed.mount.extrudeWidth != null) setExtrudeWidth(parsed.mount.extrudeWidth);
        }
      } else if (tabType === "Style") {
        // The Style JSON tab shows the RESOLVED asset. On edit we store the
        // whole parsed body as the override so user tweaks survive subsequent
        // ref changes until they explicitly pick another preset.
        if (parsed && typeof parsed === "object") {
          const { schema, id, meta, ...rest } = parsed;
          setRenderStyleOverrides(rest);
        }
      }
    } catch { /* invalid JSON, ignore until valid */ }
  }, []);

  // Styling
  const bg = theme?.background || "#111115";
  const text = theme?.text || "#e0e0e0";
  const accent = theme?.stats || "#6ec6ff";
  const sel = { background: bg, color: text, border: `1px solid ${text}33`, borderRadius: "4px", padding: "3px 6px", fontSize: "13px" };
  const btn = (active) => ({ background: "transparent", border: `1px solid ${active ? accent : accent+"44"}`, borderRadius: "4px", color: active ? accent : text, padding: "4px 10px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" });
  const lbl = { display: "flex", alignItems: "center", gap: "6px", color: text, fontSize: "13px" };
  const sectionTitle = { fontSize: "13px", color: accent, opacity: 0.7, textTransform: "uppercase", letterSpacing: "1.2px", padding: "6px 8px 3px", fontWeight: 600 };
  // Bento card styles — flat, subtle, eletypes accent
  const cardStyle = { display: "flex", flexDirection: "column", border: `1px solid ${text}18`, borderRadius: "10px", background: `${text}04`, marginBottom: "14px", overflow: "hidden" };
  const cardHeaderStyle = { display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderBottom: `1px solid ${text}0d` };
  const cardTitleStyle = { color: accent, fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px" };
  const cardTabsStyle = { display: "flex", gap: "0", flex: 1, marginLeft: "12px" };
  const tabBtnStyle = (active) => ({ background: "transparent", border: "none", borderBottom: active ? `2px solid ${accent}` : "2px solid transparent", color: active ? accent : `${text}77`, padding: "4px 12px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" });
  const cardBodyStyle = { padding: "14px 16px" };
  const fieldRowStyle = { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" };
  const fieldLabel = { fontSize: "11px", color: `${text}88`, textTransform: "uppercase", letterSpacing: "1px", minWidth: "68px" };
  const numInput = { background: bg, color: text, border: `1px solid ${text}33`, borderRadius: "4px", padding: "3px 6px", fontSize: "13px", fontFamily: "monospace", width: "64px" };

  const renderCardHeader = (id, title, tabs) => (
    <div style={cardHeaderStyle}>
      <span style={cardTitleStyle}>{title}</span>
      <div style={cardTabsStyle}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setCardTab(id, t.key); if (collapsed[id]) toggleCollapse(id); }}
            style={tabBtnStyle(cardTabs[id] === t.key && !collapsed[id])}>
            {t.label}
          </button>
        ))}
      </div>
      <button onClick={() => toggleCollapse(id)}
        title={collapsed[id] ? tLab("lab_expand") : tLab("lab_collapse")}
        style={{ background: "transparent", border: "none", color: `${text}66`, cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "0 6px" }}>
        {collapsed[id] ? "+" : "−"}
      </button>
    </div>
  );

  const renderJsonPane = (value, tabType, height = "220px") => (
    <div style={{ height, borderRadius: "4px", overflow: "hidden", border: `1px solid ${text}10` }}>
      <Suspense fallback={<div style={{ padding: "8px", color: `${text}55`, fontSize: "11px" }}>{tLab("lab_loading")}</div>}>
        <MonacoEditor height="100%" language="json" theme="vs-dark" value={value}
          onChange={(v) => handleJsonChange(v || "", tabType)}
          options={{ minimap: { enabled: false }, fontSize: 11, lineNumbers: "off", scrollBeyondLastLine: false,
            wordWrap: "on", tabSize: 2, renderLineHighlight: "none", overviewRulerBorder: false, padding: { top: 4, bottom: 4 } }}
        />
      </Suspense>
    </div>
  );

  const renderDocPane = (docKey) => (
    <pre style={{ color: text, fontSize: "12px", lineHeight: 1.55, fontFamily: "monospace",
      whiteSpace: "pre-wrap", margin: 0, padding: "10px 12px", borderRadius: "4px",
      background: `${text}08`, border: `1px solid ${text}10` }}>
      {tLab(docKey)}
    </pre>
  );

  if (!layout) return null;

  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateRows: "auto 1fr", background: bg, overflow: "hidden" }}>

      {/* ═══ Toolbar ═══ */}
      <div style={{ display: "flex", gap: "6px", padding: "6px 10px", alignItems: "center", borderBottom: `1px solid ${text}10`, flexWrap: "wrap" }}>
        <button onClick={handleNew} style={btn(false)}>{tLab("lab_new")}</button>
        <input value={designName} onChange={(e) => setDesignName(e.target.value)} style={{ ...sel, width: "140px", fontWeight: 600 }} />
        <button onClick={handleSave} style={btn(false)}>{saveMsg || tLab("lab_save")}</button>
        {savedDesigns.length > 0 && (
          <div ref={savedMenuRef} style={{ position: "relative" }}>
            <button onClick={() => setSavedMenuOpen(!savedMenuOpen)} style={btn(savedMenuOpen)}>
              {tLab("lab_saved_count", savedDesigns.length)}
            </button>
            {savedMenuOpen && (
              <div style={{
                position: "absolute", top: "100%", left: 0, marginTop: "4px",
                background: bg, border: `1px solid ${text}33`, borderRadius: "6px",
                minWidth: "200px", maxHeight: "240px", overflowY: "auto", zIndex: 100,
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}>
                {savedDesigns.map(d => (
                  <div key={d.id} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 10px", cursor: "pointer",
                    background: d.id === loadedDesignId ? `${accent}15` : "transparent",
                    borderBottom: `1px solid ${text}08`,
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = `${accent}22`}
                    onMouseLeave={(e) => e.currentTarget.style.background = d.id === loadedDesignId ? `${accent}15` : "transparent"}
                  >
                    <span style={{ flex: 1, fontSize: "12px", color: text }}
                      onClick={() => { handleLoad(d.id); setLoadedDesignId(d.id); setSavedMenuOpen(false); }}>
                      {d.name}
                    </span>
                    <span onClick={(e) => { e.stopPropagation(); handleDeleteSingle(d.id); }}
                      style={{ color: "#ff666688", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "0 2px" }}
                      title={tLab("lab_delete")}>×</span>
                  </div>
                ))}
                <div style={{ padding: "6px 10px", borderTop: `1px solid ${text}15` }}>
                  <button onClick={() => { handleClearAll(); setSavedMenuOpen(false); }}
                    style={{ ...btn(false), color: "#ff6666", borderColor: "#ff666644", fontSize: "11px", width: "100%" }}>
                    {tLab("lab_clear_all")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {loadedDesignId && (
          <button onClick={handleReload} style={btn(false)}>{tLab("lab_reload")}</button>
        )}
        <span style={{ color: text, opacity: 0.1 }}>|</span>
        <button onClick={handleExport} style={btn(false)}>{tLab("lab_export")}</button>
        <button onClick={handleImport} style={btn(false)}>{tLab("lab_import")}</button>
        <span style={{ color: text, opacity: 0.1 }}>|</span>
        <button onClick={() => setShowRoadmap(true)} style={{
          ...btn(false),
          background: "linear-gradient(135deg, rgba(106,76,147,0.15), rgba(74,144,217,0.15))",
          border: "none",
          padding: "4px 12px",
          position: "relative",
          overflow: "hidden",
        }}>
          <span style={{
            position: "absolute", inset: "-1px", borderRadius: "5px", padding: "2px",
            background: "linear-gradient(135deg, #6a4c93, #4a90d9, #44dd88, #4a90d9, #6a4c93)",
            backgroundSize: "300% 300%",
            animation: "roadmapGlow 4s ease infinite",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }} />
          <span style={{ position: "relative", display: "flex", alignItems: "center", gap: "4px" }}>
            ✦ {tLab("lab_roadmap")}
          </span>
        </button>
        <style>{`@keyframes roadmapGlow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`}</style>
        <span style={{ flex: 1 }} />
        <button onClick={triggerDemo} style={btn(false)}>{tLab("lab_demo")}</button>
        <button onClick={() => setLiveTyping(!liveTyping)} style={btn(liveTyping)}>{liveTyping ? tLab("lab_live_on") : tLab("lab_live_off")}</button>
      </div>

      {/* ═══ Workspace ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: `${splitPercent}% 6px 1fr`, overflow: "hidden" }}>

        {/* 3D Viewport */}
        <div style={{ minHeight: 0, minWidth: 0 }}>
          <KeyboardLab ref={keyboardRef} layout={layout} shell={shell} keycapPreset={keycapPreset}
            keycapColor={colors.keycapColor} accentKeyColor={colors.accentKeyColor} caseColor={colors.caseColor}
            opacity={opacity} legendPreset={legendPreset} caseProfile={caseProfile} caseScale={caseScale}
            mountOffset={mountOffset} mountFit={mountFit} extrudeWidth={extrudeWidth}
            renderStyle={effectiveKeycapRenderStyle} renderStyleCase={resolvedRenderStyleCase}
            backgroundColor={viewerBg} ambientIntensity={viewerAmbient} keyIntensity={viewerKey}
            viewerBgType={viewerBgType} viewerBg2={viewerBg2}
            fov={viewerFov} fogDensity={viewerFog} shadowOpacity={viewerShadow}
            grid3D={viewerGrid3D} starCount={viewerStarCount}
            onViewerChange={{
              setViewerBg, setViewerBg2, setViewerBgType, setViewerAmbient, setViewerKey,
              setViewerFov, setViewerFog, setViewerShadow,
              setViewerGrid3D, setViewerStarCount,
            }} />
        </div>

        {/* Drag handle */}
        <div onMouseDown={handleMouseDown} style={{
          cursor: "col-resize", background: `${text}08`, display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }} onMouseEnter={(e) => e.currentTarget.style.background = accent+"33"} onMouseLeave={(e) => e.currentTarget.style.background = `${text}08`}>
          <div style={{ width: "2px", height: "32px", borderRadius: "1px", background: `${text}25` }} />
        </div>

        {/* Sidebar — scrollable card stack */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "8px" }}>

            {/* ── Design card ── */}
            <div style={cardStyle}>
              {renderCardHeader("Design", tLab("lab_tab_design"), [
                { key: "config", label: tLab("lab_tab_config") },
                { key: "json", label: tLab("lab_tab_json") },
                { key: "doc", label: tLab("lab_tab_doc") },
              ])}
              {!collapsed.Design && (
                <div style={cardBodyStyle}>
                  {cardTabs.Design === "config" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_name") || "Name"}</span>
                        <input value={designName} onChange={(e) => setDesignName(e.target.value)}
                          style={{ ...sel, flex: 1, fontWeight: 600, minWidth: "160px" }} />
                      </div>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_theme")}</span>
                        <select value={colorPreset} onChange={(e) => applyColorPreset(e.target.value)} style={{ ...sel, minWidth: "160px" }}>
                          {Object.keys(COLOR_PRESETS).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ ...fieldLabel, marginBottom: "6px" }}>{tLab("lab_refs")}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontFamily: "monospace", fontSize: "12px" }}>
                          {[
                            ["layout", layoutRef], ["shell", shellRef], ["keycap", keycapRef],
                            ["legend", legendRef], ["caseProfile", caseProfileRef],
                            ["renderStyle", renderStyleRef],
                          ].map(([k, v]) => (
                            <React.Fragment key={k}>
                              <span style={{ color: `${text}77` }}>{k}</span>
                              <span style={{ color: accent, wordBreak: "break-all" }}>{v}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {cardTabs.Design === "json" && renderJsonPane(designJson, "Design", "260px")}
                  {cardTabs.Design === "doc" && renderDocPane("lab_doc_design")}
                </div>
              )}
            </div>

            {/* ── Layout card ── */}
            <div style={cardStyle}>
              {renderCardHeader("Layout", tLab("lab_tab_layout"), [
                { key: "config", label: tLab("lab_tab_config") },
                { key: "json", label: tLab("lab_tab_json") },
                { key: "doc", label: tLab("lab_tab_doc") },
              ])}
              {!collapsed.Layout && (
                <div style={cardBodyStyle}>
                  {cardTabs.Layout === "config" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_layout")}</span>
                        <select value={layoutRef} onChange={(e) => setLayoutRef(e.target.value)} style={{ ...sel, flex: 1, minWidth: "160px" }}>
                          {layoutRefs.map(a => <option key={a.ref} value={a.ref}>{a.name}</option>)}
                        </select>
                        <button onClick={() => { setKleInput(""); setKleError(""); setShowKleModal(true); }}
                          title={tLab("lab_import_kle_tooltip")} style={btn(false)}>
                          {tLab("lab_import_kle")}
                        </button>
                      </div>
                      <KeyboardLayout2D layout={layout} activeKeys={activeKeys} theme={theme} fitToContainer />
                    </div>
                  )}
                  {cardTabs.Layout === "json" && renderJsonPane(layoutJson, "Layout", "260px")}
                  {cardTabs.Layout === "doc" && renderDocPane("lab_doc_layout")}
                </div>
              )}
            </div>

            {/* ── Shell card ── */}
            <div style={cardStyle}>
              {renderCardHeader("Shell", tLab("lab_tab_shell"), [
                { key: "config", label: tLab("lab_tab_config") },
                { key: "json", label: tLab("lab_tab_json") },
                { key: "doc", label: tLab("lab_tab_doc") },
              ])}
              {!collapsed.Shell && (
                <div style={cardBodyStyle}>
                  {cardTabs.Shell === "config" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_shell")}</span>
                        <select value={shellRef} onChange={(e) => setShellRef(e.target.value)} style={{ ...sel, flex: 1, minWidth: "160px" }}>
                          {SHELL_REFS.map(a => <option key={a.ref} value={a.ref}>{a.name}</option>)}
                        </select>
                      </div>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_case_color")}</span>
                        <input type="color" value={colors.caseColor}
                          onChange={(e) => setColors(c => ({ ...c, caseColor: e.target.value }))}
                          style={{ width: "32px", height: "32px", border: `1px solid ${text}33`, borderRadius: "4px", cursor: "pointer", background: "transparent", padding: 0 }} />
                        <span style={{ fontSize: "12px", color: `${text}77` }}>{tLab("lab_opacity")}</span>
                        <input type="number" min="0" max="1" step="0.05" value={opacity.case.toFixed(2)}
                          onChange={(e) => setOpacity(o => ({ ...o, case: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) }))}
                          style={numInput} />
                      </div>
                    </div>
                  )}
                  {cardTabs.Shell === "json" && renderJsonPane(shellJson, "Shell", "220px")}
                  {cardTabs.Shell === "doc" && renderDocPane("lab_doc_shell")}
                </div>
              )}
            </div>

            {/* ── Case Profile card ── */}
            <div style={cardStyle}>
              {renderCardHeader("CaseProfile", tLab("lab_tab_case_profile"), [
                { key: "config", label: tLab("lab_tab_config") },
                { key: "json", label: tLab("lab_tab_json") },
                { key: "doc", label: tLab("lab_tab_doc") },
              ])}
              {!collapsed.CaseProfile && (
                <div style={cardBodyStyle}>
                  {cardTabs.CaseProfile === "config" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_profile")}</span>
                        <select value={caseProfileRef} onChange={(e) => setCaseProfileRef(e.target.value)} style={{ ...sel, flex: 1, minWidth: "160px" }}>
                          {CASE_PROFILE_REFS.map(a => <option key={a.ref} value={a.ref}>{a.name}</option>)}
                        </select>
                        <button onClick={() => {
                          // Re-fetch the selected profile so shape AND mount params reset,
                          // not just the mount knobs. Setting state to DEFAULTS alone wouldn't
                          // touch caseProfile's polygon points.
                          bundledResolver(caseProfileRef).then((p) => {
                            if (p.caseProfile) setCaseProfile(p.caseProfile);
                            if (p.mount) {
                              setMountOffset(p.mount.offset || DEFAULTS.mountOffset);
                              setMountFit(p.mount.fit != null ? p.mount.fit : DEFAULTS.mountFit);
                              setCaseScale(p.mount.caseScale != null ? p.mount.caseScale : DEFAULTS.caseScale);
                              setExtrudeWidth(p.mount.extrudeWidth != null ? p.mount.extrudeWidth : DEFAULTS.extrudeWidth);
                            } else {
                              setMountOffset(DEFAULTS.mountOffset);
                              setMountFit(DEFAULTS.mountFit);
                              setCaseScale(DEFAULTS.caseScale);
                              setExtrudeWidth(DEFAULTS.extrudeWidth);
                            }
                          }).catch(() => {});
                        }} style={btn(false)}>{tLab("lab_reset")}</button>
                      </div>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_keycap_mount")}</span>
                        {[
                          { axis: "x", label: "X", min: -3, max: 3, step: 0.1, color: "#ff6666" },
                          { axis: "y", label: "Y", min: -2, max: 2, step: 0.05, color: "#66ff66" },
                          { axis: "z", label: "Z", min: -3, max: 3, step: 0.1, color: "#6688ff" },
                        ].map(({ axis, label, min, max, step, color }) => (
                          <label key={axis} style={{ ...lbl, gap: "4px" }}>
                            <span style={{ color, fontWeight: 700, fontSize: "12px" }}>{label}</span>
                            <input type="number" min={min} max={max} step={step} value={mountOffset[axis]}
                              onChange={(e) => setMountOffset(prev => ({ ...prev, [axis]: parseFloat(e.target.value) || 0 }))}
                              style={numInput} />
                          </label>
                        ))}
                      </div>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_fit")}</span>
                        <input type="number" min="0.4" max="1.5" step="0.05" value={mountFit.toFixed(2)}
                          onChange={(e) => setMountFit(Math.max(0.4, Math.min(1.5, parseFloat(e.target.value) || 0.4)))}
                          style={numInput} />
                        <span style={{ ...fieldLabel, minWidth: "auto" }}>{tLab("lab_scale")}</span>
                        <input type="number" min="0.5" max="2.0" step="0.05" value={caseScale.toFixed(2)}
                          onChange={(e) => setCaseScale(Math.max(0.5, Math.min(2.0, parseFloat(e.target.value) || 0.5)))}
                          style={numInput} />
                      </div>
                      <CaseProfileEditor
                        theme={theme}
                        initialProfile={caseProfile}
                        onChange={setCaseProfile}
                        extrudeWidth={extrudeWidth}
                        onExtrudeWidthChange={setExtrudeWidth}
                      />
                    </div>
                  )}
                  {cardTabs.CaseProfile === "json" && renderJsonPane(caseProfileJson, "Case Profile", "240px")}
                  {cardTabs.CaseProfile === "doc" && renderDocPane("lab_doc_caseProfile")}
                </div>
              )}
            </div>

            {/* ── Keycap card ── */}
            <div style={cardStyle}>
              {renderCardHeader("Keycap", tLab("lab_tab_keycap"), [
                { key: "config", label: tLab("lab_tab_config") },
                { key: "json", label: tLab("lab_tab_json") },
                { key: "doc", label: tLab("lab_tab_doc") },
              ])}
              {!collapsed.Keycap && (
                <div style={cardBodyStyle}>
                  {cardTabs.Keycap === "config" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_keycap")}</span>
                        <select value={keycapRef} onChange={(e) => setKeycapRef(e.target.value)} style={{ ...sel, flex: 1, minWidth: "160px" }}>
                          {KEYCAP_REFS.map(a => <option key={a.ref} value={a.ref}>{a.name}</option>)}
                        </select>
                      </div>
                      {[
                        { l: "lab_keycap_color", k: "keycapColor", ok: "keycap" },
                        { l: "lab_accent_color", k: "accentKeyColor", ok: "accent" },
                      ].map(({ l, k, ok }) => (
                        <div key={k} style={fieldRowStyle}>
                          <span style={fieldLabel}>{tLab(l)}</span>
                          <input type="color" value={colors[k]} onChange={(e) => setColors(c => ({ ...c, [k]: e.target.value }))}
                            style={{ width: "32px", height: "32px", border: `1px solid ${text}33`, borderRadius: "4px", cursor: "pointer", background: "transparent", padding: 0 }} />
                          <span style={{ fontSize: "12px", color: `${text}77` }}>{tLab("lab_opacity")}</span>
                          <input type="number" min="0" max="1" step="0.05" value={opacity[ok].toFixed(2)}
                            onChange={(e) => setOpacity(o => ({ ...o, [ok]: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) }))}
                            style={numInput} />
                        </div>
                      ))}
                    </div>
                  )}
                  {cardTabs.Keycap === "json" && renderJsonPane(keycapJson, "Keycap", "220px")}
                  {cardTabs.Keycap === "doc" && renderDocPane("lab_doc_keycap")}
                </div>
              )}
            </div>

            {/* ── Legend card ── */}
            <div style={cardStyle}>
              {renderCardHeader("Legend", tLab("lab_tab_legend"), [
                { key: "config", label: tLab("lab_tab_config") },
                { key: "json", label: tLab("lab_tab_json") },
                { key: "doc", label: tLab("lab_tab_doc") },
              ])}
              {!collapsed.Legend && (
                <div style={cardBodyStyle}>
                  {cardTabs.Legend === "config" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_legend")}</span>
                        <select value={legendRef} onChange={(e) => { setLegendRef(e.target.value); setLegendOverrides({}); }} style={{ ...sel, flex: 1, minWidth: "160px" }}>
                          {LEGEND_REFS.map(a => <option key={a.ref} value={a.ref}>{a.name}</option>)}
                        </select>
                      </div>
                      <div style={fieldRowStyle}>
                        <span style={fieldLabel}>{tLab("lab_font")}</span>
                        <select value={legendPreset.style.fontFamily} onChange={(e) => setLegendOverrides(o => ({ ...o, fontFamily: e.target.value }))} style={{ ...sel, minWidth: "110px" }}>
                          <option value="Arial, sans-serif">Arial</option>
                          <option value="Courier New, monospace">Courier</option>
                          <option value="Tomorrow, monospace">Tomorrow</option>
                        </select>
                        <input type="number" min="8" max="40" step="1" value={legendPreset.style.fontSize}
                          onChange={(e) => setLegendOverrides(o => ({ ...o, fontSize: parseInt(e.target.value) || 0 }))}
                          title={tLab("lab_size")} style={numInput} />
                        <select value={legendPreset.style.fontWeight} onChange={(e) => setLegendOverrides(o => ({ ...o, fontWeight: parseInt(e.target.value) }))} title={tLab("lab_weight")} style={sel}>
                          <option value="400">{tLab("lab_light")}</option>
                          <option value="600">{tLab("lab_semi")}</option>
                          <option value="700">{tLab("lab_bold")}</option>
                        </select>
                        <input type="color" value={legendPreset.style.color}
                          onChange={(e) => setLegendOverrides(o => ({ ...o, color: e.target.value }))}
                          title={tLab("lab_color")}
                          style={{ width: "28px", height: "28px", border: `1px solid ${text}33`, borderRadius: "4px", cursor: "pointer", background: "transparent", padding: 0 }} />
                        <span style={{ fontSize: "12px", color: `${text}77` }}>{tLab("lab_opacity")}</span>
                        <input type="number" min="0" max="1" step="0.05" value={opacity.legend.toFixed(2)}
                          onChange={(e) => setOpacity(o => ({ ...o, legend: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) }))}
                          style={{ ...numInput, width: "56px" }} />
                      </div>
                      {(() => {
                        const parsed = parseLegendPosition(legendPreset?.style?.position);
                        const updatePosition = (patch) => {
                          setLegendOverrides(o => {
                            const curr = typeof o.position === "object" ? o.position : { anchor: parsed.anchor };
                            const next = { anchor: patch.anchor ?? curr.anchor ?? parsed.anchor };
                            const currInset = curr.inset || { x: parsed.insetX, z: parsed.insetZ };
                            if (patch.insetX != null || patch.insetZ != null) {
                              next.inset = {
                                x: patch.insetX != null ? patch.insetX : currInset.x,
                                z: patch.insetZ != null ? patch.insetZ : currInset.z,
                              };
                            } else if (curr.inset) {
                              next.inset = currInset;
                            }
                            return { ...o, position: next };
                          });
                        };
                        const isCenter = parsed.anchor === "center";
                        return (
                          <div style={fieldRowStyle}>
                            <span style={fieldLabel}>{tLab("lab_legend_position")}</span>
                            <select value={parsed.anchor}
                              onChange={(e) => updatePosition({ anchor: e.target.value })}
                              style={{ ...sel, minWidth: "140px" }}>
                              <option value="center">{tLab("lab_pos_center")}</option>
                              <option value="top-left">{tLab("lab_pos_top_left")}</option>
                              <option value="top-center">{tLab("lab_pos_top_center")}</option>
                              <option value="top-right">{tLab("lab_pos_top_right")}</option>
                              <option value="bottom-left">{tLab("lab_pos_bottom_left")}</option>
                              <option value="bottom-center">{tLab("lab_pos_bottom_center")}</option>
                              <option value="bottom-right">{tLab("lab_pos_bottom_right")}</option>
                            </select>
                            {!isCenter && (
                              <>
                                <span style={{ fontSize: "12px", color: `${text}77` }}>{tLab("lab_legend_inset")}</span>
                                {parsed.anchorX !== "center" && (
                                  <label style={{ ...lbl, gap: "4px" }}>
                                    <span style={{ fontSize: "11px", color: `${text}99` }}>X</span>
                                    <input type="number" min={LEGEND_INSET_RANGE.min} max={LEGEND_INSET_RANGE.max} step="0.01"
                                      value={parsed.insetX.toFixed(2)}
                                      onChange={(e) => updatePosition({ insetX: parseFloat(e.target.value) || LEGEND_INSET_DEFAULTS.x })}
                                      style={numInput} />
                                  </label>
                                )}
                                {parsed.anchorY !== "middle" && (
                                  <label style={{ ...lbl, gap: "4px" }}>
                                    <span style={{ fontSize: "11px", color: `${text}99` }}>Z</span>
                                    <input type="number" min={LEGEND_INSET_RANGE.min} max={LEGEND_INSET_RANGE.max} step="0.01"
                                      value={parsed.insetZ.toFixed(2)}
                                      onChange={(e) => updatePosition({ insetZ: parseFloat(e.target.value) || LEGEND_INSET_DEFAULTS.z })}
                                      style={numInput} />
                                  </label>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {cardTabs.Legend === "json" && renderJsonPane(legendJson, "Legend", "220px")}
                  {cardTabs.Legend === "doc" && renderDocPane("lab_doc_legend")}
                </div>
              )}
            </div>

            {/* ── Style card (eletypes-renderStyle/1) ── */}
            <div style={cardStyle}>
              {renderCardHeader("Style", tLab("lab_tab_style"), [
                { key: "config", label: tLab("lab_tab_config") },
                { key: "json", label: tLab("lab_tab_json") },
                { key: "doc", label: tLab("lab_tab_doc") },
              ])}
              {!collapsed.Style && (
                <div style={cardBodyStyle}>
                  {cardTabs.Style === "config" && (() => {
                    // Scope sub-tabs: one consistent control surface driven by
                    // { ref, overrides, resolved, setRef, setOverrides }.
                    // Scoped tabs (keycap / case) accept null ref to inherit
                    // the global style; that's expressed as "" in the <select>.
                    const scopes = [
                      { id: "global", label: tLab("lab_scope_global"),
                        ref: renderStyleRef, resolved: resolvedRenderStyle, overrides: renderStyleOverrides,
                        setRef: setRenderStyleRef, setOverrides: setRenderStyleOverrides, allowInherit: false },
                      { id: "keycap", label: tLab("lab_scope_keycap"),
                        ref: renderStyleKeycapRef || "", resolved: resolvedRenderStyleKeycap, overrides: renderStyleKeycapOverrides,
                        setRef: (v) => { setRenderStyleKeycapRef(v || null); setRenderStyleKeycapOverrides({}); },
                        setOverrides: setRenderStyleKeycapOverrides, allowInherit: true },
                      { id: "case", label: tLab("lab_scope_case"),
                        ref: renderStyleCaseRef || "", resolved: resolvedRenderStyleCase, overrides: renderStyleCaseOverrides,
                        setRef: (v) => { setRenderStyleCaseRef(v || null); setRenderStyleCaseOverrides({}); },
                        setOverrides: setRenderStyleCaseOverrides, allowInherit: true },
                    ];
                    const active = scopes.find((s) => s.id === styleScope) || scopes[0];
                    const hasScope = active.id === "global" || !!active.ref;
                    const resolved = active.resolved;
                    const primary = resolved ? (Array.isArray(resolved.mode) ? resolved.mode[0] : resolved.mode) : null;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${text}10`, paddingBottom: "4px" }}>
                          {scopes.map((s) => {
                            const isActive = s.id === styleScope;
                            const inherits = s.id !== "global" && !s.ref;
                            return (
                              <button key={s.id} onClick={() => setStyleScope(s.id)}
                                style={{
                                  background: isActive ? `${accent}22` : "transparent",
                                  border: `1px solid ${isActive ? accent : text+"22"}`,
                                  borderRadius: "4px", color: isActive ? accent : `${text}99`,
                                  padding: "3px 10px", cursor: "pointer", fontSize: "12px",
                                  fontFamily: "inherit",
                                }}>
                                {s.label}{inherits ? " ·" : ""}
                              </button>
                            );
                          })}
                        </div>
                        <div style={fieldRowStyle}>
                          <span style={fieldLabel}>{tLab("lab_style_preset")}</span>
                          <select value={active.ref}
                            onChange={(e) => active.setRef(e.target.value)}
                            style={{ ...sel, flex: 1, minWidth: "160px" }}>
                            {active.allowInherit && <option value="">{tLab("lab_style_inherit")}</option>}
                            {RENDER_STYLE_REFS.map((a) => {
                              const preset = RENDER_STYLE_PRESETS[a.ref.split("/")[1].split("@")[0]];
                              const p = Array.isArray(preset?.mode) ? preset.mode[0] : preset?.mode;
                              return (
                                <option key={a.ref} value={a.ref}>
                                  {a.name}{p && !IMPLEMENTED_MODES.has(p) ? " — soon" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        {hasScope && resolved && (
                          <div style={{ ...fieldRowStyle, marginTop: "-4px" }}>
                            <span style={fieldLabel}>{tLab("lab_style_mode")}</span>
                            <span style={{ flex: 1, color: accent, fontFamily: "monospace", fontSize: "12px" }}>
                              {primary || "pbr"}
                            </span>
                            <button onClick={() => setStyleAdvancedOpen((o) => !o)}
                              style={{
                                background: "transparent", border: "none",
                                color: `${text}88`, cursor: "pointer",
                                fontSize: "11px", padding: "2px 4px",
                                textDecoration: "underline", fontFamily: "inherit",
                              }}>
                              {styleAdvancedOpen ? tLab("lab_hide") : tLab("lab_advanced")}
                            </button>
                          </div>
                        )}
                        {hasScope && resolved && styleAdvancedOpen && (
                          <div style={fieldRowStyle}>
                            <span style={fieldLabel}>{tLab("lab_style_mode")}</span>
                            <select value={primary || "pbr"}
                              onChange={(e) => active.setOverrides((o) => ({ ...o, mode: e.target.value }))}
                              style={{ ...sel, minWidth: "160px" }}>
                              {RENDER_MODES.map((m) => (
                                <option key={m} value={m}>
                                  {m}{!IMPLEMENTED_MODES.has(m) ? " — soon" : ""}
                                </option>
                              ))}
                            </select>
                            <span style={{ fontSize: "10px", color: `${text}55`, fontStyle: "italic" }}>
                              {tLab("lab_style_mode_note")}
                            </span>
                          </div>
                        )}
                        {hasScope && resolved && primary === "cel-hard" && (
                          <div style={fieldRowStyle}>
                            <span style={fieldLabel}>{tLab("lab_style_steps")}</span>
                            <input type="number" min="2" max="6" step="1"
                              value={resolved.cel?.gradientSteps ?? 3}
                              onChange={(e) => {
                                const v = Math.max(2, Math.min(6, parseInt(e.target.value) || 3));
                                active.setOverrides((o) => ({ ...o, cel: { ...(o.cel || {}), gradientSteps: v } }));
                              }}
                              style={numInput} />
                            <span style={{ ...fieldLabel, minWidth: "auto" }}>{tLab("lab_style_outline")}</span>
                            <input type="number" min="0" max="0.2" step="0.005"
                              value={(resolved.cel?.outlineWidth ?? 0.03).toFixed(3)}
                              onChange={(e) => {
                                const v = Math.max(0, Math.min(0.2, parseFloat(e.target.value) || 0));
                                active.setOverrides((o) => ({ ...o, cel: { ...(o.cel || {}), outlineWidth: v } }));
                              }}
                              style={numInput} />
                            <input type="color" value={resolved.cel?.outlineColor || "#1a1a1a"}
                              onChange={(e) => active.setOverrides((o) => ({ ...o, cel: { ...(o.cel || {}), outlineColor: e.target.value } }))}
                              title={tLab("lab_color")}
                              style={{ width: "28px", height: "28px", border: `1px solid ${text}33`, borderRadius: "4px", cursor: "pointer", background: "transparent", padding: 0 }} />
                          </div>
                        )}
                        {hasScope && resolved && primary === "x-ray" && (
                          <div style={fieldRowStyle}>
                            <span style={fieldLabel}>{tLab("lab_opacity")}</span>
                            <input type="number" min="0.05" max="0.95" step="0.05"
                              value={(resolved.xray?.opacity ?? 0.25).toFixed(2)}
                              onChange={(e) => {
                                const v = Math.max(0.05, Math.min(0.95, parseFloat(e.target.value) || 0.25));
                                active.setOverrides((o) => ({ ...o, xray: { ...(o.xray || {}), opacity: v } }));
                              }}
                              style={numInput} />
                          </div>
                        )}
                        {hasScope && resolved && primary === "neon" && (
                          <div style={fieldRowStyle}>
                            <span style={fieldLabel}>{tLab("lab_style_glow")}</span>
                            <input type="number" min="0" max="3" step="0.05"
                              value={(resolved.neon?.emissiveIntensity ?? 1.4).toFixed(2)}
                              onChange={(e) => {
                                const v = Math.max(0, Math.min(3, parseFloat(e.target.value) || 1.4));
                                active.setOverrides((o) => ({ ...o, neon: { ...(o.neon || {}), emissiveIntensity: v } }));
                              }}
                              style={numInput} />
                          </div>
                        )}
                        {!hasScope && (
                          <div style={{ fontSize: "12px", color: `${text}66`, fontStyle: "italic" }}>
                            {tLab("lab_style_inherit_note")}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {cardTabs.Style === "json" && renderJsonPane(renderStyleJson, "Style", "220px")}
                  {cardTabs.Style === "doc" && renderDocPane("lab_doc_style")}
                </div>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* ═══ Import Modal (KLE paste or drop) ═══ */}
      {showKleModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }} onClick={() => setShowKleModal(false)}>
          <div style={{
            background: bg, border: `1px solid ${text}20`, borderRadius: "12px",
            width: "min(1080px, 92vw)", height: "min(720px, 86vh)",
            padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px",
            overflow: "hidden",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ color: accent, margin: 0, fontSize: "18px", fontWeight: 700 }}>{tLab("lab_import")}</h2>
              <button onClick={() => setShowKleModal(false)} style={{
                background: "transparent", border: "none", color: `${text}66`, cursor: "pointer", fontSize: "20px", lineHeight: 1,
              }}>×</button>
            </div>
            <p style={{ color: `${text}88`, fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
              {(() => {
                const [before, after] = tLab("lab_import_kle_hint", "\uE000").split("\uE000");
                return (<>
                  {before}
                  <a href="https://www.keyboard-layout-editor.com/" target="_blank" rel="noopener noreferrer"
                    style={{ color: accent, textDecoration: "underline" }}>
                    {tLab("lab_import_kle_hint_link")}
                  </a>
                  {after}
                </>);
              })()}
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setKleDragOver(true); }}
              onDragLeave={() => setKleDragOver(false)}
              onDrop={handleKleFileDrop}
              style={{
                flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
                border: `2px ${kleDragOver ? "solid" : "dashed"} ${kleDragOver ? accent : text+"22"}`,
                borderRadius: "6px", position: "relative", transition: "border-color 120ms, border-style 120ms",
              }}
            >
              {!kleInput && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  color: kleDragOver ? accent : `${text}55`, fontSize: "13px", pointerEvents: "none", zIndex: 1,
                  textAlign: "center", padding: "0 20px",
                }}>
                  {tLab("lab_import_kle_drop_hint")}
                </div>
              )}
              <Suspense fallback={<div style={{ color: `${text}66`, fontSize: "12px", padding: "12px" }}>{tLab("lab_loading")}</div>}>
                <MonacoEditor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={kleInput}
                  onChange={(v) => { setKleInput(v || ""); setKleError(""); }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                    lineNumbers: "on",
                  }}
                />
              </Suspense>
            </div>

            {kleError && (
              <div style={{
                background: "#3a1515", color: "#ff9999", border: `1px solid #ff666644`,
                borderRadius: "4px", padding: "8px 10px", fontSize: "12px",
                fontFamily: "Courier New, monospace", whiteSpace: "pre-wrap",
              }}>
                <strong style={{ color: "#ff6666" }}>{tLab("lab_import_kle_failed")}</strong> {kleError}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
              <span style={{ flex: 1, color: `${text}55`, fontSize: "11px" }}>
                {kleInput ? tLab("lab_import_kle_chars", kleInput.length) : ""}
              </span>
              <button onClick={() => { setKleInput(""); setKleError(""); }} style={btn(false)} disabled={!kleInput}>
                {tLab("lab_clear_all")}
              </button>
              <button onClick={() => setShowKleModal(false)} style={btn(false)}>{tLab("lab_cancel")}</button>
              <button onClick={handleKleConvert} disabled={!kleInput.trim()}
                style={{ ...btn(true), opacity: kleInput.trim() ? 1 : 0.4, cursor: kleInput.trim() ? "pointer" : "not-allowed" }}>
                {tLab("lab_convert")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Roadmap Modal ═══ */}
      {showRoadmap && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }} onClick={() => setShowRoadmap(false)}>
          <div style={{
            background: bg, border: `1px solid ${text}20`, borderRadius: "12px",
            maxWidth: "600px", width: "90%", maxHeight: "80vh", overflow: "auto",
            padding: "28px 32px",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <h2 style={{ color: accent, margin: 0, fontSize: "20px", fontWeight: 700 }}>{tLab("lab_roadmap_title")}</h2>
              <button onClick={() => setShowRoadmap(false)} style={{
                background: "transparent", border: "none", color: `${text}66`, cursor: "pointer", fontSize: "20px", lineHeight: 1,
              }}>×</button>
            </div>
            <p style={{ color: `${text}88`, fontSize: "13px", margin: "0 0 20px" }}>{tLab("lab_roadmap_subtitle")}</p>

            {[
              { titleKey: "lab_roadmap_done", itemsKey: "lab_roadmap_done_items", icon: "✓", color: "#44dd88" },
              { titleKey: "lab_roadmap_next", itemsKey: "lab_roadmap_next_items", icon: "→", color: accent },
              { titleKey: "lab_roadmap_future", itemsKey: "lab_roadmap_future_items", icon: "◇", color: `${text}66` },
            ].map(({ titleKey, itemsKey, icon, color }) => (
              <div key={titleKey} style={{ marginBottom: "20px" }}>
                <h3 style={{ color, fontSize: "14px", fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {tLab(titleKey)}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {(tLab(itemsKey) || []).map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: text, lineHeight: 1.5 }}>
                      <span style={{ color, flexShrink: 0, fontWeight: 700 }}>{icon}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Editor's note */}
            <div style={{ marginTop: "8px", paddingTop: "20px", borderTop: `1px solid ${text}15` }}>
              <h3 style={{ color: accent, fontSize: "14px", fontWeight: 700, margin: "0 0 10px", fontStyle: "italic" }}>
                {tLab("lab_editors_note_title")}
              </h3>
              <div style={{
                color: `${text}cc`, fontSize: "13px", lineHeight: 1.8,
                whiteSpace: "pre-wrap", fontStyle: "italic",
              }}>
                {tLab("lab_editors_note").split(tLab("lab_editors_note_link_text")).map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <React.Fragment key={i}>
                      {part}<a href={tLab("lab_editors_note_link")} target="_blank" rel="noopener noreferrer"
                        style={{ color: accent, textDecoration: "underline" }}>{tLab("lab_editors_note_link_text")}</a>
                    </React.Fragment>
                  ) : <React.Fragment key={i}>{part}</React.Fragment>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardLabDemo;

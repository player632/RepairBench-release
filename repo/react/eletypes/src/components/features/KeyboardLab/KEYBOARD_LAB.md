# Keyboard Lab — Data-Driven 3D Keyboard Design Platform

## Status: Beta — live at `/keyboardlab`

---

## 1. Schemas (8 Layers)

### Persisted Asset Schemas
| Schema | Version | Purpose |
|--------|---------|---------|
| `eletypes-kbd/1` | Stable | Layout: board metadata, key placement, identity |
| `eletypes-cap/1` | Stable | Keycap: profile families, row sculpting, procedural + mesh caps |
| `eletypes-legend/1` | Stable | Legend: font, size, weight, color, position, per-key overrides |
| `eletypes-visual/1` | Stable | Visual: colors, materials, per-key color overrides |
| `eletypes-shell/1` | Stable | Shell: case geometry, padding, corner radius |
| `eletypes-caseProfile/1` | Stable | Case profile: 2D cross-section, mount settings, colored edges |
| `eletypes-renderStyle/1` | Beta | Render style: material pipeline — PBR / cel-hard / lofi-flat / riso / … |
| `eletypes-design/1` | Stable | Composition: asset refs + overrides + renderStyle (orchestrator) |

### Persistence Layer
| Format | Purpose |
|--------|---------|
| `eletypes-design-bundle/1` | Local save/import-export bundle (design doc + embedded assets) |

### Runtime Layer
| Model | Purpose |
|-------|---------|
| `NormalizedKeyboard` | Ephemeral render model, never persisted |

---

## 2. Architecture

### Design Bundle (Local Persistence)
```
eletypes-design-bundle/1
  ├─ schema: "eletypes-design-bundle/1"
  ├─ savedAt
  ├─ design (orchestrator)
  │   ├─ refs.layout       → "layout/cyberboard-75-ansi@1"
  │   ├─ refs.keycap       → "keycap/cherry-classic@1"
  │   ├─ refs.legend       → "legend/gmk-center@1"
  │   ├─ refs.shell        → "shell/standard@1"
  │   ├─ refs.caseProfile  → "caseProfile/cyberboard-wedge@1"
  │   └─ overrides         → visual, opacity, legend, per-key
  └─ embeddedAssets (full resolved docs)
      ├─ layout, keycap, legend, shell, caseProfile
```

### Composition Pipeline
```
Design Document (eletypes-design/1)
  ├─ refs.layout       → resolve from bundled / embedded / remote
  ├─ refs.keycap       → ...
  ├─ refs.legend       → ...
  ├─ refs.shell        → ...
  ├─ refs.caseProfile  → ...
  └─ overrides         → visual, opacity, legend tweaks
         ↓
  Asset Resolver (bundled → embedded → remote)
         ↓
  Normalization Pipeline
         ↓
  NormalizedKeyboard → 2D Editor / 3D Renderer / JSON Export
```

### Asset Reference Convention
```
{schema-type}/{asset-id}@{version}
e.g., "layout/cyberboard-75-ansi@1", "caseProfile/cyberboard-wedge@1"
```

### Key Design Decisions
- **`design.refs`** — asset references are strings, not objects; "refs" not "assets"
- **`overrides.opacity`** — sibling of `overrides.visual`, not nested inside it
- **`caseProfile`** — not "profile" (avoids collision with keycap profile concept)
- **Flat key objects** — easy to edit, diff, undo/redo
- **capRef as abstract bridge** — layout never contains mesh paths or geometry
- **Design bundle is the save format** — wraps design doc + embedded assets for offline/portable use
- **Design doc is the share format** — refs only, no embedded blobs (future publish/share)
- **3D Text legends inside KeyboardModel** — direct access to `restPositions`, no sync issues
- **frameloop="demand"** — zero GPU cost at idle
- **Split InstancedMesh** — regular + accent keycaps as separate meshes for independent opacity

---

## 3. Features

### 3D Keyboard Visualization
- 7 layouts: 60%, 65%, HHKB 60%, 75% (Generic + Cyberboard R2), TKL 80%, Full-size 100%
- OrbitControls with zoom range 4–35
- Spring animation on key press (critically damped, ~80ms settle)
- Live key listening (DOM keydown → triggerKey → 3D animation + sound)

### Per-Group Opacity
- 4 independent opacity controls: keycap, accent, case, legend
- Split InstancedMesh (regular + accent) for independent transparency
- Transparency only enabled when opacity < 1.0 (prevents z-fighting flicker)

### Keycap Profiles (8)
- Sculpted: Cherry, OEM, SA, MT3, KAT
- Uniform: DSA, XDA, Low Profile
- Procedural geometry: tapered walls, per-profile dish shape/depth
- Per-row height variation from profile sculpting data

### Shell Presets (5)
- Standard, Slim, Wide Bezel, Angular, Top Heavy
- Layout-agnostic — padding adapts to any key field size

### Parametric Case Editor
- **2D profile editor**: SVG cross-section with draggable control points
- **4 case profile presets**: Cyberboard Wedge, Flat Box, Chamfered Wedge, Ergonomic
- **Profile → 3D extrusion**: 2D profile extruded symmetrically into 3D case geometry
- **Mount surface**: click any edge to set mount; keys auto-place with correct tilt angle
- **Colored edge accents**: per-edge color with emissive glow (LED strip effect)
- **Per-vertex inset**: narrow case width at specific vertices for chamfers/bevels
- **Mount controls**: 3-axis offset, fit ratio, case scale
- **Extrusion width**: text input with 1% precision, labeled "symmetric ←→"

### Render Style *(new, beta — eletypes-renderStyle/1)*
- **Pluggable material pipeline** — switch the whole keyboard's look without touching layout / keycaps / colors / legends
- **Modes**: `pbr` (default), `cel-hard` (toon + outline), `lofi-flat` (unlit flat color); scaffold for `risograph`, `painterly`, `pixel`, `blueprint`, `x-ray`, and layer blend `[mode, mode]`
- **cel-hard**: `MeshToonMaterial` with a per-step `DataTexture` gradient map; outline via BackSide scaled InstancedMesh (no shader surgery needed)
- **Per-key override** via `_renderOverride` (follows the `_` prefix convention — skipped when exporting to KLE/QMK)
- **Parser** (`schema/types/renderStyle.js` → `resolveRenderStyle`) clamps every parameter to safe bounds and falls back to PBR for unimplemented modes
- **6 named presets** — `default`, `toon`, `lofi`, `flat`, `blueprint`, `pixel` — in `presets/renderStyles.js`

### Key Legends (3D Text)
- Troika SDF text rendered inside KeyboardModel
- 6 legend presets: GMK, Minimal, Retro, Top Print, Cyber, Blank
- Live editing: font size, weight, family, color, opacity
- **Position schema** (7 anchors: center, top/bottom × left/center/right)
  - Accepts legacy string form (`"top-left"`) or object form (`{ anchor, inset: { x, z } }`)
  - Inset clamped to `[0.02, 0.45]` fractional — anchor always stays inside the keycap, no overflow
  - Single `parseLegendPosition()` helper in `schema/derive.js` is the source of truth for both renderer and UI

### Layout Import (KLE)
- **Paste raw data** or **drop a `.json` file** from [keyboard-layout-editor.com](https://www.keyboard-layout-editor.com/)
- Monaco-editor preview with **Convert** button (graceful error display; modal stays open on failure)
- Parser tries strict `JSON.parse` first, then falls back to repairing raw-data-tab format (wrap brackets, quote bare keys, escape literal newlines inside strings)
- Each import gets a unique asset ref (`layout/kle-<timestamp>-<rand>@1`) and a timestamped `meta.name` — repeat imports never collide
- State engine sync: `registerBundled → layoutRefs list → active layoutRef → resolved layout` all update atomically

### Workspace Layout (Bento Card Flow)
- **Standalone route**: `/keyboardlab` with Logo header + minimal bottom nav
- **3D viewport** (left, 65%) + **sidebar** (right, 35%), resizable via drag handle
- **Toolbar**: New, Save, Saved dropdown (per-item delete + Clear All), Reload, Export, Import, Roadmap, Key Animation, Key Listen
- **Right panel**: scrollable vertical stack of **bento cards** — one per asset, each card owns its own state
  - Cards: **Design | Layout | Shell | Case Profile | Keycap | Legend**
  - Each card has a header row with title + per-card tabs (**Config / JSON / Doc**, plus Layout's 2D preview embedded in Config) + a collapse toggle
  - Cards start expanded; collapse ad-hoc to save vertical space
  - Clicking a tab on a collapsed card auto-expands it
- **Per-card JSON editors**: each card mounts its own Monaco instance only when its JSON tab is active; two-way sync via `handleJsonChange(value, tabType)`
- **Design card Refs**: two-column (key | value) display of all asset refs, color-coded to accent
- **2D Layout preview**: embedded inside Layout card's Config tab, auto-fits container width via ResizeObserver — never overflows
- **Number inputs** (not sliders): mount X/Y/Z, fit, scale, font size, opacities, legend inset — precise, keyboard-friendly
- **Theme-aware surfaces**: select/input backgrounds use `theme.background` so they don't look like hard black rectangles on light themes
- **Category titles**: accent color, 13px, bold, letter-spaced uppercase

### Design Persistence
- **Bundle format**: `eletypes-design-bundle/1` wraps design doc + all embedded assets
- **Save/Load**: custom dropdown with per-item delete and Clear All
- **Reload**: restore last saved state, discard unsaved changes
- **Export/Import**: JSON files in bundle format
- **Read-time migration**: auto-upgrades legacy formats
- **Default theme**: "le smoking" (dark keycaps, purple case, green legends)

### Localization (i18n)
- Separate translation system (`i18n/labTranslations.js`) — not mixed with main app
- `useLabTranslation()` hook reads global locale from `LocaleContext`
- Full EN/ZH translations for all UI strings
- ~90 translation keys

### Roadmap Modal
- Shimmer-bordered button in toolbar
- Three sections: Shipped / Coming Next / On the Horizon
- "From the maker" — editor's note with GitHub link
- Also embedded in Profile Modal (Keyboard Lab tab with beta badge)

### Banner & Navigation
- Header: Keyboard Lab button with beta badge next to name card
- Footer: DesignServicesIcon with beta badge in mode group
- Bottom nav: shared `MiniFooter` with bracketed monospace style (Back, Sound, Theme, Language)
- Banner announcement for beta launch

### Color Themes
10 presets: le smoking, midnight, ocean, sakura, forest, arctic, translucent, pudding, jelly, frosted

---

## 4. Markdown Editor

### Route: `/markdown`

Standalone markdown editor with live preview, replacing the old free typing mode.

- **Split view** (default): editor + live preview side by side
- **Editor only**: full-width with larger font
- **Preview only**: rendered markdown view
- **Syntax highlighting**: `react-syntax-highlighter` with oneDark theme
- **ASCII banner**: full block-letter "ELE TYPES" on desktop, compact box on mobile
- **Save .md**: download content as markdown file
- **Auto-focus**: editor focused on mount with accent-colored left border
- **Typing sounds**: plays selected sound on keypress
- **Localized**: EN/ZH button labels
- **Contained scroll**: editor and preview scroll within their panes, no page scroll
- **Bottom nav**: shared `MiniFooter` with sound toggle + type selector

---

## 5. File Structure

```
KeyboardLab/
├── schema/
│   ├── SCHEMA_SPEC.md                 ← Canonical V1 spec
│   ├── KEYCAP_ARCHITECTURE.md         ← Multi-schema design rationale
│   ├── boardLayout.js                 ← createPreset(), validatePreset()
│   ├── shellProfile.js               ← 5 shell presets (Standard, Slim, Wide, Angular, Top Heavy)
│   ├── derive.js                      ← computeBounds, buildKeyIndex, extractKeys
│   ├── index.js                       ← Barrel export
│   ├── types/
│   │   ├── layout.js                  ← eletypes-kbd/1
│   │   ├── keycap.js                  ← eletypes-cap/1
│   │   ├── visual.js                  ← eletypes-visual/1
│   │   ├── legend.js                  ← eletypes-legend/1
│   │   ├── shell.js                   ← eletypes-shell/1
│   │   ├── design.js                  ← eletypes-design/1 + eletypes-design-bundle/1
│   │   ├── profile.js                 ← eletypes-caseProfile/1
│   │   ├── renderStyle.js             ← eletypes-renderStyle/1 + resolveRenderStyle
│   │   └── normalized.js
│   ├── validation/
│   │   └── validate.js
│   ├── normalize/
│   │   ├── normalize.js               ← normalizeKeyboard()
│   │   └── resolveDesign.js           ← resolveDesign(), designFromSelections()
│   ├── resolve/
│   │   └── assetResolver.js           ← bundledResolver, listBundledAssets, parseAssetRef
│   └── examples/
│       ├── layout-75-ansi.json, keycap-cherry.json, etc.
├── presets/
│   ├── index.js                       ← Preset registry
│   ├── generic75.js, cyberboard75.js  ← 75% layouts
│   ├── layout60.js                    ← 60% ANSI (61 keys)
│   ├── layout65.js                    ← 65% ANSI (68 keys)
│   ├── layoutHHKB.js                  ← HHKB 60% (60 keys, 7u spacebar, split backspace)
│   ├── layoutTKL.js                   ← TKL 80% ANSI (87 keys)
│   ├── layoutFullSize.js              ← Full-size 100% ANSI (104 keys)
│   ├── keycaps.js                     ← Cherry, OEM, SA, MT3, KAT, DSA, XDA, Low Profile
│   ├── legends.js                     ← GMK, Minimal, Retro, Top Print, Cyber, Blank
│   ├── profiles.js                    ← Cyberboard Wedge, Flat Box, Chamfered Wedge, Ergonomic
│   └── renderStyles.js                ← default/toon/lofi/flat/blueprint/pixel render presets
├── CaseEditor/
│   ├── CaseProfileEditor.jsx          ← SVG 2D profile editor + edge accents
│   └── extrudeProfile.js             ← 2D→3D extrusion + mount surface + edge strips
├── services/
│   ├── designStorage.js              ← eletypes-design-bundle/1 persistence + migration
│   └── kleImporter.js                ← KLE JSON parser + validator (raw data tab & download file)
├── i18n/
│   ├── labTranslations.js            ← EN/ZH translations (~90 keys)
│   └── useLabTranslation.js          ← Hook: reads global locale, lab-specific keys
├── KeyboardLab.jsx                    ← Canvas wrapper, controls, lighting
├── KeyboardModel.jsx                  ← Split InstancedMesh + animation + legends + edge strips
├── KeycapGeometry.js                  ← Procedural tapered/dished keycap generator
├── KeyboardLayout2D.jsx              ← 2D DOM renderer + key inspector
├── KeyboardLabDemo.jsx               ← Full workspace: toolbar + 3D + sidebar + editors
├── KEYBOARD_LAB.md                    ← This document
└── PLATFORM_SPEC.md                   ← Open-source platform architecture spec

Pages (standalone routes):
├── src/pages/KeyboardLabPage.jsx      ← /keyboardlab route
├── src/pages/MarkdownPage.jsx         ← /markdown route

Shared components:
├── src/components/common/MiniFooter.jsx ← Bracketed bottom nav for standalone routes
```

---

## 6. Roadmap

### Completed
- [x] 3D keyboard visualization with InstancedMesh + spring animation
- [x] 7 layouts: 60%, 65%, HHKB 60%, 75% (×2), TKL, Full-size (all ANSI)
- [x] 8 keycap profiles: Cherry, OEM, SA, MT3, KAT, DSA, XDA, Low Profile
- [x] 5 shell presets: Standard, Slim, Wide Bezel, Angular, Top Heavy
- [x] 6 legend presets with live editing
- [x] **Legend position + inset schema** — `parseLegendPosition()` clamps inset to [0.02, 0.45] so anchors never overflow the keycap
- [x] Parametric case profile editor (4 presets + colored edge accents)
- [x] Per-group opacity (keycap, accent, case, legend)
- [x] Design bundle schema (eletypes-design-bundle/1) for local persistence
- [x] **KLE layout import** — paste raw data or drop `.json`, Monaco preview + Convert, unique timestamped refs
- [x] **Bento card UI** — per-asset collapsible cards with Config / JSON / Doc tabs; 2D preview auto-fits container
- [x] 10 color themes including le smoking
- [x] Monaco JSON editor (per-card, bidirectional sync, Doc tab)
- [x] Standalone /keyboardlab route with i18n (EN/ZH)
- [x] Roadmap modal + editor's note + GitHub link
- [x] Banner announcement + profile modal tab (beta)
- [x] Markdown editor at /markdown with live preview + syntax highlighting
- [x] Shared MiniFooter with bracketed monospace style
- [x] Key press sound support in keyboard lab
- [x] Markdown M↓ logo in footer nav

### Coming Next
- [ ] [P0] Online cloud save — upload & download designs
- [ ] [P1] Community gallery — browse, share & remix designs
- [ ] [P2] Drag & drop 2D layout editor — reposition keys freely
- [ ] [P3] Spline & Bézier curves for case profile sculpting — smooth organic shapes
- [ ] [P4] Eletypes typing test animation integration
- [ ] [P5] Render-style pipeline expansion — risograph (dither + channel offset), painterly, pixel, blueprint, x-ray; layer blend via two-pass compositor

### On the Horizon
- [ ] Stickers & decals on keycaps and case
- [ ] More visual effects: LED underglow, RGB lighting
- [ ] VIA layout import converter
- [ ] Extract core engine as @eletypes/keyboard-lab npm package

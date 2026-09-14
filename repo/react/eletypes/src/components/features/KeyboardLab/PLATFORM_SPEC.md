# Open Keyboard Design Asset Platform — Architecture Spec

---

## 1. Product Positioning

### What this is

An open-source, schema-driven platform for expressing, composing, and visualizing custom keyboard designs. It defines a family of standardized JSON schemas for keyboard design assets — layouts, keycap profiles, legends, colors, cases — and a normalization engine that composes them into renderer-ready models.

It is **not** a 3D demo. It is **not** a single app feature. It is a **design interchange system** — a protocol + runtime + asset library that any application can embed.

### Who it's for

| Audience | What they get |
|----------|---------------|
| **Keyboard enthusiasts** | Design, preview, and share keyboard builds without buying parts |
| **Keycap designers** | Define profiles and colorways as portable JSON, preview on any layout |
| **Keyboard vendors** | Showcase products with interactive 3D configurators, driven by the same schema |
| **App developers** | Embed keyboard visualization in typing apps, editor tools, e-commerce |
| **Community** | Share, remix, and compose designs through a standardized asset format |

### Relationship to Eletypes

Eletypes is the **first consumer**, not the owner. The platform should be packaged so that:

- Eletypes uses it as a dependency for its Keyboard Lab feature
- Other apps can use the same schemas and normalizer without Eletypes
- The asset library is independent of any single app

### Why open-source matters

Keyboard design is a community-driven culture. GMK colorways, KLE layouts, keycap IC renders — these all exist as informal, non-interoperable formats. A standardized open schema that anyone can read, write, validate, and render creates network effects:

- Designers publish assets once, consumers render them anywhere
- Community builds a shared asset library instead of fragmented one-offs
- Tooling improves for everyone (validators, converters, editors, renderers)

The value is in the standard, not in any single implementation.

---

## 2. System Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        Schema Layer                             │
│  eletypes-kbd/1  eletypes-cap/1  eletypes-legend/1              │
│  eletypes-visual/1  eletypes-shell/1  eletypes-design/1         │
│                                                                 │
│  Each schema is a JSON format spec with:                        │
│  • version identifier                                           │
│  • validation rules                                             │
│  • migration path from prior versions                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      Asset Library Layer                        │
│                                                                 │
│  Official assets:  layout/generic-75-ansi@1                     │
│                    keycap/cherry-classic@1                       │
│                    visual/botanical-dark@1                       │
│                                                                 │
│  Community assets: keycap/user-artisan-dragon@1                 │
│  Local assets:     layout/_local/my-custom-75@draft             │
│                                                                 │
│  Each asset: validated JSON document + asset ID + metadata      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   Design Composition Layer                       │
│                                                                 │
│  eletypes-design/1 document:                                    │
│  • references assets by ID                                      │
│  • adds local overrides (per-key, per-section)                  │
│  • represents one complete "keyboard build"                     │
│                                                                 │
│  This is what users create, save, share, and remix.             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    Normalization Layer                           │
│                                                                 │
│  Resolves: asset refs → full documents                          │
│  Merges:   base assets + design overrides                       │
│  Produces: NormalizedKeyboard (ephemeral render model)           │
│                                                                 │
│  Input:  design doc + asset resolver function                   │
│  Output: flat array of fully-resolved keys with geometry,       │
│          color, legend, cap, and case data                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
               ┌────▼───┐ ┌───▼───┐ ┌───▼────┐
               │  2D    │ │  3D   │ │ Export  │
               │ Editor │ │Viewer │ │ / API  │
               └────────┘ └───────┘ └────────┘
```

---

## 3. Asset ID and Reference Model

### Convention

```
{schema-type}/{asset-id}@{version}
```

Examples:
```
layout/generic-75-ansi@1
keycap/cherry-classic@1
keycap/artisan-dragon-esc@1
legend/gmk-center@1
visual/botanical-dark@1
shell/cyberboard-r3@1
```

### Rules

| Aspect | Rule |
|--------|------|
| **schema-type** | One of: `layout`, `keycap`, `legend`, `visual`, `shell`, `module` |
| **asset-id** | Lowercase alphanumeric + hyphens. Unique within schema-type. |
| **version** | Integer. `@1` is the first published version. Immutable once published. |
| **Draft** | Local/unpublished assets use `@draft` instead of a version number. |
| **Namespacing** | Community assets prefixed with author: `keycap/user-johndoe-artisan@1` |
| **Official** | No prefix: `keycap/cherry-classic@1` (curated by the project) |

### Local vs remote assets

| Type | Resolution |
|------|------------|
| **Bundled** | Shipped with the app/package. Resolved synchronously from an import map. |
| **Local** | User-created, stored in localStorage/IndexedDB. Prefixed `_local/`. |
| **Remote** | Fetched from an asset registry API. Cached locally after first fetch. |

The normalizer accepts an **asset resolver function**:

```js
const resolve = async (assetRef) => {
  // Check local cache → bundled → remote registry
  return assetDocument;
};

const normalized = await normalizeDesign(designDoc, resolve);
```

This makes the normalization layer transport-agnostic.

### Per-key asset references

Keys reference keycap assets via `capRef`:

```json
{ "id": "Escape", "capRef": "keycap/artisan-dragon-esc@1" }
```

The normalizer resolves this to the full keycap definition (procedural geometry or mesh reference). If unresolvable, falls back to the design's base keycap profile.

---

## 4. Schema Roadmap

### Now (implemented)

| Schema | Version | Status |
|--------|---------|--------|
| `eletypes-kbd/1` | Stable | Layout, board metadata, key placement |
| `eletypes-cap/1` | Stable | Keycap profiles, row sculpting, procedural + mesh caps |
| `eletypes-legend/1` | Stable | Legend font, size, color, position, per-key overrides |
| `eletypes-visual/1` | Stable | Colors, materials, per-key color overrides |

### Next (introduce now)

| Schema | Purpose | Why now |
|--------|---------|--------|
| **`eletypes-design/1`** | Composition document | This is the **user-facing object**. Without it, users must manually combine 4+ JSON files. The design doc is what gets saved, shared, and remixed. It's the product. |
| **`eletypes-shell/1`** | Case/shell identity | Already partially exists as `shellProfile.js`. Formalizing it as a schema makes cases a shareable asset type. |

### Later (defer)

| Schema | Purpose | Why later |
|--------|---------|-----------|
| `eletypes-module/1` | Knobs, LED bars, badges | No renderer support yet. Define when 3D module rendering exists. |
| `eletypes-material/1` | Detailed PBR material definitions | Current visual schema handles this well enough. Split when material complexity warrants it. |
| `eletypes-switch/1` | Switch types, force curves, sound profiles | Only matters for simulation/acoustic features. Very future. |

### Recommendation: introduce `eletypes-design/1` now

**Yes, it should be a first-class concept.** Here's why:

The design doc is the **primary user artifact**. Users don't think in terms of "I have a layout JSON and a keycap JSON and a visual JSON." They think "I have a keyboard design." The design doc is that concept reified:

```json
{
  "schema": "eletypes-design/1",
  "id": "my-daily-driver",
  "meta": {
    "name": "Daily Driver — Cyberboard Botanical",
    "author": "johndoe",
    "version": "3",
    "description": "Cyberboard R2 with Cherry caps, GMK Botanical colors, dragon artisan Esc"
  },
  "assets": {
    "layout": "layout/cyberboard-75-ansi@1",
    "keycap": "keycap/cherry-classic@1",
    "legend": "legend/gmk-center@1",
    "visual": "visual/botanical-dark@1",
    "shell": "shell/cyberboard-r3@1"
  },
  "overrides": {
    "keys": {
      "Escape": {
        "capRef": "keycap/artisan-dragon-esc@1",
        "legendColor": "#ff4444"
      }
    },
    "visual": {
      "keycapColor": "#2a3a2a"
    },
    "legend": {
      "fontSize": 24
    }
  }
}
```

This is clean, composable, and user-friendly. The normalizer resolves all `assets.*` references, applies `overrides.*`, and produces the render model.

---

## 5. Normalization Architecture

### Input → Output

```
Design Document
  + Asset Resolver (async function)
  → NormalizedKeyboard (ephemeral)
```

### Resolution pipeline

```
1. Parse design document
2. Resolve asset references:
   layout  = await resolve(design.assets.layout)
   keycap  = await resolve(design.assets.keycap)
   legend  = await resolve(design.assets.legend)
   visual  = await resolve(design.assets.visual)
   shell   = await resolve(design.assets.shell)  // optional
3. Apply design-level overrides:
   visual  = merge(visual, design.overrides.visual)
   legend  = merge(legend, design.overrides.legend)
4. For each key in layout:
   a. Resolve capRef:
      - key.capRef (from override) → key.capRef (from layout) → profile row default
      - Resolve capRef through asset resolver if it's an asset reference
   b. Resolve legend:
      - design.overrides.keys[id] → legend.keyOverrides[id] → legend.style defaults
   c. Resolve color:
      - design.overrides.keys[id] → visual.keyOverrides[id] → visual.colors[kind]
   d. Resolve cap geometry:
      - Named cap definition → or profile.rows[row] + profile.defaultCap
5. Produce NormalizedKey with all fields resolved
6. Return NormalizedKeyboard { board, keys[], shell? }
```

### Override precedence (most specific wins)

```
design.overrides.keys[id]     ← highest priority (user's per-key tweak)
  ↓
asset-level per-key overrides  ← e.g., visual.keyOverrides[id]
  ↓
asset-level defaults           ← e.g., visual.colors.alpha
  ↓
system defaults                ← e.g., kind="alpha" → color="#2a2a2e"
```

### Async resolution

Asset resolution is async because remote assets may need to be fetched. The normalizer signature:

```js
async function normalizeDesign(designDoc, resolver) → NormalizedKeyboard
```

For bundled/local assets, the resolver returns synchronously from an import map. For remote assets, it fetches and caches. The normalizer doesn't care — it just `await`s.

---

## 6. Open-Source Asset Library Model

### Structure

```
@eletypes/keyboard-schema     ← Schema definitions, validators, normalizer
@eletypes/keyboard-assets     ← Official bundled assets (layouts, profiles, etc.)
@eletypes/keyboard-viewer     ← 3D/2D renderers (React components)
@eletypes/keyboard-editor     ← Editor UI (React components)
```

### Official assets

Curated by the project. Validated against schemas. Published as JSON files in `@eletypes/keyboard-assets`:

```
assets/
  layout/
    generic-75-ansi.json
    generic-60-ansi.json
    cyberboard-75-ansi.json
  keycap/
    cherry-classic.json
    sa-classic.json
    dsa-uniform.json
  legend/
    gmk-center.json
    minimalist.json
  visual/
    botanical-dark.json
    midnight.json
  shell/
    generic-75.json
    cyberboard-r3.json
```

### Community assets

Published by users. Options:

1. **Pull request to the assets repo** — curated, reviewed, merged. High quality bar.
2. **User-hosted JSON** — anyone can host a valid asset JSON at any URL. The editor can import by URL.
3. **Future registry API** — a lightweight API (Supabase table) for browsing/searching community assets. Assets are validated on submit.

### Asset validation

Every asset is validated against its schema before:
- Being accepted into the official library
- Being imported into the editor
- Being resolved during normalization

Invalid assets produce clear error messages, not silent failures.

### Schema compatibility

The `schema` field on every document is the compatibility key:
- `eletypes-kbd/1` documents are always compatible with normalizers that understand `eletypes-kbd/1`
- When `eletypes-kbd/2` arrives, a migration function converts v1 → v2
- Normalizers can accept multiple schema versions and migrate on the fly

### Versioning

| Level | Mechanism |
|-------|-----------|
| **Schema format** | `schema: "eletypes-kbd/1"` — changed only on breaking changes |
| **Asset version** | `@1`, `@2` in asset ID — immutable once published, new version = new ID |
| **Document revision** | `meta.version` — user-controlled, informational only |

---

## 7. Roadmap

### Near-term (next 2-4 weeks)

**Goal: make the current feature shippable and the schema extractable.**

| Work package | What | Why |
|-------------|------|-----|
| **WP1: Design composition schema** | Implement `eletypes-design/1` with asset references + overrides | Users need a single saveable/shareable artifact |
| **WP2: Shell schema** | Formalize `eletypes-shell/1` from existing `shellProfile.js` | Makes cases a proper asset type |
| **WP3: Local persistence** | Save/load designs to localStorage/IndexedDB | Users lose work on refresh without this |
| **WP4: 2D editor drag** | Drag keys to reposition, update layout JSON in real-time | Core editor interaction |
| **WP5: JSON import/export** | Import asset JSON from file, export designs as JSON | Sharing foundation |

### Medium-term (1-3 months)

**Goal: extract into packages, build the asset library.**

| Work package | What |
|-------------|------|
| **WP6: Package extraction** | Extract `@eletypes/keyboard-schema` and `@eletypes/keyboard-assets` as npm packages |
| **WP7: Asset registry** | Supabase-backed asset browser (search, filter, preview) |
| **WP8: More layouts** | 60%, 65%, TKL, full, ISO variants |
| **WP9: More profiles** | OEM, MT3, KAT, low-profile, uniform Cherry (Cherry R3) |
| **WP10: Eletypes integration** | TypeBox → triggerKey bridge, theme-aware defaults |
| **WP11: Mesh keycap import** | GLB upload → register as keycap asset → assign via capRef |

### Long-term (3-6 months)

**Goal: ecosystem growth, community contributions.**

| Work package | What |
|-------------|------|
| **WP12: Community asset submissions** | PR-based contribution flow with schema validation CI |
| **WP13: Design sharing** | Shareable URLs, OG preview images, embed codes |
| **WP14: KLE import** | Convert Keyboard Layout Editor JSON → eletypes-kbd/1 |
| **WP15: Module schema** | Knobs, LED bars, badges as positionable modules |
| **WP16: Collaborative editing** | Real-time multi-user design sessions |

---

## 8. Execution Spec — Next Implementation Phase

### What to build next (WP1-WP3)

#### WP1: Design Composition Schema

**File:** `schema/types/design.js`

```js
// eletypes-design/1
{
  schema: "eletypes-design/1",
  id: string,
  meta: { name, author?, version?, description? },
  assets: {
    layout: string,    // asset ref: "layout/generic-75-ansi@1"
    keycap?: string,   // "keycap/cherry-classic@1"
    legend?: string,   // "legend/gmk-center@1"
    visual?: string,   // "visual/botanical-dark@1"
    shell?: string,    // "shell/cyberboard-r3@1"
  },
  overrides?: {
    keys?: Record<string, KeyOverride>,
    visual?: Partial<VisualColors>,
    legend?: Partial<LegendStyle>,
  }
}
```

**File:** `schema/normalize/resolveDesign.js`

Async normalizer that resolves asset references:

```js
export async function resolveDesign(designDoc, resolver) {
  const layout = await resolver(designDoc.assets.layout);
  const keycap = designDoc.assets.keycap ? await resolver(designDoc.assets.keycap) : null;
  // ... resolve all refs
  // ... apply overrides
  return normalizeKeyboard(layout, keycap, visual, legend);
}
```

**File:** `schema/resolve/assetResolver.js`

Bundled resolver that maps asset refs to imported presets:

```js
const BUNDLED = {
  "layout/generic-75-ansi@1": () => import("../../presets/generic75"),
  "keycap/cherry-classic@1": () => import("../../presets/keycaps").then(m => m.CHERRY_PROFILE),
  // ...
};

export async function bundledResolver(assetRef) {
  const loader = BUNDLED[assetRef];
  if (!loader) throw new Error(`Unknown asset: ${assetRef}`);
  const mod = await loader();
  return mod.default || mod;
}
```

#### WP2: Shell Schema

**File:** `schema/types/shell.js`

Formalize the existing `shellProfile.js` into `eletypes-shell/1`:

```js
{
  schema: "eletypes-shell/1",
  id: string,
  meta: { name },
  case: { paddingTop, paddingBottom, paddingLeft, paddingRight, cornerRadius, height, tilt },
  plate: { inset, height, color },
  modules?: [{ type, position, ... }]
}
```

Move `DEFAULT_SHELL` and `CYBERBOARD_SHELL` into `presets/shells.js` as proper schema documents.

#### WP3: Local Persistence

**File:** `services/designStorage.js`

```js
export function saveDesign(design) // → localStorage
export function loadDesign(id) // → design doc
export function listDesigns() // → [{ id, name, updated }]
export function deleteDesign(id)
```

Designs stored as `eletypes-design/1` JSON in localStorage, keyed by `design.id`.

### What to postpone

| Concern | Why defer |
|---------|-----------|
| Remote asset registry | No community assets exist yet. Bundled + local is enough. |
| Module schema | No renderer support. Define when 3D module rendering exists. |
| Material schema | Visual schema handles it. Split when PBR complexity warrants it. |
| KLE import | Nice-to-have, not blocking core functionality. |
| Collaborative editing | Requires backend infra beyond current scope. |

### Package boundaries

| Package | Contains | Status |
|---------|----------|--------|
| `core` (future `@eletypes/keyboard-schema`) | Schema types, validators, normalizer, derive functions | Lives in `schema/` now. Extract when publishing. |
| `assets` (future `@eletypes/keyboard-assets`) | Official preset JSON documents | Lives in `presets/` now. Extract when publishing. |
| `viewer` (future `@eletypes/keyboard-viewer`) | KeyboardModel, KeycapGeometry, KeycapLabels, KeyboardLab | Lives in `KeyboardLab/` now. Extract when publishing. |
| `editor` (future `@eletypes/keyboard-editor`) | KeyboardLayout2D, KeyboardLabDemo, editor UI | Lives in `KeyboardLab/` now. Extract when publishing. |

Don't extract prematurely. Extract when:
1. A second consumer exists (not just Eletypes)
2. The API surface is stable
3. The schema versions are frozen

---

## 9. Risks and Boundary Decisions

### Risk 1: Too many schemas too early

**Mitigation:** Only 6 schemas total (kbd, cap, legend, visual, shell, design). Each serves a distinct user action ("I want to change the keycap profile" → cap schema. "I want to change the colors" → visual schema). If two schemas always change together, merge them.

**Rule:** Don't create a new schema unless a user can independently choose to swap one instance of it without touching anything else.

### Risk 2: Overfitting to Eletypes

**Mitigation:** The schemas don't reference Eletypes anywhere. No `eletypes-theme` color dependency in the schema layer. The normalizer doesn't know about React or Three.js. Eletypes-specific integration lives in the viewer/editor layer, not in the schema/asset layer.

**Test:** Can a CLI tool validate and normalize a design doc without importing React? If yes, the boundary is clean.

### Risk 3: Mixing runtime state with persisted state

**Rule (already enforced):**

| Persisted | Runtime |
|-----------|---------|
| Key positions, sizes, identities | Selection state, active pressed keys |
| Asset references | Resolved asset documents |
| Overrides | Animation offsets, velocities |
| Design metadata | Camera position, UI panel state |

The design doc is what gets saved. Everything else is derived or ephemeral.

### Risk 4: Layout schema depending on mesh details

**Already prevented:** `capRef` is the only bridge. Layout never contains `meshPath`, `geometry`, or renderer-specific fields. The keycap schema owns mesh references. The normalizer resolves them.

### Risk 5: Premature marketplace complexity

**Decision:** No marketplace in the near term. The progression is:

1. Bundled official assets (now)
2. JSON import/export by file (WP5)
3. Community PR submissions to the assets repo (medium-term)
4. Registry API for browsing/search (long-term)

Don't build infrastructure for problems that don't exist yet.

### Risk 6: Asset reference resolution performance

**Mitigation:** Bundled assets resolve synchronously from an import map. Local assets resolve from IndexedDB (fast). Remote assets are fetched once and cached. The normalizer runs once when the design changes, not per-frame. At 84 keys with ~5 asset references, resolution time is negligible.

### Boundary decision: design doc is the product

The biggest architectural decision: **the design doc (`eletypes-design/1`) is the primary user artifact.** Everything else (layout, keycap, legend, visual, shell) is a reusable building block.

Users save designs, not layouts.
Users share designs, not keycap presets.
Users remix designs, not visual themes.

The individual asset schemas are the vocabulary. The design schema is the sentence. This is the correct product framing.

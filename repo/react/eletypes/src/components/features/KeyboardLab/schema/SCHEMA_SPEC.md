# Eletypes Keyboard Layout Schema — Canonical V1

**Schema identifier:** `eletypes-kbd/1`

---

## A. Types

```typescript
// ─── Top-level preset ───

interface KeyboardPreset {
  schema: "eletypes-kbd/1";       // Format identity. Parsers branch on this.
  meta: PresetMeta;               // Document-level metadata (who, when, what revision)
  board: BoardSpec;               // Keyboard-level specs (what kind of board)
  layout: LayoutData;             // Key placement data (the actual keys)
  visual?: VisualHints;           // Optional styling suggestions (colors, theme)
}

// ─── Meta: document metadata ───

interface PresetMeta {
  name: string;                   // Required. Display name.
  author?: string;                // Creator.
  version?: string;               // Document revision (e.g., "1.0", "draft"). NOT the schema version.
  created?: string;               // ISO 8601 date.
  description?: string;           // Human-readable.
}

// ─── Board: keyboard-level specs ───

interface BoardSpec {
  id: string;                     // Required. Stable board identity (e.g., "generic-75-ansi").
                                  // Survives edits, used for linking presets/shells/overrides.
  formFactor: FormFactor;         // Required. Physical size class.
  layoutStagger: LayoutStagger;   // Required. Key arrangement style.
  standard: Standard;             // Required. Regional standard.
  width: number;                  // Required. Bounding width of key field in key-units.
  height: number;                 // Required. Bounding height of key field in key-units.
  keyboardType?: KeyboardType;    // Physical switch type.
  unitSize?: number;              // Physical mm per 1u. Default 19.05. Used by renderers needing real-world scale.
  casePreset?: string;            // Shell profile id to pair with (e.g., "cyberboard-r3").
  modules?: BoardModule[];        // Future: knob, LED bar, badge, etc.
}

type FormFactor = "40%" | "60%" | "65%" | "75%" | "TKL" | "full" | "1800" | "Alice" | "split";
type LayoutStagger = "row-staggered" | "ortholinear" | "columnar" | "split" | "ergonomic";
type Standard = "ANSI" | "ISO" | "JIS";
type KeyboardType = "mechanical" | "membrane" | "optical" | "topre" | "hall-effect";

interface BoardModule {
  type: string;                   // e.g., "knob", "led-bar", "badge"
  position: string;               // e.g., "top-right", "bottom-center"
  [key: string]: unknown;         // Module-specific data
}

// ─── Layout: key placement data ───

interface LayoutData {
  keys: KeyDef[];                 // Required. The keys.
}

// ─── Key definition ───
// All geometry fields are flat on the key object.
// Semantic annotations (kind, cluster) are also flat.
// This is intentional: flat keys are the easiest to edit, diff, persist, and undo/redo.

interface KeyDef {
  // ── Identity (required) ──
  id: string;                     // Stable unique id within this layout. Survives edits.
                                  // Used for selection state, undo/redo, and linking.
                                  // Convention: use KeyboardEvent.code (e.g., "KeyA").
  keyName: string;                // Logical key identity = KeyboardEvent.code.
                                  // Used by triggerKey() and input bridging.
  label: string;                  // Keycap display text. "" for blank (e.g., Space).

  // ── Geometry (required except h) ──
  x: number;                      // X position in key-units, top-left corner.
  y: number;                      // Y position in key-units, top-left corner.
  w: number;                      // Width in key-units.
  h?: number;                     // Height in key-units. Default 1.

  // ── Transform (optional) ──
  r?: number;                     // Rotation in degrees. Default 0.
  rx?: number;                    // Rotation origin X (in key-units, relative to key). Default w/2.
  ry?: number;                    // Rotation origin Y. Default h/2.

  // ── Annotations (optional, flat) ──
  kind?: KeyKind;                 // Visual/semantic category. Default "alpha".
  cluster?: string;               // Grouping hint for editor/highlighting. Free string.
  profile?: number;               // Row profile index (0=top, 4=bottom) for sculpted keycaps.
}

type KeyKind = "alpha" | "mod" | "accent" | "fn" | "nav" | "arrow";

// ─── Visual: optional styling hints ───
// Loosely typed. Renderers may ignore entirely.
// This is where theme/colorway data lives, NOT in the layout.

interface VisualHints {
  keycapColor?: string;           // CSS color for regular keycaps.
  accentColor?: string;           // CSS color for accent keys.
  caseColor?: string;             // CSS color for keyboard case.
  legendColor?: string;           // CSS color for key labels.
  theme?: string;                 // Named theme hint (e.g., "gmk-laser", "cyberboard-dark").
}
```

---

## B. Zod Schema

```typescript
import { z } from "zod";

const FormFactor = z.enum(["40%", "60%", "65%", "75%", "TKL", "full", "1800", "Alice", "split"]);
const LayoutStagger = z.enum(["row-staggered", "ortholinear", "columnar", "split", "ergonomic"]);
const Standard = z.enum(["ANSI", "ISO", "JIS"]);
const KeyboardType = z.enum(["mechanical", "membrane", "optical", "topre", "hall-effect"]);
const KeyKind = z.enum(["alpha", "mod", "accent", "fn", "nav", "arrow"]);

const BoardModule = z.object({
  type: z.string(),
  position: z.string(),
}).passthrough();

const KeyDef = z.object({
  id: z.string(),
  keyName: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive().default(1),
  r: z.number().default(0),
  rx: z.number().optional(),
  ry: z.number().optional(),
  kind: KeyKind.default("alpha"),
  cluster: z.string().optional(),
  profile: z.number().optional(),
});

const KeyboardPreset = z.object({
  schema: z.literal("eletypes-kbd/1"),
  meta: z.object({
    name: z.string(),
    author: z.string().optional(),
    version: z.string().optional(),
    created: z.string().optional(),
    description: z.string().optional(),
  }),
  board: z.object({
    id: z.string(),
    formFactor: FormFactor,
    layoutStagger: LayoutStagger,
    standard: Standard,
    width: z.number().positive(),
    height: z.number().positive(),
    keyboardType: KeyboardType.optional(),
    unitSize: z.number().positive().default(19.05),
    casePreset: z.string().optional(),
    modules: z.array(BoardModule).optional(),
  }),
  layout: z.object({
    keys: z.array(KeyDef).nonempty(),
  }),
  visual: z.object({
    keycapColor: z.string().optional(),
    accentColor: z.string().optional(),
    caseColor: z.string().optional(),
    legendColor: z.string().optional(),
    theme: z.string().optional(),
  }).optional(),
});
```

---

## C. JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "eletypes-kbd-v1",
  "title": "Eletypes Keyboard Preset",
  "type": "object",
  "required": ["schema", "meta", "board", "layout"],
  "properties": {
    "schema": { "const": "eletypes-kbd/1" },
    "meta": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": { "type": "string" },
        "author": { "type": "string" },
        "version": { "type": "string" },
        "created": { "type": "string", "format": "date-time" },
        "description": { "type": "string" }
      }
    },
    "board": {
      "type": "object",
      "required": ["id", "formFactor", "layoutStagger", "standard", "width", "height"],
      "properties": {
        "id": { "type": "string" },
        "formFactor": { "enum": ["40%", "60%", "65%", "75%", "TKL", "full", "1800", "Alice", "split"] },
        "layoutStagger": { "enum": ["row-staggered", "ortholinear", "columnar", "split", "ergonomic"] },
        "standard": { "enum": ["ANSI", "ISO", "JIS"] },
        "width": { "type": "number", "exclusiveMinimum": 0 },
        "height": { "type": "number", "exclusiveMinimum": 0 },
        "keyboardType": { "enum": ["mechanical", "membrane", "optical", "topre", "hall-effect"] },
        "unitSize": { "type": "number", "default": 19.05 },
        "casePreset": { "type": "string" },
        "modules": { "type": "array", "items": { "type": "object" } }
      }
    },
    "layout": {
      "type": "object",
      "required": ["keys"],
      "properties": {
        "keys": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "required": ["id", "keyName", "label", "x", "y", "w"],
            "properties": {
              "id": { "type": "string" },
              "keyName": { "type": "string" },
              "label": { "type": "string" },
              "x": { "type": "number" },
              "y": { "type": "number" },
              "w": { "type": "number", "exclusiveMinimum": 0 },
              "h": { "type": "number", "exclusiveMinimum": 0, "default": 1 },
              "r": { "type": "number", "default": 0 },
              "rx": { "type": "number" },
              "ry": { "type": "number" },
              "kind": { "enum": ["alpha", "mod", "accent", "fn", "nav", "arrow"], "default": "alpha" },
              "cluster": { "type": "string" },
              "profile": { "type": "number" }
            }
          }
        }
      }
    },
    "visual": {
      "type": "object",
      "properties": {
        "keycapColor": { "type": "string" },
        "accentColor": { "type": "string" },
        "caseColor": { "type": "string" },
        "legendColor": { "type": "string" },
        "theme": { "type": "string" }
      }
    }
  }
}
```

---

## D. Revised Example JSON

```json
{
  "schema": "eletypes-kbd/1",
  "meta": {
    "name": "Generic 75% ANSI",
    "author": "eletypes",
    "version": "1.0",
    "description": "Standard 75% ANSI layout, Keychron Q1 / GMMK Pro style"
  },
  "board": {
    "id": "generic-75-ansi",
    "formFactor": "75%",
    "layoutStagger": "row-staggered",
    "standard": "ANSI",
    "width": 16.25,
    "height": 6.25,
    "keyboardType": "mechanical",
    "unitSize": 19.05
  },
  "layout": {
    "keys": [
      { "id": "Escape", "keyName": "Escape", "label": "Esc", "x": 0, "y": 0, "w": 1, "kind": "accent", "cluster": "fn-row" },
      { "id": "KeyA",   "keyName": "KeyA",   "label": "A",   "x": 1.75, "y": 3.25, "w": 1, "kind": "alpha", "cluster": "alpha" },
      { "id": "Space",  "keyName": "Space",  "label": "",    "x": 3.75, "y": 5.25, "w": 6.25, "kind": "accent", "cluster": "bottom-row" }
    ]
  }
}
```

---

## E. Migration from current draft

Changes from `eletypes-board/1` → `eletypes-kbd/1`:

| Old field | New field | Change |
|-----------|-----------|--------|
| `board.layoutType` | `board.formFactor` | Renamed. "75%" stays, but semantics clarified. |
| — | `board.layoutStagger` | New required field. Almost always "row-staggered" for standard keyboards. |
| `board.unit` | `board.unitSize` | Renamed for clarity. Was storing mm value under `unit`. |
| — | `board.id` | New required field. Stable board identity. |
| `board.standard` | `board.standard` | Unchanged. |
| `board.keyboardType` | `board.keyboardType` | Unchanged, still optional. |
| `visual.accentColor` | `visual.accentColor` | Unchanged. |
| Key `code` field | Removed | Was redundant with `keyName`. Use `keyName` for KeyboardEvent.code. |
| Key `h: 1` explicit | `h` optional | Omit if 1 (default). No more noisy `h: 1` on every key. |
| Key `r: 0` explicit | `r` optional | Omit if 0 (default). No more noisy `r: 0`. |
| Key `cluster: null` | `cluster` optional | Omit if absent. No more `null` values. |
| Key `profile: null` | `profile` optional | Omit if absent. |

---

## F. Migration function

```javascript
function migrateToV1(old) {
  return {
    schema: "eletypes-kbd/1",
    meta: { ...old.meta },
    board: {
      id: old.board?.id || old.meta?.name?.toLowerCase().replace(/\s+/g, "-") || "migrated",
      formFactor: old.board?.layoutType || "75%",
      layoutStagger: "row-staggered",
      standard: old.board?.standard || "ANSI",
      width: old.board?.width,
      height: old.board?.height,
      ...(old.board?.keyboardType && { keyboardType: old.board.keyboardType }),
      ...(old.board?.unit && { unitSize: old.board.unit }),
      ...(old.board?.casePreset && { casePreset: old.board.casePreset }),
      ...(old.board?.modules?.length && { modules: old.board.modules }),
    },
    layout: {
      keys: (old.layout?.keys || []).map((k) => {
        const key = { id: k.id, keyName: k.keyName || k.id, label: k.label, x: k.x, y: k.y, w: k.w };
        if (k.h && k.h !== 1) key.h = k.h;
        if (k.r && k.r !== 0) key.r = k.r;
        if (k.kind && k.kind !== "alpha") key.kind = k.kind;
        if (k.cluster) key.cluster = k.cluster;
        if (k.profile != null) key.profile = k.profile;
        return key;
      }),
    },
    ...(old.visual && { visual: old.visual }),
  };
}
```

---

## G. Product / architecture notes

### Why flat key objects are correct for V1

The temptation is to split `KeyDef` into `{ geometry: { x, y, w, h, r }, identity: { id, keyName, label }, annotations: { kind, cluster, profile } }`. **Don't.**

Flat keys are:
- **Easiest to edit**: `key.x += 0.25` vs `key.geometry.x += 0.25`
- **Easiest to diff**: one-level-deep JSON diff catches all changes
- **Easiest to undo/redo**: store/restore a single key object, not nested sub-objects
- **Easiest to persist**: one `layout.keys[i]` write, not cross-referencing multiple structures

Nested sub-objects add zero value when the data is already small per key (~8 fields) and every field is leaf-level (no arrays, no further nesting).

### How 2D editing → 3D hot re-render works

1. User drags a key in 2D editor → updates `key.x` / `key.y` in `layout.keys[i]`
2. Editor calls `setPreset(updatedPreset)` → React state change
3. `KeyboardModel` receives new `layout` prop → `useMemo` recomputes `restPositions`
4. `useEffect` fires → rebuilds all instance matrices from new positions
5. Calls `invalidate()` → single GPU frame renders the change

This is fast because:
- Only the changed keys' matrices need recomputing (though V1 rebuilds all — fine for 84 keys, optimize later if needed)
- No new geometry/material created
- `InstancedMesh` matrix update is a single `bufferAttribute.needsUpdate = true`

### What stays in schema vs app runtime state

| In schema (persisted) | In app state (ephemeral) |
|----------------------|--------------------------|
| `key.x`, `key.y`, `key.w`, `key.h` | Selection state (which key is selected) |
| `key.kind`, `key.cluster` | Active keys (which keys are pressed) |
| `board.id`, `board.formFactor` | Camera position, zoom |
| `visual.keycapColor` | Animation state (spring offsets, velocities) |
| `meta.name`, `meta.version` | UI state (which panel is open, which tab) |

### Future preset overrides — what V1 should reserve, not implement

**The problem**: user wants a "Cyberboard R3 — Dracula Edition" that's the generic 75% layout but with a few keys shifted 0.1u and different colors.

**V1 answer**: just copy the preset and edit the copy. Presets are self-contained. This is simple, diffable, and undo-friendly.

**Future (V2) answer**: introduce a `basePreset` reference + `overrides` array:
```json
{
  "schema": "eletypes-kbd/2",
  "basePreset": "generic-75-ansi@1.0",
  "overrides": {
    "meta": { "name": "Dracula Edition" },
    "visual": { "keycapColor": "#282a36", "accentColor": "#bd93f9" },
    "keyOverrides": [
      { "id": "Escape", "x": 0.1 }
    ]
  }
}
```

**V1 extension points reserved**: the `schema` version string and `board.id` are sufficient. A V2 parser can detect `eletypes-kbd/2` and handle `basePreset` + `overrides`. V1 presets remain valid V2 presets (no `basePreset` = self-contained).

### Versioning: schema vs meta.version

- **`schema: "eletypes-kbd/1"`** — format version. Parsers branch on this. Changed only when the schema structure changes (new required fields, renamed fields, breaking changes). The contract between producer and consumer.
- **`meta.version: "1.0"`** — document revision. Changed by the user when they update their layout. No programmatic meaning — purely for human tracking. Optional.

These are independent. A schema V1 document can be at meta version "47.3" if the user has edited it 47 times.

### Undo/redo friendliness

The flat key structure means undo/redo is trivial:
- **Undo stack**: store snapshots of `layout.keys` (or diffs of individual keys)
- **Key identity**: `key.id` is stable across edits (never changes when x/y/w changes)
- **Granularity**: each user action (drag, resize, relabel) produces one diff entry
- **No cascading**: editing one key's position never requires updating another key's data

### Diffability

Two presets can be compared with a simple JSON diff. Flat keys mean one-line-per-change diffs. No nested structure to navigate. This matters for: version control, conflict resolution, and future collaborative editing.

---

## H. Required vs optional — explicit summary

### Top level
| Field | Required? |
|-------|-----------|
| `schema` | **Required** |
| `meta` | **Required** |
| `board` | **Required** |
| `layout` | **Required** |
| `visual` | Optional |

### Meta
| Field | Required? |
|-------|-----------|
| `name` | **Required** |
| `author` | Optional |
| `version` | Optional |
| `created` | Optional |
| `description` | Optional |

### Board
| Field | Required? |
|-------|-----------|
| `id` | **Required** |
| `formFactor` | **Required** |
| `layoutStagger` | **Required** |
| `standard` | **Required** |
| `width` | **Required** |
| `height` | **Required** |
| `keyboardType` | Optional |
| `unitSize` | Optional (default 19.05) |
| `casePreset` | Optional |
| `modules` | Optional |

### Key
| Field | Required? | Default |
|-------|-----------|---------|
| `id` | **Required** | — |
| `keyName` | **Required** | — |
| `label` | **Required** | — |
| `x` | **Required** | — |
| `y` | **Required** | — |
| `w` | **Required** | — |
| `h` | Optional | 1 |
| `r` | Optional | 0 |
| `rx` | Optional | w/2 |
| `ry` | Optional | h/2 |
| `kind` | Optional | "alpha" |
| `cluster` | Optional | — |
| `profile` | Optional | — |

# Multi-Schema Architecture: Layout + Keycap + Visual

---

## 1. Architecture Recommendation

### The problem with embedding profile in layout

The current schema has `profile?: number` on each key. This is fine for "row 2 is sculpted differently from row 4" but it collapses several distinct concerns:

- **What profile family?** (Cherry, SA, DSA — these have totally different shapes)
- **What row within that family?** (Cherry R1 vs R4 are subtly different; DSA is uniform)
- **What keycap variant?** (standard, homing bar, deep dish, artisan, custom mesh)
- **What material/color?** (this leaks into visual, not geometry)

Embedding all of this into the layout schema means:
- Layout JSON grows with rendering concerns
- Changing profile family requires touching every key
- Custom mesh caps need asset paths in the layout — wrong layer
- 2D editor must understand 3D geometry concepts it doesn't need

### The solution: three independent schemas + a normalization layer

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Layout     │   │   Keycap     │   │   Visual     │
│   Schema     │   │   Schema     │   │   Schema     │
│              │   │              │   │              │
│ • board meta │   │ • profile    │   │ • colors     │
│ • key place  │   │   family     │   │ • legends    │
│ • key size   │   │ • row rules  │   │ • materials  │
│ • key id     │   │ • cap defs   │   │ • theme      │
│ • capRef     │   │ • mesh refs  │   │              │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                   │
       └──────────┬───────┘───────────────────┘
                  │
          ┌───────▼────────┐
          │  Normalization  │
          │     Layer       │
          │                │
          │  Resolves refs  │
          │  Merges schemas │
          │  Produces       │
          │  render-ready   │
          │  model          │
          └────────────────┘
                  │
       ┌──────────┼──────────┐
       │          │          │
   ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
   │  2D  │  │  3D  │  │Export│
   │Editor│  │Render│  │ JSON │
   └──────┘  └──────┘  └──────┘
```

**Why this is better:**
- Layout stays clean for 2D editing (no mesh paths, no geometry details)
- Swapping profile family is one reference change, not 84 key edits
- Custom mesh caps are a keycap concern, not a layout concern
- Visual theming is independent of both — same layout + same caps, different colors
- Each schema is independently shareable/importable

### Why keycap modeling before case modeling

Users can produce meaningful design output with just layout + keycaps:
- "Here's my 75% with Cherry profile and a custom artisan Escape"
- "Same layout but with SA caps — see how the visual weight changes"
- "DSA uniform profile for my travel board"

This doesn't require a case model at all. The 3D renderer already has a generic case from the shell profile. Keycap variation is what makes keyboards personal.

Case modeling matters when:
- Users want to simulate specific board shells (Cyberboard, Keychron, etc.)
- LED integration needs case geometry
- Acoustic simulation (future, unlikely near-term)

None of these are blocking for the core editor experience. Keycaps are.

---

## 2. TypeScript Types

### Layout Schema (unchanged from eletypes-kbd/1, with one addition: `capRef`)

```typescript
interface KeyDef {
  // Identity
  id: string;
  keyName: string;
  label: string;

  // Geometry
  x: number;
  y: number;
  w: number;
  h?: number;              // default 1
  r?: number;              // rotation degrees
  rx?: number;
  ry?: number;

  // Annotations
  kind?: KeyKind;
  cluster?: string;

  // ── NEW: abstract keycap reference ──
  capRef?: string;          // References a cap definition in the keycap schema.
                            // If absent, the normalization layer assigns from
                            // the profile family's row rules based on key position.
                            // Examples: "artisan-dragon", "custom-esc", "sa-r1-deep"
}
```

**Design decision: `capRef` is optional and abstract.**
- Most keys don't need it — the profile family's row rules handle them automatically
- Only special keys (artisans, custom caps, homing bars) need explicit `capRef`
- The layout never contains mesh paths or geometry parameters

### Keycap Schema

```typescript
// ─── Top-level keycap preset ───

interface KeycapPreset {
  schema: "eletypes-cap/1";
  id: string;                     // e.g., "cherry-profile", "sa-r3-custom"
  meta: {
    name: string;                 // "Cherry Profile"
    author?: string;
    version?: string;
    description?: string;
  };

  // Profile family: the default cap shape system
  profile: ProfileFamily;

  // Named cap definitions: special caps referenced by capRef
  caps?: Record<string, CapDefinition>;
}

// ─── Profile family: row-based sculpting system ───

interface ProfileFamily {
  id: string;                     // "cherry", "sa", "dsa", "xda", "oem", "mt3", "low-profile"
  name: string;                   // "Cherry MX"
  uniform: boolean;               // true = all rows same shape (DSA, XDA). false = sculpted.

  // Row sculpting rules (only meaningful when uniform=false)
  // Maps row index (0=top, 5=bottom) to sculpting parameters
  rows?: Record<number, RowSculpt>;

  // Default cap geometry (used when no row-specific override exists)
  defaultCap: CapGeometry;
}

// ─── Row sculpting parameters ───

interface RowSculpt {
  topAngle: number;               // degrees — top surface tilt (negative = tilted toward user)
  height: number;                 // cap height relative to base (1.0 = standard)
  depth: number;                  // dish depth (0 = flat, 0.5 = deep scoop)
}

// ─── Cap definition: either procedural or mesh-backed ───

interface CapDefinition {
  id: string;                     // Referenced by capRef in layout
  name: string;                   // "Dragon Artisan Escape"
  type: "procedural" | "mesh";

  // For procedural caps
  geometry?: CapGeometry;

  // For mesh-backed caps
  mesh?: MeshReference;

  // Optional: which key sizes this cap fits (1u, 2u, 6.25u, etc.)
  // If absent, assumed to fit any size
  fitSizes?: number[];

  // Optional: tags for filtering in UI
  tags?: string[];                // ["artisan", "novelty", "homing"]
}

// ─── Procedural cap geometry ───

interface CapGeometry {
  topWidth: number;               // Top surface width as ratio of bottom (0.85 = tapered)
  topDepth: number;               // Top surface depth as ratio of bottom
  height: number;                 // Cap height in key-units (e.g., 0.4)
  cornerRadius: number;           // Bevel radius
  dishType: "cylindrical" | "spherical" | "flat" | "saddle";
  dishDepth: number;              // How deep the dish scoops (0 = flat top)
  stemType?: "mx" | "alps" | "topre" | "choc";
}

// ─── Mesh-backed cap reference ───

interface MeshReference {
  format: "glb" | "obj" | "stl";
  url: string;                    // Relative or absolute URL to the mesh asset
  scale?: number;                 // Scale factor (default 1.0)
  rotationOffset?: [number, number, number];  // Euler angles to align mesh
  originOffset?: [number, number, number];    // Position offset from key center
}
```

### Visual Schema

```typescript
interface VisualPreset {
  schema: "eletypes-visual/1";
  id: string;                     // "gmk-laser", "botanical", "minimal-dark"
  meta: {
    name: string;
    author?: string;
  };

  // Key colors
  colors: {
    alpha?: string;               // Regular key color
    accent?: string;              // Accent key color
    mod?: string;                 // Modifier key color (optional, falls back to accent)
    fn?: string;                  // Function key color
    legend?: string;              // Legend/label text color
    legendAccent?: string;        // Legend color on accent keys
  };

  // Case colors (used by 3D renderer, ignored by 2D)
  case?: {
    primary?: string;
    accent?: string;
  };

  // Material hints (3D only)
  material?: {
    keycapFinish?: "matte" | "glossy" | "textured";
    keycapRoughness?: number;     // 0-1
    keycapMetalness?: number;     // 0-1
    caseFinish?: "anodized" | "polished" | "matte" | "cerakote";
  };

  // Per-key color overrides (sparse — only keys that differ from base)
  keyOverrides?: Record<string, {
    color?: string;
    legendColor?: string;
  }>;
}
```

### Normalized Render Model (output of the normalization layer)

```typescript
// This is what the 2D and 3D renderers actually consume.
// Produced by merging layout + keycap + visual schemas.
// Never persisted — always derived at runtime.

interface NormalizedKeyboard {
  board: BoardSpec;               // From layout schema

  keys: NormalizedKey[];          // Fully resolved keys

  case?: {                        // From shell profile (if present)
    // ... case geometry
  };
}

interface NormalizedKey {
  // From layout
  id: string;
  keyName: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;

  // From keycap resolution
  cap: ResolvedCap;

  // From visual resolution
  color: string;
  legendColor: string;

  // Annotations (passthrough)
  kind: KeyKind;
  cluster?: string;
}

interface ResolvedCap {
  type: "procedural" | "mesh";
  geometry?: CapGeometry;         // For procedural caps
  mesh?: MeshReference;           // For mesh caps
  sculpt?: RowSculpt;            // Row-specific sculpting
  profileFamily: string;          // Which profile this came from
}
```

---

## 3. Reference Model: How Layout Keys Reference Keycaps

### Default case: no `capRef` (90% of keys)

```json
// Layout key — no capRef
{ "id": "KeyA", "keyName": "KeyA", "label": "A", "x": 1.75, "y": 3.25, "w": 1, "kind": "alpha" }
```

The normalization layer:
1. Looks at the active keycap preset's `profile.rows` rules
2. Determines this key is in row 3 (from `y` position or `cluster` hint)
3. Applies the Cherry R3 sculpt parameters
4. Produces a procedural cap with row-appropriate geometry

**No capRef needed. The profile system handles it.**

### Special case: explicit `capRef`

```json
// Layout key — artisan Escape cap
{ "id": "Escape", "keyName": "Escape", "label": "Esc", "x": 0, "y": 0, "w": 1, "kind": "accent", "capRef": "dragon-artisan" }
```

The normalization layer:
1. Looks up `"dragon-artisan"` in the keycap preset's `caps` dictionary
2. Finds it's a mesh-backed cap → resolves the mesh URL
3. Produces a mesh-backed ResolvedCap

### How row assignment works

The normalization layer maps `key.y` (or `key.cluster`) to a row index:

```
y < 1.0     → row 0 (function row)
1.0 ≤ y < 2 → row 1 (number row)
2.0 ≤ y < 3 → row 2 (QWERTY)
3.0 ≤ y < 4 → row 3 (home)
4.0 ≤ y < 5 → row 4 (shift)
y ≥ 5.0     → row 5 (bottom)
```

Or, if the profile family provides a `clusterToRow` mapping:
```
"fn-row" → 0, "number-row" → 1, "alpha" → 2-4, "bottom-row" → 5
```

The profile family decides, not the layout.

---

## 4. Two Keycap Source Types

### Procedural (parametric) caps

```json
{
  "id": "cherry-homing",
  "name": "Cherry Homing Bar",
  "type": "procedural",
  "geometry": {
    "topWidth": 0.82,
    "topDepth": 0.82,
    "height": 0.38,
    "cornerRadius": 0.06,
    "dishType": "cylindrical",
    "dishDepth": 0.08
  },
  "tags": ["homing"]
}
```

The 3D renderer creates geometry from these parameters. No mesh file needed.

### Mesh-backed caps

```json
{
  "id": "dragon-artisan",
  "name": "Dragon Artisan Escape",
  "type": "mesh",
  "mesh": {
    "format": "glb",
    "url": "/assets/caps/dragon-artisan.glb",
    "scale": 0.95,
    "rotationOffset": [0, 0, 0],
    "originOffset": [0, 0.02, 0]
  },
  "fitSizes": [1],
  "tags": ["artisan", "novelty", "escape"]
}
```

The 3D renderer loads the mesh, positions it at the key location, and scales it. The 2D editor can show a thumbnail or fallback silhouette.

---

## 5. Example JSON

### A. Keyboard layout document (unchanged layout, with one `capRef`)

```json
{
  "schema": "eletypes-kbd/1",
  "meta": { "name": "My Custom 75%" },
  "board": {
    "id": "my-custom-75",
    "formFactor": "75%",
    "layoutStagger": "row-staggered",
    "standard": "ANSI",
    "width": 16.25,
    "height": 6.25
  },
  "layout": {
    "keys": [
      { "id": "Escape", "keyName": "Escape", "label": "Esc", "x": 0, "y": 0, "w": 1, "kind": "accent", "capRef": "dragon-artisan" },
      { "id": "KeyA",   "keyName": "KeyA",   "label": "A",   "x": 1.75, "y": 3.25, "w": 1 },
      { "id": "KeyF",   "keyName": "KeyF",   "label": "F",   "x": 4.75, "y": 3.25, "w": 1, "capRef": "cherry-homing" },
      { "id": "Space",  "keyName": "Space",  "label": "",    "x": 3.75, "y": 5.25, "w": 6.25, "kind": "accent" }
    ]
  }
}
```

### B. Keycap preset document

```json
{
  "schema": "eletypes-cap/1",
  "id": "cherry-profile",
  "meta": {
    "name": "Cherry MX Profile",
    "author": "eletypes"
  },
  "profile": {
    "id": "cherry",
    "name": "Cherry MX",
    "uniform": false,
    "rows": {
      "0": { "topAngle": -6,  "height": 1.0, "depth": 0.04 },
      "1": { "topAngle": -3,  "height": 0.95, "depth": 0.04 },
      "2": { "topAngle": 0,   "height": 0.9,  "depth": 0.05 },
      "3": { "topAngle": 5,   "height": 0.88, "depth": 0.05 },
      "4": { "topAngle": 9,   "height": 0.92, "depth": 0.04 },
      "5": { "topAngle": 5,   "height": 0.9,  "depth": 0.03 }
    },
    "defaultCap": {
      "topWidth": 0.85,
      "topDepth": 0.85,
      "height": 0.38,
      "cornerRadius": 0.06,
      "dishType": "cylindrical",
      "dishDepth": 0.05
    }
  },
  "caps": {
    "cherry-homing": {
      "id": "cherry-homing",
      "name": "Cherry Homing Bar",
      "type": "procedural",
      "geometry": {
        "topWidth": 0.82,
        "topDepth": 0.82,
        "height": 0.38,
        "cornerRadius": 0.06,
        "dishType": "cylindrical",
        "dishDepth": 0.08
      },
      "tags": ["homing"]
    }
  }
}
```

### C. Custom mesh-backed keycap (can be a standalone document or embedded in a keycap preset)

```json
{
  "schema": "eletypes-cap/1",
  "id": "artisan-collection",
  "meta": { "name": "My Artisan Caps" },
  "profile": {
    "id": "cherry",
    "name": "Cherry MX",
    "uniform": false,
    "defaultCap": {
      "topWidth": 0.85,
      "topDepth": 0.85,
      "height": 0.38,
      "cornerRadius": 0.06,
      "dishType": "cylindrical",
      "dishDepth": 0.05
    }
  },
  "caps": {
    "dragon-artisan": {
      "id": "dragon-artisan",
      "name": "Dragon Artisan Escape",
      "type": "mesh",
      "mesh": {
        "format": "glb",
        "url": "/assets/caps/dragon-artisan.glb",
        "scale": 0.95
      },
      "fitSizes": [1],
      "tags": ["artisan", "novelty"]
    }
  }
}
```

### D. Normalized output (what the 3D renderer sees)

```json
{
  "board": { "id": "my-custom-75", "width": 16.25, "height": 6.25 },
  "keys": [
    {
      "id": "Escape",
      "keyName": "Escape",
      "label": "Esc",
      "x": 0, "y": 0, "w": 1, "h": 1,
      "kind": "accent",
      "color": "#3d3d42",
      "legendColor": "#ffffff",
      "cap": {
        "type": "mesh",
        "mesh": { "format": "glb", "url": "/assets/caps/dragon-artisan.glb", "scale": 0.95 },
        "profileFamily": "cherry"
      }
    },
    {
      "id": "KeyA",
      "keyName": "KeyA",
      "label": "A",
      "x": 1.75, "y": 3.25, "w": 1, "h": 1,
      "kind": "alpha",
      "color": "#2a2a2e",
      "legendColor": "#cccccc",
      "cap": {
        "type": "procedural",
        "geometry": { "topWidth": 0.85, "topDepth": 0.85, "height": 0.38, "cornerRadius": 0.06, "dishType": "cylindrical", "dishDepth": 0.05 },
        "sculpt": { "topAngle": 5, "height": 0.88, "depth": 0.05 },
        "profileFamily": "cherry"
      }
    }
  ]
}
```

---

## 6. MVP Scope Recommendation

### V1: Implement now

- **Layout schema**: already done (`eletypes-kbd/1`), add `capRef` as optional field
- **Keycap preset: Cherry profile only**: procedural geometry with row sculpting rules
- **Normalization function**: `normalizeKeyboard(layout, keycapPreset, visualPreset?)` → `NormalizedKeyboard`
- **3D renderer**: read `cap.geometry` + `cap.sculpt` to produce per-row keycap shapes (instead of uniform boxes)
- **Profile switching in demo**: Cherry, DSA (uniform), SA — proves the system works

### V1.5: Implement soon after

- **More profile presets**: OEM, XDA, MT3, low-profile
- **Homing key support**: `capRef: "cherry-homing"` for F/J keys
- **Visual preset**: basic color themes (GMK-style colorways)
- **2D editor**: show profile family selector, highlight keys with capRef

### V2: Defer intentionally

- **Mesh-backed caps**: GLB import, asset management, thumbnail generation
- **Custom cap editor**: design your own cap geometry
- **Case/shell preset system**: separate case schema
- **Per-key color painting in editor**
- **Keycap marketplace / sharing**

### What stays OUT of V1 layout schema

- No `meshPath` on keys — ever
- No `geometry` params on keys — that's the keycap schema's job
- No `material` on keys — that's the visual schema's job
- `capRef` is the only bridge between layout and keycaps

---

## 7. Product Reasoning: Why Keycaps Before Cases

### What users can do with layout + keycaps (no case needed)

1. Design a layout → pick a profile → see sculpted 3D keys → share
2. Try Cherry vs SA on the same layout → compare visual feel
3. Place an artisan cap on Escape → see how it looks
4. Switch between DSA (flat) and Cherry (sculpted) → understand why profile matters
5. Export a layout+keycap preset as JSON → import in another session

### What users need case modeling for

1. See how the board looks as a complete product (aesthetic, not functional)
2. Simulate LED underglow
3. Visualize mounting angle
4. Compare case materials

These are secondary to the core layout + keycap design loop. A generic case shell is sufficient until users specifically request case customization.

### The priority order

```
Layout schema  ████████████ (done)
Keycap schema  ████████     (next)
Visual schema  ██████       (soon)
Case schema    ████         (later)
```

This matches how keyboard enthusiasts actually think about design:
"I want a 75% with Cherry profile caps in GMK Botanical colors" — layout, keycap, visual. The case is assumed.

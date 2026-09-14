/**
 * Normalization Pipeline
 *
 * Merges layout + keycap + visual schemas into a renderer-ready NormalizedKeyboard.
 * This is the single function both 2D and 3D renderers call.
 *
 * Resolution order per key:
 *   1. Start with layout key (id, keyName, label, x, y, w, h, kind)
 *   2. Resolve cap: if capRef → look up in keycap.caps. Else → profile row rules.
 *   3. Resolve color: visual.keyOverrides[id] > visual.colors[kind] > fallback.
 *   4. Produce NormalizedKey.
 */

import { KEY_DEFAULTS } from "../types/layout";

// ─── Row detection from Y position ───
// Maps a key's Y coordinate to a profile row index (0-5).
// This is how the normalization layer decides which row sculpt to apply.
const yToRow = (y) => {
  if (y < 1.0) return 0;   // Function row
  if (y < 2.0) return 1;   // Number row
  if (y < 3.0) return 2;   // QWERTY
  if (y < 4.0) return 3;   // Home
  if (y < 5.0) return 4;   // Shift
  return 5;                 // Bottom
};

// ─── Resolve a single key's cap ───
const resolveCap = (key, keycapPreset) => {
  if (!keycapPreset) {
    // No keycap preset — return a simple default
    return { type: "procedural", profileFamily: "default" };
  }

  const profile = keycapPreset.profile;

  // 1. Check for explicit capRef → named cap definition
  if (key.capRef && keycapPreset.caps?.[key.capRef]) {
    const capDef = keycapPreset.caps[key.capRef];
    return {
      type: capDef.type,
      profileFamily: profile.id,
      geometry: capDef.type === "procedural" ? capDef.geometry : undefined,
      mesh: capDef.type === "mesh" ? capDef.mesh : undefined,
      sculpt: undefined, // Named caps define their own geometry, no row sculpt override
    };
  }

  // 2. Default: use profile family + row sculpting
  const row = yToRow(key.y);
  const rowSculpt = !profile.uniform && profile.rows ? profile.rows[row] : undefined;

  return {
    type: "procedural",
    profileFamily: profile.id,
    geometry: profile.defaultCap,
    sculpt: rowSculpt || undefined,
  };
};

// ─── Resolve a single key's color ───
const resolveColor = (key, visual) => {
  const fallbackColor = "#2a2a2e";
  const fallbackLegend = "#cccccc";

  if (!visual) {
    return { color: fallbackColor, legendColor: fallbackLegend };
  }

  // Per-key override takes priority
  const override = visual.keyOverrides?.[key.id];
  if (override?.color) {
    return {
      color: override.color,
      legendColor: override.legendColor || visual.colors?.legend || fallbackLegend,
    };
  }

  // Kind-based color lookup
  const kind = key.kind || "alpha";
  const kindColorMap = {
    alpha: visual.colors?.alpha,
    accent: visual.colors?.accent,
    mod: visual.colors?.mod || visual.colors?.accent,
    fn: visual.colors?.fn || visual.colors?.alpha,
    nav: visual.colors?.alpha,
    arrow: visual.colors?.alpha,
  };

  const isAccent = kind === "accent" || kind === "mod";

  return {
    color: kindColorMap[kind] || visual.colors?.alpha || fallbackColor,
    legendColor: isAccent
      ? (visual.colors?.legendAccent || visual.colors?.legend || fallbackLegend)
      : (visual.colors?.legend || fallbackLegend),
  };
};

// ─── Main normalization function ───

/**
 * Normalize a keyboard preset into a renderer-ready model.
 *
 * @param {import('../types/layout').LayoutPreset} layout
 * @param {import('../types/keycap').KeycapPreset} [keycapPreset]
 * @param {import('../types/visual').VisualPreset} [visualPreset]
 * @returns {import('../types/normalized').NormalizedKeyboard}
 */
export const normalizeKeyboard = (layout, keycapPreset, visualPreset) => {
  const keys = (layout.layout?.keys || []).map((key) => {
    const cap = resolveCap(key, keycapPreset);
    const { color, legendColor } = resolveColor(key, visualPreset);

    return {
      // Identity
      id: key.id,
      keyName: key.keyName,
      label: key.label,

      // Geometry (with defaults applied)
      x: key.x,
      y: key.y,
      w: key.w,
      h: key.h ?? KEY_DEFAULTS.h,
      r: key.r ?? KEY_DEFAULTS.r,

      // Annotations
      kind: key.kind ?? KEY_DEFAULTS.kind,
      cluster: key.cluster,

      // Resolved keycap
      cap,

      // Resolved visual
      color,
      legendColor,

      // Material hints (from visual, applied globally)
      material: visualPreset?.material,
    };
  });

  return {
    board: layout.board,
    keys,
  };
};

/**
 * Quick accessor: extract just the render-relevant fields for the 3D InstancedMesh.
 * Avoids passing the full normalized model into the hot render path.
 */
export const extractRenderData = (normalized) => ({
  positions: normalized.keys.map((k) => ({ x: k.x, y: k.y, w: k.w, h: k.h, r: k.r })),
  colors: normalized.keys.map((k) => k.color),
  caps: normalized.keys.map((k) => k.cap),
  bounds: { width: normalized.board.width, height: normalized.board.height },
});

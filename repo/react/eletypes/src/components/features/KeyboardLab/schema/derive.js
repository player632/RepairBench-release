/**
 * Runtime derivation functions.
 * Pure functions: preset data in → derived data out.
 * Memoization happens at the React layer (useMemo), not here.
 */

/**
 * Compute bounding box from keys array.
 * @param {Array<KeyDef>} keys
 * @returns {{ width: number, height: number }}
 */
export const computeBounds = (keys) => {
  let w = 0, h = 0;
  for (const k of keys) {
    w = Math.max(w, k.x + k.w);
    h = Math.max(h, k.y + (k.h || 1));
  }
  return { width: w, height: h };
};

/**
 * Build lookup map: id | keyName | label → key index.
 * Used by triggerKey() for O(1) resolution.
 * @param {Array<KeyDef>} keys
 * @returns {Map<string, number>}
 */
export const buildKeyIndex = (keys) => {
  const map = new Map();
  keys.forEach((key, i) => {
    // Primary: id
    map.set(key.id, i);
    // Secondary: keyName (KeyboardEvent.code)
    if (key.keyName && key.keyName !== key.id && !map.has(key.keyName)) {
      map.set(key.keyName, i);
    }
    // Tertiary: label shorthand (e.g., "A", "Esc")
    if (key.label && key.label !== key.id && key.label !== key.keyName && !map.has(key.label)) {
      map.set(key.label, i);
    }
  });
  return map;
};

/**
 * Build KeyboardEvent.code → key id map.
 * Used by the integration layer to translate DOM events.
 * @param {Array<KeyDef>} keys
 * @returns {Map<string, string>}
 */
export const buildCodeMap = (keys) => {
  const map = new Map();
  for (const key of keys) {
    map.set(key.keyName, key.id);
  }
  return map;
};

/** @param {{ kind: string }} key */
export const isAccentKey = (key) => key.kind === "accent";

/**
 * Group keys by cluster.
 * @param {Array<KeyDef>} keys
 * @returns {Map<string, Array<KeyDef>>}
 */
export const groupByCluster = (keys) => {
  const groups = new Map();
  for (const key of keys) {
    const c = key.cluster || "unclustered";
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(key);
  }
  return groups;
};

/**
 * Extract the keys array from a preset, handling both full preset
 * and raw keys array for backwards compatibility.
 * @param {Object|Array} presetOrKeys
 * @returns {Array<KeyDef>}
 */
export const extractKeys = (presetOrKeys) => {
  if (Array.isArray(presetOrKeys)) return presetOrKeys;
  if (presetOrKeys?.layout?.keys) return presetOrKeys.layout.keys;
  if (presetOrKeys?.keys) return presetOrKeys.keys;
  return [];
};

// ─── Legend position parsing ───

// Default inset (fractional distance from the keycap edge toward center).
// 0.08 = 8% padding from edge, which matches the legacy hardcoded behavior.
const DEFAULT_LEGEND_INSET = 0.08;
// Clamp bounds: at least 2% margin so the anchor never sits on the edge, and
// no more than 45% so it never crosses center (which would defeat the anchor).
const LEGEND_INSET_MIN = 0.02;
const LEGEND_INSET_MAX = 0.45;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Parse a legend position value. Accepts two forms:
 *   - String: `"center"` | `"top-left"` | ... (legacy)
 *   - Object: `{ anchor: "top-left", inset?: { x: number, z: number } }`
 *
 * Returns derived rendering data: Text anchor values and the final
 * offset-from-center as a fraction of keycap size (in [-0.48, 0.48]).
 *
 * This is the single source of truth for legend placement — renderer and UI
 * should both go through here so position behavior stays consistent.
 */
export const parseLegendPosition = (position) => {
  let anchor = "center";
  let insetX = DEFAULT_LEGEND_INSET;
  let insetZ = DEFAULT_LEGEND_INSET;

  if (typeof position === "string") {
    anchor = position || "center";
  } else if (position && typeof position === "object") {
    anchor = position.anchor || "center";
    if (position.inset) {
      if (typeof position.inset.x === "number") insetX = position.inset.x;
      if (typeof position.inset.z === "number") insetZ = position.inset.z;
    }
  }

  // Guarantee the anchor stays safely inside the keycap.
  insetX = clamp(insetX, LEGEND_INSET_MIN, LEGEND_INSET_MAX);
  insetZ = clamp(insetZ, LEGEND_INSET_MIN, LEGEND_INSET_MAX);

  const anchorX = anchor.includes("left") ? "left" : anchor.includes("right") ? "right" : "center";
  const anchorY = anchor.includes("top") ? "top" : anchor.includes("bottom") ? "bottom" : "middle";

  // Convert inset-from-edge to offset-from-center (both as fractions of keycap size).
  //   inset=0 → anchor at edge (±0.5 offset)
  //   inset=0.5 → anchor at center (0 offset)
  const offXFrac = anchorX === "left" ? -(0.5 - insetX) : anchorX === "right" ? (0.5 - insetX) : 0;
  const offZFrac = anchorY === "top" ? -(0.5 - insetZ) : anchorY === "bottom" ? (0.5 - insetZ) : 0;

  return { anchor, anchorX, anchorY, insetX, insetZ, offXFrac, offZFrac };
};

export const LEGEND_INSET_DEFAULTS = { x: DEFAULT_LEGEND_INSET, z: DEFAULT_LEGEND_INSET };
export const LEGEND_INSET_RANGE = { min: LEGEND_INSET_MIN, max: LEGEND_INSET_MAX };

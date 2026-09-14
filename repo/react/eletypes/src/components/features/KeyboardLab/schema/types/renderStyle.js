/**
 * eletypes-renderStyle/1 — Visual style layer for the 3D keyboard renderer.
 *
 * Sits alongside `refs` and `overrides` on the design doc:
 *   design.renderStyle = { mode, <mode-specific params> }
 *
 * Modes are orthogonal to the rest of the schema — changing renderStyle.mode
 * does NOT touch layout / keycap / legend / shell / caseProfile assets. Only
 * the renderer picks a different material pipeline.
 *
 * Phase 1 (Apr 2026): PBR, cel-hard, lofi-flat implemented end-to-end.
 * Other modes (risograph, painterly, pixel, blueprint, x-ray) are accepted
 * in the schema and fall back to PBR until the render path lands.
 */

export const RENDER_STYLE_SCHEMA = "eletypes-renderStyle/1";

// Single-mode identifiers. `mode` may also be a 2-tuple of these for layer blend.
export const RENDER_MODES = Object.freeze([
  "pbr",
  "cel-hard",
  "lofi-flat",
  "blueprint",
  "x-ray",
  "neon",
  "risograph",
  "painterly",
  "pixel",
]);

// Which modes are actually wired in the renderer right now. The rest fall back
// to PBR. Update this set as more pipelines ship.
export const IMPLEMENTED_MODES = new Set([
  "pbr", "cel-hard", "lofi-flat", "blueprint", "x-ray", "neon",
  "risograph", "pixel",
]);

// ─── Per-mode defaults ───
// Each mode keeps its own parameter pack under a key that matches the mode
// (minus the hyphen). Splitting by mode avoids cross-mode field collisions
// and lets the parser ignore unknown sub-keys.

export const RENDER_STYLE_DEFAULTS = Object.freeze({
  pbr: {},
  cel: {
    gradientSteps: 3,      // 2–6 banded shading steps
    outlineWidth: 0.03,    // World-space expansion of the backface outline
    outlineColor: "#1a1a1a",
    shadowColor: "#00000040",
  },
  flat: {
    shadowOpacity: 0.0,    // 0 kills the shadow entirely
    microGradient: 0.05,   // Tiny lighting variation so it isn't completely dead
  },
  risograph: {
    gradientSteps: 2,
    noiseAmount: 0.08,
    channelOffset: [2, -1],
    paperTexture: true,
    inkColors: ["#e8175d", "#0078bf"],
    dither: true,
  },
  blueprint: {
    bgColor: "#0d2137",
    lineColor: "#5ba3d9",
    gridColor: "#1a3a5c",
    annotate: true,
  },
  pixel: {
    resolution: 128,
    colorSteps: 8,
  },
  painterly: {
    brushScale: 0.35,
    strokeJitter: 0.15,
  },
  xray: {
    opacity: 0.25,          // body transparency
    wireframe: true,        // show edges
    tint: "#9cdcff",        // optional hue override; null/"" = use instance color
  },
  neon: {
    emissiveIntensity: 1.4, // 0–3, brightness of the glow
    metalness: 0.0,
    roughness: 0.55,
  },
});

export const DEFAULT_RENDER_STYLE = Object.freeze({
  schema: RENDER_STYLE_SCHEMA,
  mode: "pbr",
});

// ─── Parser / resolver ───

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const isMode = (m) => typeof m === "string" && RENDER_MODES.includes(m);

/**
 * Normalize a renderStyle value into a consistent shape the renderer can
 * consume. Accepts:
 *   - undefined / null → default PBR
 *   - { mode: "cel-hard", cel: {...} } — single mode
 *   - { mode: ["cel-hard", "risograph"], blend, cel, risograph } — layer blend
 *
 * Missing fields are filled from defaults. Out-of-range values clamped.
 * Unknown modes fall back to PBR (safer than throwing in the render loop).
 *
 * Returns a well-formed object with:
 *   { mode, modes, isBlend, blend, cel, flat, risograph, ... }
 */
export function resolveRenderStyle(input) {
  const rs = input || {};
  let modes;
  let isBlend = false;
  let blend = 0.5;

  if (Array.isArray(rs.mode) && rs.mode.length === 2 && rs.mode.every(isMode)) {
    modes = [...rs.mode];
    isBlend = true;
    blend = clamp(typeof rs.blend === "number" ? rs.blend : 0.5, 0, 1);
  } else if (isMode(rs.mode)) {
    modes = [rs.mode];
  } else {
    modes = ["pbr"];
  }

  // Merge each mode's params with its defaults.
  const params = {};
  for (const section of ["cel", "flat", "risograph", "blueprint", "pixel", "painterly", "xray", "neon"]) {
    params[section] = { ...RENDER_STYLE_DEFAULTS[section], ...(rs[section] || {}) };
  }

  // Field-level clamping for values that could misrender.
  if (typeof params.cel.gradientSteps === "number") {
    params.cel.gradientSteps = clamp(Math.round(params.cel.gradientSteps), 2, 6);
  }
  if (typeof params.cel.outlineWidth === "number") {
    params.cel.outlineWidth = clamp(params.cel.outlineWidth, 0, 0.2);
  }
  if (typeof params.flat.microGradient === "number") {
    params.flat.microGradient = clamp(params.flat.microGradient, 0, 0.5);
  }
  if (typeof params.pixel.resolution === "number") {
    params.pixel.resolution = clamp(Math.round(params.pixel.resolution), 32, 512);
  }
  if (typeof params.xray.opacity === "number") {
    params.xray.opacity = clamp(params.xray.opacity, 0.05, 0.95);
  }
  if (typeof params.neon.emissiveIntensity === "number") {
    params.neon.emissiveIntensity = clamp(params.neon.emissiveIntensity, 0, 3);
  }

  const primary = modes[0];
  return {
    schema: RENDER_STYLE_SCHEMA,
    mode: isBlend ? modes : primary,
    modes,
    primary,
    secondary: isBlend ? modes[1] : null,
    isBlend,
    blend,
    implemented: IMPLEMENTED_MODES.has(primary) && (!isBlend || IMPLEMENTED_MODES.has(modes[1])),
    ...params,
  };
}

/**
 * Merge a per-key `_renderOverride` onto the base resolved renderStyle.
 * Only sub-sections present in the override replace the corresponding fields.
 */
export function mergeKeyRenderOverride(baseResolved, keyOverride) {
  if (!keyOverride) return baseResolved;
  const merged = { ...baseResolved };
  for (const section of ["cel", "flat", "risograph", "blueprint", "pixel", "painterly", "xray", "neon"]) {
    if (keyOverride[section]) {
      merged[section] = { ...baseResolved[section], ...keyOverride[section] };
    }
  }
  return merged;
}

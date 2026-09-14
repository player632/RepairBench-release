/**
 * Built-in render style presets. Each entry is a valid renderStyle doc
 * (schema eletypes-renderStyle/1) that the Style card writes into
 * design.renderStyle when the user picks it.
 *
 * Only `default` (pbr) and `toon` (cel-hard) are fully implemented in
 * Phase 1. The others are accepted by the schema and fall back to PBR
 * in the renderer — switching the preset is still useful as a forward-
 * compatible JSON edit.
 */

export const RENDER_STYLE_PRESETS = {
  default: {
    schema: "eletypes-renderStyle/1",
    id: "default",
    meta: { name: "PBR (Default)" },
    mode: "pbr",
  },
  toon: {
    schema: "eletypes-renderStyle/1",
    id: "toon",
    meta: { name: "Toon (cel-hard)" },
    mode: "cel-hard",
    cel: {
      gradientSteps: 3,
      outlineWidth: 0.03,
      outlineColor: "#1a1a1a",
      shadowColor: "#00000040",
    },
  },
  lofi: {
    schema: "eletypes-renderStyle/1",
    id: "lofi",
    meta: { name: "Lo-fi (blended)" },
    // Phase 2: layer blend cel-hard × risograph. For now the renderer will
    // honor only the primary mode (cel-hard); risograph takes over once its
    // shader lands.
    mode: ["cel-hard", "risograph"],
    blend: 0.5,
    cel: { gradientSteps: 3, outlineWidth: 0.025 },
    risograph: { noiseAmount: 0.06, dither: true },
  },
  flat: {
    schema: "eletypes-renderStyle/1",
    id: "flat",
    meta: { name: "Flat (Monument Valley)" },
    mode: "lofi-flat",
    flat: { shadowOpacity: 0.0, microGradient: 0.05 },
  },
  blueprint: {
    schema: "eletypes-renderStyle/1",
    id: "blueprint",
    meta: { name: "Blueprint" },
    mode: "blueprint",
    blueprint: {
      bgColor: "#0d2137",
      lineColor: "#5ba3d9",
      gridColor: "#1a3a5c",
      annotate: true,
    },
  },
  pixel: {
    schema: "eletypes-renderStyle/1",
    id: "pixel",
    meta: { name: "Pixel (8-bit)" },
    mode: "pixel",
    pixel: { resolution: 128, colorSteps: 8 },
  },
  xray: {
    schema: "eletypes-renderStyle/1",
    id: "xray",
    meta: { name: "X-ray (hollow)" },
    mode: "x-ray",
    xray: { opacity: 0.25, wireframe: true, tint: null },
  },
  neon: {
    schema: "eletypes-renderStyle/1",
    id: "neon",
    meta: { name: "Neon (glow)" },
    mode: "neon",
    neon: { emissiveIntensity: 1.4, metalness: 0.0, roughness: 0.55 },
  },
};

export const listRenderStylePresets = () =>
  Object.values(RENDER_STYLE_PRESETS).map((p) => ({ id: p.id, name: p.meta.name }));

export const getRenderStylePreset = (id) =>
  RENDER_STYLE_PRESETS[id] || RENDER_STYLE_PRESETS.default;

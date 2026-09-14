/**
 * Schema barrel export — single import point for all schema concerns.
 */

// Types / constants
export { LAYOUT_SCHEMA_VERSION, FORM_FACTORS, LAYOUT_STAGGERS, STANDARDS, KEY_KINDS, KEY_DEFAULTS } from "./types/layout";
export { KEYCAP_SCHEMA_VERSION, PROFILE_IDS } from "./types/keycap";
export { VISUAL_SCHEMA_VERSION } from "./types/visual";
export { LEGEND_SCHEMA_VERSION } from "./types/legend";
export { SHELL_SCHEMA_VERSION } from "./types/shell";
export { DESIGN_SCHEMA_VERSION, createDesign } from "./types/design";

// Validation
export { validateLayout, validateKeycap, validateVisual, validateShell, validateDesign } from "./validation/validate";

// Normalization
export { normalizeKeyboard, extractRenderData } from "./normalize/normalize";
export { resolveDesign, designFromSelections } from "./normalize/resolveDesign";

// Asset resolution
export { bundledResolver, listBundledAssets, listBundledByType, parseAssetRef } from "./resolve/assetResolver";

// Derivation
export { computeBounds, buildKeyIndex, buildCodeMap, isAccentKey, extractKeys, groupByCluster } from "./derive";

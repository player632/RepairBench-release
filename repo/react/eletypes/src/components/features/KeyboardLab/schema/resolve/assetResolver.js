/**
 * Asset resolver — maps asset ref strings to asset documents.
 *
 * Asset ref format: "{type}/{id}@{version}"
 * Example: "layout/generic-75-ansi@1"
 *
 * The bundled resolver loads from imported presets.
 * Future: chain with localStorage resolver and remote API resolver.
 */

import generic75 from "../../presets/generic75";
import cyberboard75 from "../../presets/cyberboard75";
import layout60 from "../../presets/layout60";
import layout65 from "../../presets/layout65";
import layoutTKL from "../../presets/layoutTKL";
import layoutFullSize from "../../presets/layoutFullSize";
import layoutHHKB from "../../presets/layoutHHKB";
import { CHERRY_PROFILE, OEM_PROFILE, SA_PROFILE, MT3_PROFILE, KAT_PROFILE, DSA_PROFILE, XDA_PROFILE, LOW_PROFILE } from "../../presets/keycaps";
import { LEGEND_PRESETS } from "../../presets/legends";
import { DEFAULT_SHELL, SLIM_SHELL, WIDE_BEZEL_SHELL, ANGULAR_SHELL, TOP_HEAVY_SHELL } from "../shellProfile";
import { CYBERBOARD_WEDGE_PROFILE, FLAT_BOX_PROFILE, CHAMFERED_WEDGE_PROFILE, ERGONOMIC_PROFILE } from "../../presets/profiles";
import { RENDER_STYLE_PRESETS } from "../../presets/renderStyles";

// ─── Bundled asset registry ───

const BUNDLED = {
  // Layouts
  "layout/generic-75-ansi@1": generic75,
  "layout/cyberboard-75-ansi@1": cyberboard75,
  "layout/60-ansi@1": layout60,
  "layout/65-ansi@1": layout65,
  "layout/tkl-ansi@1": layoutTKL,
  "layout/full-ansi@1": layoutFullSize,
  "layout/hhkb-60-ansi@1": layoutHHKB,

  // Keycap profiles
  "keycap/cherry-classic@1": CHERRY_PROFILE,
  "keycap/oem-classic@1": OEM_PROFILE,
  "keycap/sa-classic@1": SA_PROFILE,
  "keycap/mt3-sculpted@1": MT3_PROFILE,
  "keycap/kat-sculpted@1": KAT_PROFILE,
  "keycap/dsa-uniform@1": DSA_PROFILE,
  "keycap/xda-uniform@1": XDA_PROFILE,
  "keycap/low-profile@1": LOW_PROFILE,

  // Legends
  "legend/gmk-center@1": LEGEND_PRESETS["gmk-classic"],
  "legend/minimalist@1": LEGEND_PRESETS["minimalist"],
  "legend/retro@1": LEGEND_PRESETS["retro"],
  "legend/top-print@1": LEGEND_PRESETS["top-print"],
  "legend/cyber@1": LEGEND_PRESETS["cyber"],
  "legend/blank@1": LEGEND_PRESETS["blank"],

  // Shells
  "shell/standard@1": DEFAULT_SHELL,
  "shell/slim@1": SLIM_SHELL,
  "shell/wide-bezel@1": WIDE_BEZEL_SHELL,
  "shell/angular@1": ANGULAR_SHELL,
  "shell/top-heavy@1": TOP_HEAVY_SHELL,

  // Case profiles (case + mount)
  "caseProfile/cyberboard-wedge@1": CYBERBOARD_WEDGE_PROFILE,
  "caseProfile/flat-box@1": FLAT_BOX_PROFILE,
  "caseProfile/chamfered-wedge@1": CHAMFERED_WEDGE_PROFILE,
  "caseProfile/ergonomic@1": ERGONOMIC_PROFILE,

  // Render styles — visual pipeline assets; one ref applies globally. Scope
  // variants (renderStyle/*-keycap, etc.) can be registered here when the
  // renderer gains per-subsystem scope in Phase 2.
  "renderStyle/default@1":   RENDER_STYLE_PRESETS.default,
  "renderStyle/toon@1":      RENDER_STYLE_PRESETS.toon,
  "renderStyle/lofi@1":      RENDER_STYLE_PRESETS.lofi,
  "renderStyle/flat@1":      RENDER_STYLE_PRESETS.flat,
  "renderStyle/blueprint@1": RENDER_STYLE_PRESETS.blueprint,
  "renderStyle/xray@1":      RENDER_STYLE_PRESETS.xray,
  "renderStyle/neon@1":      RENDER_STYLE_PRESETS.neon,
  "renderStyle/pixel@1":     RENDER_STYLE_PRESETS.pixel,
};

/**
 * Register a runtime-imported asset (e.g., a KLE import) into the bundled registry.
 * The asset becomes resolvable via bundledResolver and visible to listBundledByType.
 */
export function registerBundled(ref, doc) {
  BUNDLED[ref] = doc;
}

/**
 * Resolve an asset reference to its document.
 * @param {string} assetRef — e.g., "layout/generic-75-ansi@1"
 * @returns {Promise<Object>} The resolved asset document
 * @throws {Error} If asset not found
 */
export async function bundledResolver(assetRef) {
  const asset = BUNDLED[assetRef];
  if (!asset) {
    throw new Error(`Unknown asset: "${assetRef}". Available: ${Object.keys(BUNDLED).join(", ")}`);
  }
  return asset;
}

/**
 * List all available bundled assets.
 * @returns {Array<{ref: string, type: string, name: string}>}
 */
export function listBundledAssets() {
  return Object.entries(BUNDLED).map(([ref, doc]) => ({
    ref,
    type: ref.split("/")[0],
    name: doc.meta?.name || doc.id || ref,
  }));
}

/**
 * List bundled assets filtered by type.
 * @param {string} type — "layout"|"keycap"|"legend"|"visual"|"shell"
 */
export function listBundledByType(type) {
  return listBundledAssets().filter((a) => a.type === type);
}

/**
 * Parse an asset ref into its components.
 * @param {string} ref — "layout/generic-75-ansi@1"
 * @returns {{ type: string, id: string, version: string }}
 */
export function parseAssetRef(ref) {
  const match = ref.match(/^([a-zA-Z]+)\/([\w-]+)@(\w+)$/);
  if (!match) throw new Error(`Invalid asset ref: "${ref}"`);
  return { type: match[1], id: match[2], version: match[3] };
}

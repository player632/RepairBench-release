/**
 * Design Composition Schema — "eletypes-design/1"
 *
 * The orchestrator document. References assets by ref string, adds local overrides.
 * Users save/share/remix designs, not individual asset schemas.
 *
 * @typedef {Object} DesignDocument
 * @property {"eletypes-design/1"} schema
 * @property {string} id                    — Stable design identity
 * @property {DesignMeta} meta
 * @property {AssetRefs} refs               — Asset reference strings
 * @property {DesignOverrides} [overrides]   — Local overrides
 *
 * @typedef {Object} DesignMeta
 * @property {string} name
 * @property {number} revision              — Content revision (increments on save)
 * @property {string} createdAt             — ISO 8601
 * @property {string} updatedAt             — ISO 8601
 *
 * @typedef {Object} AssetRefs
 * Asset ref format: "{type}/{id}@{version}"
 * @property {string} layout                — Required: "layout/cyberboard-75-ansi@1"
 * @property {string} [keycap]              — "keycap/cherry-classic@1"
 * @property {string} [legend]              — "legend/gmk-center@1"
 * @property {string} [visual]              — "visual/botanical-dark@1"
 * @property {string} [shell]               — "shell/generic-75@1"
 * @property {string} [caseProfile]         — "caseProfile/cyberboard-wedge@1"
 *
 * @typedef {Object} DesignOverrides
 * @property {VisualOverrides} [visual]     — Color overrides (keycapColor, accentKeyColor, caseColor)
 * @property {OpacityOverrides} [opacity]   — Per-group opacity (keycap, accent, case, legend)
 * @property {LegendOverrides} [legend]     — Legend style overrides
 * @property {Object<string, KeyOverride>} [keys] — Per-key overrides by key id
 *
 * @typedef {Object} VisualOverrides
 * @property {string} [keycapColor]
 * @property {string} [accentKeyColor]
 * @property {string} [caseColor]
 *
 * @typedef {Object} OpacityOverrides
 * @property {number} [keycap]  — 0-1
 * @property {number} [accent]  — 0-1
 * @property {number} [case]    — 0-1
 * @property {number} [legend]  — 0-1
 *
 * @typedef {Object} LegendOverrides
 * @property {string} [color]
 * @property {number} [fontSize]
 * @property {number} [fontWeight]
 * @property {string} [fontFamily]
 *
 * @typedef {Object} KeyOverride
 * @property {string} [capRef]
 * @property {string} [color]
 * @property {string} [legendColor]
 * @property {string} [label]
 */

/**
 * Design Bundle Schema — "eletypes-design-bundle/1"
 *
 * The local persistence / import-export format.
 * Wraps a design document with embedded resolved asset docs for
 * self-contained offline storage and future share/publish.
 *
 * @typedef {Object} DesignBundle
 * @property {"eletypes-design-bundle/1"} schema
 * @property {string} savedAt               — ISO 8601, when the bundle was written
 * @property {DesignDocument} design         — The orchestrator design document
 * @property {EmbeddedAssets} embeddedAssets  — Full resolved asset docs
 *
 * @typedef {Object} EmbeddedAssets
 * @property {Object} [layout]
 * @property {Object} [keycap]
 * @property {Object} [legend]
 * @property {Object} [shell]
 * @property {Object} [caseProfile]
 */

export const DESIGN_SCHEMA_VERSION = "eletypes-design/1";
export const BUNDLE_SCHEMA_VERSION = "eletypes-design-bundle/1";

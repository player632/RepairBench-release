/**
 * Layout Schema Types — "eletypes-kbd/1"
 *
 * Defines keyboard structure, key identity, and 2D placement.
 * Does NOT contain rendering details, mesh paths, or cap geometry.
 * Uses `capRef` to abstractly reference keycap definitions.
 *
 * @typedef {"40%"|"60%"|"65%"|"75%"|"TKL"|"full"|"1800"|"Alice"|"split"} FormFactor
 * @typedef {"row-staggered"|"ortholinear"|"columnar"|"split"|"ergonomic"} LayoutStagger
 * @typedef {"ANSI"|"ISO"|"JIS"} Standard
 * @typedef {"alpha"|"mod"|"accent"|"fn"|"nav"|"arrow"} KeyKind
 *
 * @typedef {Object} LayoutPreset
 * @property {"eletypes-kbd/1"} schema
 * @property {PresetMeta} meta
 * @property {BoardSpec} board
 * @property {LayoutData} layout
 *
 * @typedef {Object} PresetMeta
 * @property {string} name
 * @property {string} [author]
 * @property {string} [version]
 * @property {string} [created]
 * @property {string} [description]
 *
 * @typedef {Object} BoardSpec
 * @property {string} id               — Stable board identity
 * @property {FormFactor} formFactor
 * @property {LayoutStagger} layoutStagger
 * @property {Standard} standard
 * @property {number} width            — Key-field bounding width in u
 * @property {number} height           — Key-field bounding height in u
 * @property {string} [keyboardType]
 * @property {number} [unitSize]       — Physical mm per 1u (default 19.05)
 * @property {string} [casePreset]     — Shell profile id
 * @property {Array} [modules]
 *
 * @typedef {Object} LayoutData
 * @property {KeyDef[]} keys
 *
 * @typedef {Object} KeyDef
 * @property {string} id
 * @property {string} keyName          — KeyboardEvent.code
 * @property {string} label            — Display text ("" for blank)
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} [h]              — Default 1
 * @property {number} [r]              — Rotation degrees, default 0
 * @property {number} [rx]             — Rotation origin X
 * @property {number} [ry]             — Rotation origin Y
 * @property {KeyKind} [kind]          — Default "alpha"
 * @property {string} [cluster]        — Grouping hint
 * @property {string} [capRef]         — References a cap in keycap schema
 */

export const LAYOUT_SCHEMA_VERSION = "eletypes-kbd/1";

// Enum sets for validation
export const FORM_FACTORS = ["40%", "60%", "65%", "75%", "TKL", "full", "1800", "Alice", "split"];
export const LAYOUT_STAGGERS = ["row-staggered", "ortholinear", "columnar", "split", "ergonomic"];
export const STANDARDS = ["ANSI", "ISO", "JIS"];
export const KEY_KINDS = ["alpha", "mod", "accent", "fn", "nav", "arrow"];

// Defaults applied during normalization (not stored when equal)
export const KEY_DEFAULTS = {
  h: 1,
  r: 0,
  kind: "alpha",
};

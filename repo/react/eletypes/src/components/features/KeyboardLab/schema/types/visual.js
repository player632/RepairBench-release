/**
 * Visual Schema Types — "eletypes-visual/1"
 *
 * Colors, legends, material hints. Independent of layout and keycap geometry.
 *
 * @typedef {Object} VisualPreset
 * @property {"eletypes-visual/1"} schema
 * @property {string} id
 * @property {{name:string, author?:string}} meta
 * @property {ColorSpec} colors
 * @property {CaseColorSpec} [case]
 * @property {MaterialSpec} [material]
 * @property {Object<string, KeyColorOverride>} [keyOverrides] — Sparse per-key overrides
 *
 * @typedef {Object} ColorSpec
 * @property {string} [alpha]         — Regular key color
 * @property {string} [accent]        — Accent key color
 * @property {string} [mod]           — Modifier color (falls back to accent)
 * @property {string} [fn]            — Function key color
 * @property {string} [legend]        — Legend text color
 * @property {string} [legendAccent]  — Legend on accent keys
 *
 * @typedef {Object} CaseColorSpec
 * @property {string} [primary]
 * @property {string} [accent]
 *
 * @typedef {Object} MaterialSpec
 * @property {"matte"|"glossy"|"textured"} [keycapFinish]
 * @property {number} [keycapRoughness]   — 0-1
 * @property {number} [keycapMetalness]   — 0-1
 * @property {"anodized"|"polished"|"matte"|"cerakote"} [caseFinish]
 *
 * @typedef {Object} KeyColorOverride
 * @property {string} [color]
 * @property {string} [legendColor]
 */

export const VISUAL_SCHEMA_VERSION = "eletypes-visual/1";

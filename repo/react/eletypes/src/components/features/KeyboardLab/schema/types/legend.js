/**
 * Legend Schema Types — "eletypes-legend/1"
 *
 * Defines how key labels are rendered on keycap surfaces.
 * Editable in real-time from the 2D/3D editor.
 *
 * @typedef {Object} LegendPreset
 * @property {"eletypes-legend/1"} schema
 * @property {string} id
 * @property {{name:string}} meta
 * @property {LegendStyle} style        — Default legend style for all keys
 * @property {Object<string, LegendOverride>} [keyOverrides] — Per-key overrides by key id
 *
 * @typedef {Object} LegendStyle
 * @property {string} fontFamily        — CSS font family
 * @property {number} fontSize          — Base font size in px (scaled by key width)
 * @property {number} [fontWeight]      — Default 600
 * @property {string} color             — Legend text color
 * @property {"center"|"top-left"|"top-center"|"bottom-left"|"bottom-center"} position — Where on the keycap
 * @property {number} [letterSpacing]   — In em units
 * @property {boolean} [uppercase]      — Force uppercase single-char labels
 *
 * @typedef {Object} LegendOverride
 * @property {string} [label]           — Override the displayed text
 * @property {string} [color]           — Override color for this key
 * @property {number} [fontSize]        — Override size for this key
 * @property {string} [subLabel]        — Secondary label (e.g., shift symbol)
 */

export const LEGEND_SCHEMA_VERSION = "eletypes-legend/1";
